import 'dotenv/config';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { supabase } from '../../src/config/supabaseClient.js';
import {
    OVERPASS_URLS, OVERPASS_TIMEOUT_S, OVERPASS_DELAY_MS, WIKI_BATCH_DELAY_MS, WIKI_THUMB_WIDTH, VIETNAM_BBOX,
    TAG_GROUPS, groupSelector, groupMatches, CATEGORY_LABELS, DIFFICULTY_BY_CATEGORY, DEFAULT_DIFFICULTY,
    NAME_BLACKLIST, DEFAULTS,
} from './config.mjs';
import { sleep, provinceKey, nameKey, distanceMeters, chunk, fetchWithRetry, csvEscape, USER_AGENT } from './lib.mjs';
import { buildPolygon } from './geo.mjs';

// ---------- CLI ----------
const args = process.argv.slice(2);
const opt = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const OUT_DIR = resolve(opt('out', 'scripts/scrape-locations/output'));
const CACHE_DIR = resolve(OUT_DIR, 'cache');
const LIMIT_PER_PROVINCE = Number(opt('limit-per-province', DEFAULTS.limitPerProvince));
const MIN_SCORE = Number(opt('min-score', DEFAULTS.minScore));
const ONLY_PROVINCES = opt('province', '').split(',').map(provinceKey).filter(Boolean);
const SKIP_WIKI = flag('no-wiki');
const REFRESH = flag('refresh');
mkdirSync(CACHE_DIR, { recursive: true });

// ---------- Overpass với cache đĩa, luân phiên endpoint, backoff khi bị giới hạn ----------
async function overpass(query, label, rounds = 6) {
    let lastError;
    for (let round = 1; round <= rounds; round++) {
        for (const url of OVERPASS_URLS) {
            const started = Date.now();
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    // Connection: close -> tránh socket keep-alive cũ bị máy chủ đóng gây "fetch failed" liên tục
                    headers: { 'User-Agent': USER_AGENT, Connection: 'close' },
                    body: 'data=' + encodeURIComponent(query),
                    signal: AbortSignal.timeout((OVERPASS_TIMEOUT_S + 30) * 1000),
                });
                const text = await res.text();
                if (!res.ok) {
                    const reason = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').match(/Error\s*:\s*(.{0,140})/)?.[1] ?? '';
                    throw new Error(`HTTP ${res.status} ${reason}`.trim());
                }
                const json = JSON.parse(text);
                if (json.remark && /error/i.test(json.remark)) throw new Error(json.remark.slice(0, 120));
                process.stdout.write(`(${new URL(url).host}, ${Math.round((Date.now() - started) / 1000)}s) `);
                return json;
            } catch (error) {
                lastError = error;
                const cause = error.cause?.code || error.cause?.message || '';
                process.stdout.write(`\n  ! ${label} @ ${new URL(url).host}: ${error.message}${cause ? ` (${cause})` : ''}\n`);
                await sleep(3000);
            }
        }
        if (round < rounds) {
            const wait = round * 30;
            console.warn(`  ! ${label}: đợi ${wait}s rồi thử lại (${round}/${rounds})`);
            await sleep(wait * 1000);
        }
    }
    throw lastError;
}

async function cached(name, producer) {
    const file = resolve(CACHE_DIR, `${name}.json`);
    if (!REFRESH && existsSync(file)) {
        process.stdout.write('(cache) ');
        return JSON.parse(readFileSync(file, 'utf8'));
    }
    const data = await producer();
    writeFileSync(file, JSON.stringify(data), 'utf8');
    return data;
}

// ---------- 1. Tỉnh trong DB <-> ranh giới OSM ----------
async function loadDbProvinces() {
    const { data, error } = await supabase.from('provinces').select('id, name');
    if (error) throw error;
    return data;
}

async function loadOsmProvinces() {
    const query = `[out:json][timeout:90];area["ISO3166-1"="VN"][admin_level=2]->.vn;relation["boundary"="administrative"]["admin_level"="4"](area.vn);out tags;`;
    const json = await cached('osm-provinces', () => overpass(query, 'Danh sách tỉnh OSM'));
    return json.elements.map((e) => ({ relationId: e.id, name: e.tags.name }));
}

async function loadProvincePolygon(relationId) {
    const json = await cached(`province-${relationId}`, () => overpass(`[out:json][timeout:120];relation(${relationId});out geom;`, `Ranh giới ${relationId}`));
    return buildPolygon(json.elements[0]);
}

// ---------- 2. Lấy POI toàn quốc theo từng nhóm thẻ ----------
async function loadGroupElements(group) {
    const query = `[out:json][timeout:${OVERPASS_TIMEOUT_S}];nwr${groupSelector(group)}(${VIETNAM_BBOX});out center tags;`;
    const json = await cached(`group-${group.category}`, () => overpass(query, `Nhóm ${group.category}`));
    return json.elements;
}

const parseWikipediaTag = (tags) => {
    const raw = tags.wikipedia ?? (tags['wikipedia:vi'] ? `vi:${tags['wikipedia:vi']}` : null);
    if (!raw) return null;
    const m = raw.match(/^([a-z-]+):(.+)$/);
    return m ? { lang: m[1], title: m[2].trim() } : { lang: 'vi', title: raw.trim() };
};

function toCandidate(element, group, province) {
    const tags = element.tags ?? {};
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    const name = (tags['name:vi'] || tags.name || '').trim();
    if (!name || NAME_BLACKLIST.test(name)) return null;
    if (!groupMatches(group, tags)) return null;

    const wiki = parseWikipediaTag(tags);
    let score = group.baseScore;
    if (wiki || tags.wikidata) score += 3;
    if (tags.image) score += 1;
    if (tags['name:vi']) score += 1;
    if (tags.description || tags['description:vi']) score += 1;
    if (tags.heritage || tags['heritage:operator']) score += 1;
    if (group.key !== 'tourism' && tags.tourism) score += 1;

    return {
        osm_id: `${element.type}/${element.id}`,
        name,
        lat: Number(lat.toFixed(7)),
        lng: Number(lng.toFixed(7)),
        category: group.category,
        category_label: CATEGORY_LABELS[group.category],
        difficulty_level: DIFFICULTY_BY_CATEGORY[group.category] ?? DEFAULT_DIFFICULTY,
        province_id: province.id,
        province_name: province.name,
        description: tags['description:vi'] || tags.description || null,
        img: /^https?:\/\//.test(tags.image ?? '') ? tags.image : null,
        wikipedia: wiki,
        wikidata: tags.wikidata ?? null,
        score,
        sources: ['OpenStreetMap (ODbL)'],
    };
}

function dedupe(candidates) {
    const sorted = [...candidates].sort((a, b) => b.score - a.score);
    const kept = [];
    for (const c of sorted) {
        const k = nameKey(c.name);
        const duplicate = kept.some(
            (x) => nameKey(x.name) === k || (x.category === c.category && distanceMeters(x, c) < DEFAULTS.dedupeRadiusMeters),
        );
        if (!duplicate) kept.push(c);
    }
    return kept;
}

// ---------- 3. Làm giàu từ Wikipedia / Wikidata ----------
const WIKI_API = (lang) => `https://${lang}.wikipedia.org/w/api.php`;

async function fetchWikiPages(lang, titles) {
    const params = new URLSearchParams({
        action: 'query', format: 'json', formatversion: '2', redirects: '1',
        prop: 'extracts|pageimages', exintro: '1', explaintext: '1', exsentences: '3', exlimit: '20',
        piprop: 'thumbnail', pithumbsize: String(WIKI_THUMB_WIDTH), pilimit: '20',
        titles: titles.join('|'),
    });
    const res = await fetchWithRetry(`${WIKI_API(lang)}?${params}`, {}, { label: `wiki ${lang}` });
    const json = await res.json();
    const byTitle = new Map();
    for (const page of json.query?.pages ?? []) {
        if (page.missing) continue;
        byTitle.set(page.title, { extract: page.extract?.trim() || null, thumb: page.thumbnail?.source || null });
    }
    for (const r of [...(json.query?.normalized ?? []), ...(json.query?.redirects ?? [])]) {
        if (byTitle.has(r.to)) byTitle.set(r.from, byTitle.get(r.to));
    }
    return byTitle;
}

async function resolveWikidata(qids) {
    const result = new Map();
    for (const ids of chunk(qids, 50)) {
        const params = new URLSearchParams({ action: 'wbgetentities', format: 'json', ids: ids.join('|'), props: 'sitelinks|claims' });
        const res = await fetchWithRetry(`https://www.wikidata.org/w/api.php?${params}`, {}, { label: 'wikidata' });
        const json = await res.json();
        for (const [qid, entity] of Object.entries(json.entities ?? {})) {
            const viTitle = entity.sitelinks?.viwiki?.title ?? null;
            const enTitle = entity.sitelinks?.enwiki?.title ?? null;
            const file = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value ?? null;
            const image = file ? `https://commons.wikimedia.org/w/index.php?title=Special:FilePath/${encodeURIComponent(file)}&width=${WIKI_THUMB_WIDTH}` : null;
            result.set(qid, { viTitle, enTitle, image });
        }
        await sleep(WIKI_BATCH_DELAY_MS);
    }
    return result;
}

async function enrich(candidates) {
    const withWikidataOnly = candidates.filter((c) => !c.wikipedia && c.wikidata);
    if (withWikidataOnly.length) {
        console.log(`  Wikidata: tra ${withWikidataOnly.length} mục để tìm bài viết/ảnh...`);
        const resolved = await resolveWikidata([...new Set(withWikidataOnly.map((c) => c.wikidata))]);
        for (const c of withWikidataOnly) {
            const r = resolved.get(c.wikidata);
            if (!r) continue;
            if (r.viTitle) c.wikipedia = { lang: 'vi', title: r.viTitle };
            else if (r.enTitle) c.wikipedia = { lang: 'en', title: r.enTitle };
            if (!c.img && r.image) c.img = r.image;
        }
    }

    const byLang = Map.groupBy(candidates.filter((c) => c.wikipedia), (c) => c.wikipedia.lang);
    for (const [lang, list] of byLang) {
        console.log(`  Wikipedia (${lang}): lấy mô tả/ảnh cho ${list.length} địa điểm...`);
        for (const batch of chunk(list, 20)) {
            const pages = await fetchWikiPages(lang, batch.map((c) => c.wikipedia.title));
            for (const c of batch) {
                const page = pages.get(c.wikipedia.title);
                if (!page) continue;
                if (page.extract && (!c.description || lang === 'vi')) {
                    c.description = page.extract;
                    c.description_lang = lang;
                }
                if (page.thumb && !c.img) c.img = page.thumb;
                if (!c.sources.includes('Wikipedia (CC BY-SA)')) c.sources.push('Wikipedia (CC BY-SA)');
            }
            await sleep(WIKI_BATCH_DELAY_MS);
        }
    }
}

// ---------- 4. Xuất preview ----------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

function writeOutputs(all, selected) {
    writeFileSync(resolve(OUT_DIR, 'locations.all.json'), JSON.stringify(all, null, 2), 'utf8');
    writeFileSync(resolve(OUT_DIR, 'locations.preview.json'), JSON.stringify(selected, null, 2), 'utf8');

    const header = ['province_name', 'name', 'category_label', 'difficulty_level', 'score', 'lat', 'lng', 'img', 'description', 'osm_id', 'wikipedia'];
    const csv = [header.join(',')]
        .concat(selected.map((c) => header.map((h) => csvEscape(h === 'wikipedia' ? (c.wikipedia ? `${c.wikipedia.lang}:${c.wikipedia.title}` : '') : c[h])).join(',')))
        .join('\n');
    writeFileSync(resolve(OUT_DIR, 'locations.preview.csv'), '﻿' + csv, 'utf8');

    const byProvince = [...Map.groupBy(selected, (c) => c.province_name).entries()].sort((a, b) => a[0].localeCompare(b[0], 'vi'));
    const nav = byProvince.map(([p, list]) => `<a href="#${esc(provinceKey(p))}">${esc(p)} (${list.length})</a>`).join(' · ');
    const sections = byProvince.map(([prov, list]) => `
<h2 id="${esc(provinceKey(prov))}">${esc(prov)} <small>(${list.length})</small></h2>
<table><thead><tr><th>Ảnh</th><th>Tên</th><th>Loại</th><th>Độ khó</th><th>Điểm</th><th>Mô tả</th><th>Nguồn</th></tr></thead><tbody>
${list.map((c) => `<tr>
<td>${c.img ? `<img loading="lazy" src="${esc(c.img)}" alt="">` : '<span class="noimg">không ảnh</span>'}</td>
<td><strong>${esc(c.name)}</strong><br><a href="https://www.openstreetmap.org/${esc(c.osm_id)}" target="_blank">${esc(c.osm_id)}</a><br><code>${c.lat}, ${c.lng}</code></td>
<td>${esc(c.category_label)}</td><td>${esc(c.difficulty_level)}</td><td>${c.score}</td>
<td class="desc">${esc(c.description ?? '')}${c.description_lang && c.description_lang !== 'vi' ? ` <em>(${c.description_lang})</em>` : ''}</td>
<td>${esc(c.sources.join(' · '))}${c.wikipedia ? `<br><a href="https://${esc(c.wikipedia.lang)}.wikipedia.org/wiki/${encodeURIComponent(c.wikipedia.title)}" target="_blank">Wikipedia</a>` : ''}</td>
</tr>`).join('\n')}
</tbody></table>`).join('\n');

    const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Preview địa điểm cào được</title>
<style>body{font-family:system-ui,sans-serif;margin:24px;color:#222}table{border-collapse:collapse;width:100%;margin-bottom:32px}th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;font-size:13px}th{background:#f4f4f4;position:sticky;top:0}img{width:120px;height:80px;object-fit:cover;border-radius:6px}.noimg{color:#999;font-size:12px}.desc{max-width:420px}nav{font-size:13px;line-height:1.9;margin-bottom:24px}h2 small{color:#888;font-weight:normal}</style></head>
<body><h1>Preview: ${selected.length} địa điểm / ${byProvince.length} tỉnh thành</h1>
<p>Sinh lúc ${new Date().toLocaleString('vi-VN')} · Nguồn: OpenStreetMap (ODbL), Wikipedia (CC BY-SA). Chưa ghi vào database.</p>
<nav>${nav}</nav>${sections}</body></html>`;
    writeFileSync(resolve(OUT_DIR, 'preview.html'), html, 'utf8');
}

// ---------- main ----------
const dbByKey = new Map((await loadDbProvinces()).map((p) => [provinceKey(p.name), p]));
process.stdout.write('Lấy danh sách tỉnh từ OSM... ');
const osmProvinces = await loadOsmProvinces();
console.log(`${osmProvinces.length} tỉnh.`);

const provinces = [];
for (const osm of osmProvinces) {
    const db = dbByKey.get(provinceKey(osm.name));
    if (!db) {
        console.warn(`  ! OSM "${osm.name}" không khớp tỉnh nào trong DB - bỏ qua`);
        continue;
    }
    if (ONLY_PROVINCES.length && !ONLY_PROVINCES.includes(provinceKey(osm.name))) continue;
    process.stdout.write(`  Ranh giới ${db.name}... `);
    const isCached = existsSync(resolve(CACHE_DIR, `province-${osm.relationId}.json`));
    const polygon = await loadProvincePolygon(osm.relationId);
    console.log(`${polygon.rings} vòng`);
    provinces.push({ ...osm, db, polygon });
    if (!isCached) await sleep(1500);
}
console.log(`Sẽ gán địa điểm cho ${provinces.length} tỉnh thành.\n`);

const findProvince = (lng, lat) => provinces.find((p) => p.polygon.contains(lng, lat));

const raw = [];
for (const group of TAG_GROUPS) {
    process.stdout.write(`Nhóm ${CATEGORY_LABELS[group.category]}... `);
    try {
        const elements = await loadGroupElements(group);
        let assigned = 0;
        for (const e of elements) {
            const lat = e.lat ?? e.center?.lat;
            const lng = e.lon ?? e.center?.lon;
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
            const province = findProvince(lng, lat);
            if (!province) continue;
            const c = toCandidate(e, group, province.db);
            if (c) {
                raw.push(c);
                assigned += 1;
            }
        }
        console.log(`${elements.length} phần tử -> ${assigned} thuộc các tỉnh đã chọn`);
    } catch (error) {
        console.log(`LỖI: ${error.message}`);
    }
    await sleep(OVERPASS_DELAY_MS);
}

const all = [...Map.groupBy(raw, (c) => c.province_id).values()].flatMap(dedupe);
console.log(`\n${raw.length} địa điểm thô -> ${all.length} sau khi loại trùng.`);

if (!SKIP_WIKI) {
    console.log('\nLàm giàu dữ liệu từ Wikipedia/Wikidata...');
    await enrich(all);
}

const grouped = Map.groupBy(all, (c) => c.province_id);
const selected = [...grouped.values()]
    .flatMap((list) => list.filter((c) => c.score >= MIN_SCORE).sort((a, b) => b.score - a.score).slice(0, LIMIT_PER_PROVINCE))
    .sort((a, b) => a.province_name.localeCompare(b.province_name, 'vi') || b.score - a.score);

writeOutputs(all, selected);

console.log('\n=== TỔNG KẾT ===');
console.table(
    [...grouped.values()]
        .map((list) => {
            const chosen = selected.filter((c) => c.province_id === list[0].province_id);
            return {
                tinh: list[0].province_name,
                tho: list.length,
                chon: chosen.length,
                co_anh: chosen.filter((c) => c.img).length,
                co_mo_ta: chosen.filter((c) => c.description).length,
            };
        })
        .sort((a, b) => a.tinh.localeCompare(b.tinh, 'vi')),
);
console.log(`Tổng: ${all.length} địa điểm, chọn ${selected.length} (score >= ${MIN_SCORE}, tối đa ${LIMIT_PER_PROVINCE}/tỉnh).`);
console.log(`Có ảnh: ${selected.filter((c) => c.img).length}, có mô tả: ${selected.filter((c) => c.description).length}.`);
console.log(`\nXem trước: ${resolve(OUT_DIR, 'preview.html')}`);
console.log('Import khi đã duyệt: node scripts/scrape-locations/import.mjs --dry-run');
