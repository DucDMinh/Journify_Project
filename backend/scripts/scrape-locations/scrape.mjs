import 'dotenv/config';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import OpenAI from 'openai';
import { supabase } from '../../src/config/supabaseClient.js';
import { env } from '../../src/config/env.js';
import {
    OVERPASS_URLS, OVERPASS_TIMEOUT_S, OVERPASS_DELAY_MS, WIKI_BATCH_DELAY_MS, WIKI_THUMB_WIDTH, VIETNAM_BBOX,
    TAG_GROUPS, groupSelector, groupMatches, CATEGORY_LABELS, DIFFICULTY_BY_CATEGORY, DEFAULT_DIFFICULTY,
    NAME_BLACKLIST, DEFAULTS, MIN_IMAGE_WIDTH, NON_PHOTO_IMAGE, PHOTON_REVERSE_URL, PHOTON_DELAY_MS, TRANSLATE_BATCH_SIZE,
    KIND_LABELS, RELIGION_LABELS, GENERIC_NAMES,
} from './config.mjs';
import { sleep, provinceKey, nameKey, distanceMeters, chunk, fetchWithRetry, csvEscape, USER_AGENT, stripProvincePrefix } from './lib.mjs';
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
const SKIP_ADDRESS = flag('no-address');
const SKIP_TRANSLATE = flag('no-translate');
const ALLOW_NO_IMAGE = flag('allow-no-image');
const PHOTO_MINUTES = Number(opt('photo-minutes', 20));
const OVERRIDES_FILE = resolve(OUT_DIR, 'overrides.json');
const OVERRIDES = existsSync(OVERRIDES_FILE) ? JSON.parse(readFileSync(OVERRIDES_FILE, 'utf8')) : {};
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

function loadStore(name) {
    const file = resolve(CACHE_DIR, `${name}.json`);
    const data = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
    return { data, save: () => writeFileSync(file, JSON.stringify(data), 'utf8') };
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
    const url = raw.match(/^https?:\/\/([a-z-]+)\.(?:m\.)?wikipedia\.org\/wiki\/([^?#]+)/i);
    if (url) {
        try {
            return { lang: url[1].toLowerCase(), title: decodeURIComponent(url[2]).replace(/_/g, ' ') };
        } catch {
            return null;
        }
    }
    const m = raw.match(/^([a-z]{2,3}(?:-[a-z]+)?):(.+)$/);
    return m ? { lang: m[1], title: m[2].trim() } : { lang: 'vi', title: raw.trim() };
};

const VIETNAMESE_CHARS = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const VI_WORDS = new Set(['là', 'của', 'và', 'được', 'các', 'những', 'một', 'có', 'trong', 'với', 'nằm', 'tại', 'này', 'người', 'năm', 'ở']);
const EN_WORDS = new Set(['the', 'is', 'of', 'and', 'in', 'a', 'an', 'was', 'located', 'with', 'on', 'by', 'it', 'its', 'are', 'from']);
const isVietnamese = (text) => {
    const words = String(text ?? '').toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
    const vi = words.filter((word) => VI_WORDS.has(word)).length;
    const en = words.filter((word) => EN_WORDS.has(word)).length;
    return VIETNAMESE_CHARS.test(String(text ?? '')) && vi >= en;
};

const COMMONS_URL = /^https?:\/\/(?:commons\.wikimedia\.org\/wiki\/|upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/)(?:File:)?([^/?#]+)/i;
const toCommonsFile = (value) => {
    const raw = String(value ?? '').trim();
    const name = raw.match(COMMONS_URL)?.[1] ?? raw.match(/^File:(.+)$/i)?.[1];
    if (!name) return null;
    try {
        return `File:${decodeURIComponent(name).replace(/_/g, ' ')}`;
    } catch {
        return null;
    }
};

const parseElevation = (value) => {
    const n = Number(String(value ?? '').match(/\d+(?:\.\d+)?/)?.[0]);
    return Number.isFinite(n) && n > 0 && n < 9000 ? Math.round(n) : null;
};

const practicalInfo = (tags) => {
    const info = {
        opening_hours: tags.opening_hours ?? null,
        fee: tags.fee ?? null,
        charge: tags.charge ?? null,
        phone: tags['contact:phone'] ?? tags.phone ?? null,
        website: tags['contact:website'] ?? tags.website ?? tags.url ?? null,
    };
    return Object.values(info).some(Boolean) ? info : null;
};

const kindLabel = (group, tags) =>
    group.key === 'amenity'
        ? RELIGION_LABELS[tags.religion] ?? 'công trình tôn giáo'
        : KIND_LABELS[tags[group.key]] ?? CATEGORY_LABELS[group.category].toLowerCase();

function toCandidate(element, group, province) {
    const tags = element.tags ?? {};
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    const name = (tags['name:vi'] || tags.name || '').trim();
    if (!name || NAME_BLACKLIST.test(name) || GENERIC_NAMES.has(nameKey(name))) return null;
    if (!groupMatches(group, tags)) return null;
    if (tags.natural === 'water' && (/^(river|canal|stream|ditch|drain|riverbank|oxbow)$/.test(tags.water ?? '') || /^(sông|kênh|rạch) /i.test(name))) return null;

    const wiki = parseWikipediaTag(tags);
    let score = group.baseScore;
    if (wiki || tags.wikidata) score += 3;
    if (tags['name:vi']) score += 1;
    if (tags.heritage || tags['heritage:operator']) score += 1;
    if (group.key !== 'tourism' && tags.tourism) score += 1;

    const commonsFile = toCommonsFile(tags.wikimedia_commons) ?? toCommonsFile(tags.image);
    const description = tags['description:vi'] || tags.description || null;
    return {
        osm_id: `${element.type}/${element.id}`,
        name,
        has_vi_name: Boolean(tags['name:vi']) || VIETNAMESE_CHARS.test(name),
        lat: Number(lat.toFixed(7)),
        lng: Number(lng.toFixed(7)),
        category: group.category,
        category_label: CATEGORY_LABELS[group.category],
        kind: tags[group.key],
        kind_label: kindLabel(group, tags),
        ele: parseElevation(tags.ele),
        difficulty_level: DIFFICULTY_BY_CATEGORY[group.category] ?? DEFAULT_DIFFICULTY,
        province_id: province.id,
        province_name: province.name,
        description,
        description_lang: description ? (isVietnamese(description) ? 'vi' : 'other') : null,
        img: null,
        image_files: commonsFile ? [commonsFile] : [],
        image_credit: null,
        practical: practicalInfo(tags),
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
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const WIKI_RETRY = (label) => ({ retries: 6, backoffMs: 10000, label });

const postApi = async (url, params, label) => {
    const res = await fetchWithRetry(url, { method: 'POST', body: new URLSearchParams(params) }, WIKI_RETRY(label));
    return res.json();
};

const resolveAlias = (json, title) => {
    const alias = new Map([...(json.query?.normalized ?? []), ...(json.query?.redirects ?? [])].map((r) => [r.from, r.to]));
    let current = title;
    for (let i = 0; i < 4 && alias.has(current); i++) current = alias.get(current);
    return current;
};

const cleanText = (html) => String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const cleanArtist = (html) =>
    cleanText(html)
        .replace(/\(\s*(thảo luận|talk|contribs?|đóng góp)\s*\)/gi, '')
        .replace(/\bUser:/gi, '')
        .replace(/\S+@\S+/g, '')
        .replace(/\s+/g, ' ')
        .replace(/^[\s,;-]+|[\s,;-]+$/g, '')
        .slice(0, 80);
const isUsefulExtract = (text) => String(text ?? '').length >= 40 && !/(có thể là|có thể chỉ|may refer to|can refer to)/i.test(text);

async function fetchWikidata(qids, store) {
    const toEntity = (entity) => {
        if (!entity || 'missing' in entity) return null;
        const file = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
        return { viTitle: entity.sitelinks?.viwiki?.title ?? null, enTitle: entity.sitelinks?.enwiki?.title ?? null, image: file ? `File:${file}` : null };
    };
    const missing = qids.filter((qid) => !(qid in store.data));
    for (const ids of chunk(missing, 50)) {
        const json = await postApi(WIKIDATA_API, { action: 'wbgetentities', format: 'json', ids: ids.join('|'), props: 'sitelinks|claims' }, 'wikidata');
        if (json.error) {
            for (const id of ids) {
                const single = await postApi(WIKIDATA_API, { action: 'wbgetentities', format: 'json', ids: id, props: 'sitelinks|claims' }, 'wikidata');
                store.data[id] = toEntity(single.entities?.[id]);
                await sleep(WIKI_BATCH_DELAY_MS);
            }
        } else {
            for (const id of ids) store.data[id] = toEntity(json.entities?.[id]);
        }
        store.save();
        await sleep(WIKI_BATCH_DELAY_MS);
    }
}

async function fetchWikiPages(lang, titles, store) {
    const missing = titles.filter((title) => !(title in store.data));
    for (const batch of chunk(missing, 20)) {
        const json = await postApi(WIKI_API(lang), {
            action: 'query', format: 'json', formatversion: '2', redirects: '1',
            prop: 'extracts|pageimages', exintro: '1', explaintext: '1', exsentences: '3', exlimit: '20',
            piprop: 'name', pilimit: '20', titles: batch.join('|'),
        }, `wiki ${lang}`);
        const pages = new Map((json.query?.pages ?? []).filter((page) => !page.missing).map((page) => [page.title, page]));
        for (const title of batch) {
            const page = pages.get(resolveAlias(json, title));
            store.data[title] = page
                ? { extract: page.extract?.trim() || null, image: page.pageimage ? `File:${page.pageimage.replace(/_/g, ' ')}` : null }
                : null;
        }
        store.save();
        await sleep(WIKI_BATCH_DELAY_MS);
    }
}

async function fetchCommonsInfo(files, store) {
    const missing = files.filter((file) => !(file in store.data));
    for (const batch of chunk(missing, 40)) {
        const json = await postApi(COMMONS_API, {
            action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo',
            iiprop: 'url|size|mime|extmetadata', iiurlwidth: String(WIKI_THUMB_WIDTH), iiextmetadatafilter: 'LicenseShortName|Artist',
            titles: batch.join('|'),
        }, 'commons');
        const pages = new Map((json.query?.pages ?? []).map((page) => [page.title, page]));
        for (const file of batch) {
            const info = pages.get(resolveAlias(json, file))?.imageinfo?.[0];
            store.data[file] = info
                ? {
                    mime: info.mime,
                    width: info.width,
                    height: info.height,
                    url: info.thumburl ?? info.url,
                    page: info.descriptionurl,
                    license: cleanText(info.extmetadata?.LicenseShortName?.value) || null,
                    artist: cleanArtist(info.extmetadata?.Artist?.value) || null,
                }
                : null;
        }
        store.save();
        await sleep(WIKI_BATCH_DELAY_MS);
    }
}

const isGoodPhoto = (file, info) =>
    Boolean(info) &&
    ['image/jpeg', 'image/webp'].includes(info.mime) &&
    info.width >= MIN_IMAGE_WIDTH &&
    info.height >= MIN_IMAGE_WIDTH / 2 &&
    !NON_PHOTO_IMAGE.test(file) &&
    !NON_PHOTO_IMAGE.test(nameKey(file));

const isPresentableName = (c) => {
    if (c.name.length > 60 || /[#@]|\d{3,}\s?m\b/i.test(c.name) || !/^[\p{Lu}\d]/u.test(c.name)) return false;
    return c.has_vi_name || Boolean(c.wikidata || c.wikipedia);
};

const PREFIX_WORDS = [
    [['vuon', 'quoc', 'gia'], ['vuon quoc gia', 'national park']],
    [['khu', 'bao', 'ton'], ['bao ton', 'reserve']],
    [['dai', 'tuong', 'niem'], ['tuong niem', 'memorial', 'monument']],
    [['bao', 'tang'], ['bao tang', 'museum']],
    [['nha', 'tho'], ['nha tho', 'church', 'cathedral']],
    [['tuong', 'dai'], ['tuong dai', 'monument', 'statue']],
    [['cong', 'vien'], ['cong vien', 'park']],
    [['thac'], ['thac', 'waterfall', 'falls', 'cascade']],
    [['den'], ['den', 'temple', 'shrine']],
    [['chua'], ['chua', 'pagoda', 'temple']],
    [['mieu'], ['mieu', 'shrine', 'temple']],
    [['dinh'], ['dinh', 'communal house', 'palace']],
    [['nui'], ['nui', 'mount', 'mountain', 'peak']],
    [['deo'], ['deo', 'pass']],
    [['ho'], ['ho', 'lake']],
    [['dao'], ['dao', 'island']],
    [['hon'], ['hon', 'island']],
    [['bai'], ['bai', 'beach']],
    [['hang'], ['hang', 'cave']],
    [['dong'], ['dong', 'cave', 'grotto']],
    [['lang'], ['lang', 'tomb', 'mausoleum', 'village']],
    [['thanh'], ['thanh', 'citadel', 'fort']],
    [['cau'], ['cau', 'bridge']],
    [['suoi'], ['suoi', 'stream', 'spring']],
    [['vinh'], ['vinh', 'bay']],
    [['ban'], ['ban', 'village']],
];
const SUFFIX_WORDS = {
    temple: ['temple', 'den', 'chua'], pagoda: ['pagoda', 'chua'], waterfall: ['waterfall', 'falls', 'thac'], falls: ['falls', 'waterfall', 'thac'],
    lake: ['lake', 'ho'], museum: ['museum', 'bao tang'], island: ['island', 'dao'], beach: ['beach', 'bai'], cave: ['cave', 'hang', 'dong'],
    mountain: ['mountain', 'mount', 'nui'], peak: ['peak', 'nui'], church: ['church', 'nha tho'], cathedral: ['cathedral', 'nha tho'],
    bridge: ['bridge', 'cau'], park: ['park', 'cong vien'], tomb: ['tomb', 'lang'], mausoleum: ['mausoleum', 'lang'], citadel: ['citadel', 'thanh'],
    bay: ['bay', 'vinh'], pass: ['pass', 'deo'], village: ['village', 'ban', 'lang'],
};
const KIND_PHOTO_WORDS = {
    waterfall: ['thac', 'waterfall', 'falls', 'cascade'], museum: ['bao tang', 'museum'], peak: ['nui', 'mount', 'mountain', 'peak'],
    beach: ['bai', 'beach'], cave_entrance: ['hang', 'dong', 'cave'], water: ['ho', 'lake'], island: ['dao', 'island', 'hon'],
    national_park: ['vuon quoc gia', 'national park'], place_of_worship: ['chua', 'pagoda', 'den', 'temple', 'nha tho', 'church', 'cathedral'],
};
const BIG_FEATURES = new Set(['national_park', 'nature_reserve', 'island', 'islet', 'archipelago', 'bay', 'water', 'peak', 'volcano']);
const PHOTO_PRIORITY = {
    vuon_quoc_gia: 6, thac: 6, bai_bien: 6, dao: 5, ho: 5, thien_nhien: 5, bao_tang: 5, tam_linh: 5,
    khu_bao_ton: 4, tham_quan: 4, cong_vien: 3, di_tich: 3, nui: 2,
};
const LOCAL_MEMORIAL = /liệt s[ỹĩi]|nghĩa trang|nghĩa địa/i;
const worthPhotoLookup = (c) => {
    if (c.kind === 'islet' || LOCAL_MEMORIAL.test(c.name)) return false;
    if (c.category === 'nui') return (c.ele ?? 0) >= 1000 || Boolean(c.wikidata || c.wikipedia);
    return true;
};

function nameSignature(c) {
    let tokens = nameKey(c.name).split(' ').filter(Boolean);
    let words = [];
    const prefix = PREFIX_WORDS.find(([head]) => head.every((token, i) => tokens[i] === token));
    if (prefix) {
        tokens = tokens.slice(prefix[0].length);
        words = prefix[1];
    }
    const suffix = SUFFIX_WORDS[tokens.at(-1)];
    if (suffix && tokens.length > 1) {
        tokens = tokens.slice(0, -1);
        if (!words.length) words = suffix;
    }
    return { tokens, words: words.length ? words : KIND_PHOTO_WORDS[c.kind] ?? [] };
}

function matchesPhoto(c, title) {
    const { tokens, words } = nameSignature(c);
    if (tokens.join('').length < 3) return false;
    const fileKey = ` ${nameKey(title.replace(/^File:/i, '').replace(/\.[a-z0-9]+$/i, ''))} `;
    if (!tokens.every((token) => fileKey.includes(` ${token} `))) return false;
    return words.length ? words.some((word) => fileKey.includes(` ${word} `)) : tokens.length >= 2;
}

async function findNearbyPhotos(candidates, commons) {
    const store = loadStore('nearby-photos');
    const canMatch = (c) => {
        const { tokens, words } = nameSignature(c);
        return tokens.join('').length >= 3 && (words.length > 0 || tokens.length >= 2);
    };
    const lookups = candidates
        .filter((c) => !c.img && isPresentableName(c) && canMatch(c) && worthPhotoLookup(c))
        .sort((a, b) => (PHOTO_PRIORITY[b.category] ?? 1) - (PHOTO_PRIORITY[a.category] ?? 1) || b.score - a.score);
    const pending = lookups.filter((c) => !(c.osm_id in store.data));
    const deadline = Date.now() + PHOTO_MINUTES * 60000;
    console.log(`  Ảnh gắn tọa độ trên Commons: ${lookups.length} địa điểm chưa có ảnh, ${pending.length} cần tra (tối đa ${PHOTO_MINUTES} phút, phần còn lại để lần chạy sau)...`);
    for (const [index, c] of pending.entries()) {
        if (Date.now() > deadline) {
            console.log(`  Hết ${PHOTO_MINUTES} phút: đã tra ${index}/${pending.length}, chạy lại script để tra tiếp phần còn lại.`);
            break;
        }
        try {
            const json = await postApi(COMMONS_API, {
                action: 'query', format: 'json', formatversion: '2', generator: 'geosearch',
                ggscoord: `${c.lat}|${c.lng}`, ggsradius: BIG_FEATURES.has(c.kind) ? '5000' : '1500', ggsnamespace: '6', ggslimit: '50',
                prop: 'imageinfo', iiprop: 'size|mime',
            }, 'commons geo');
            store.data[c.osm_id] = (json.query?.pages ?? [])
                .filter((page) => page.imageinfo?.[0])
                .map((page) => ({ title: page.title, mime: page.imageinfo[0].mime, width: page.imageinfo[0].width, height: page.imageinfo[0].height }));
        } catch (error) {
            console.warn(`  ! Không tra được ảnh quanh "${c.name}": ${error.message}`);
        }
        if (index % 25 === 24) store.save();
        if (index % 100 === 99) console.log(`    ... ${index + 1}/${pending.length}`);
        await sleep(WIKI_BATCH_DELAY_MS * 2);
    }
    store.save();

    const chosen = new Map();
    for (const c of lookups) {
        const photo = (store.data[c.osm_id] ?? []).find((file) => isGoodPhoto(file.title, file) && matchesPhoto(c, file.title));
        if (photo) chosen.set(c, photo.title);
    }
    try {
        await fetchCommonsInfo([...new Set(chosen.values())], commons);
    } catch (error) {
        console.warn(`  ! Commons lỗi, dùng dữ liệu đã có: ${error.message}`);
    }
    let found = 0;
    for (const [c, file] of chosen) {
        const info = commons.data[file];
        if (!isGoodPhoto(file, info)) continue;
        c.img = info.url;
        c.image_credit = { file, page: info.page, license: info.license, artist: info.artist };
        found += 1;
    }
    console.log(`  Tìm được ảnh khớp tên cho ${found} địa điểm.`);
}

async function enrich(candidates) {
    const wikidata = loadStore('wikidata');
    const qids = [...new Set(candidates.map((c) => c.wikidata).filter((qid) => /^Q\d+$/.test(qid ?? '')))];
    console.log(`  Wikidata: ${qids.length} mục...`);
    try {
        await fetchWikidata(qids, wikidata);
    } catch (error) {
        console.warn(`  ! Wikidata lỗi, dùng dữ liệu đã có: ${error.message}`);
    }
    for (const c of candidates) {
        const entity = c.wikidata ? wikidata.data[c.wikidata] : null;
        if (!entity) continue;
        if (entity.viTitle && !c.has_vi_name) {
            c.name = entity.viTitle.replace(/\s*\([^)]*\)\s*$/, '').trim();
            c.has_vi_name = true;
        }
        if (entity.viTitle && c.wikipedia?.lang !== 'vi') c.wikipedia = { lang: 'vi', title: entity.viTitle };
        else if (!c.wikipedia && entity.enTitle) c.wikipedia = { lang: 'en', title: entity.enTitle };
        if (entity.image) c.image_files.push(entity.image);
    }

    for (const [lang, list] of Map.groupBy(candidates.filter((c) => c.wikipedia), (c) => c.wikipedia.lang)) {
        const store = loadStore(`wiki-${lang}`);
        console.log(`  Wikipedia (${lang}): ${list.length} bài viết...`);
        try {
            await fetchWikiPages(lang, [...new Set(list.map((c) => c.wikipedia.title))], store);
        } catch (error) {
            console.warn(`  ! Bỏ qua Wikipedia (${lang}): ${error.message}`);
            continue;
        }
        for (const c of list) {
            const page = store.data[c.wikipedia.title];
            if (!page) continue;
            if (isUsefulExtract(page.extract) && (lang === 'vi' || !c.description)) {
                c.description = page.extract;
                c.description_lang = lang;
            }
            if (page.image) c.image_files.push(page.image);
            if (!c.sources.includes('Wikipedia (CC BY-SA)')) c.sources.push('Wikipedia (CC BY-SA)');
        }
    }

    const commons = loadStore('commons');
    const files = [...new Set(candidates.flatMap((c) => c.image_files))];
    console.log(`  Wikimedia Commons: kiểm tra ${files.length} ảnh...`);
    try {
        await fetchCommonsInfo(files, commons);
    } catch (error) {
        console.warn(`  ! Commons lỗi, dùng dữ liệu đã có: ${error.message}`);
    }
    for (const c of candidates) {
        const file = c.image_files.find((f) => isGoodPhoto(f, commons.data[f]));
        if (!file) continue;
        const info = commons.data[file];
        c.img = info.url;
        c.image_credit = { file, page: info.page, license: info.license, artist: info.artist };
    }
    await findNearbyPhotos(candidates, commons);
}

const finalScore = (c) => c.score + (c.img ? 1 : 0) + (c.description ? 1 : 0);

function selectForProvince(list) {
    const ranked = list
        .map((c) => ({ c, score: finalScore(c) }))
        .filter(({ score }) => score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score);
    const picked = [];
    for (const { c, score } of ranked) {
        if (picked.length >= LIMIT_PER_PROVINCE) break;
        if (OVERRIDES[c.osm_id]?.exclude || !isPresentableName(c)) continue;
        if (picked.some((x) => nameKey(x.name) === nameKey(c.name) || (x.img && x.img === c.img) || distanceMeters(x, c) < DEFAULTS.dedupeRadiusMeters)) continue;
        if (!c.img && !ALLOW_NO_IMAGE) continue;
        c.score = score;
        picked.push(c);
    }
    return picked;
}

const ADMIN_PREFIX = /^(xã|phường|thị trấn|thị xã|thành phố|tỉnh|huyện|quận|đặc khu|tp\.?)\s+/i;
const GENERIC_STREET = /^(road|street|unnamed|đường không tên)\b|^\d+$/i;

async function reverseGeocode(c) {
    const params = new URLSearchParams({ lat: String(c.lat), lon: String(c.lng), limit: '1', lang: 'default' });
    const res = await fetchWithRetry(`${PHOTON_REVERSE_URL}?${params}`, {}, { retries: 5, backoffMs: 5000, label: 'photon' });
    const p = (await res.json()).features?.[0]?.properties ?? {};
    return {
        street: p.street ? [p.housenumber, p.street].filter(Boolean).join(' ') : null,
        locality: p.locality ?? null,
        district: p.district ?? null,
        city: p.city ?? null,
        county: p.county ?? null,
    };
}

function formatAddress(parts, c) {
    const province = stripProvincePrefix(c.province_name);
    const compactKey = (text) => nameKey(text).replace(/\s+/g, '');
    const seen = new Set([compactKey(province), compactKey(c.name)]);
    const items = [];
    for (const raw of [parts?.street, parts?.locality, parts?.district, parts?.city, parts?.county]) {
        if (!raw || (raw === parts.street && GENERIC_STREET.test(raw))) continue;
        const value = raw.replace(ADMIN_PREFIX, '').trim();
        const key = compactKey(value);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        items.push(value);
    }
    return [...items.slice(-3), province].join(', ');
}

async function addAddresses(list) {
    const store = loadStore('addresses');
    const missing = list.filter((c) => !(c.osm_id in store.data));
    if (missing.length) console.log(`  Địa chỉ: tra ngược ${missing.length} tọa độ qua Photon (khoảng ${Math.ceil((missing.length * PHOTON_DELAY_MS) / 60000)} phút)...`);
    for (const [index, c] of missing.entries()) {
        try {
            store.data[c.osm_id] = await reverseGeocode(c);
        } catch (error) {
            console.warn(`  ! Không tra được địa chỉ "${c.name}": ${error.message}`);
        }
        if (index % 20 === 19) store.save();
        if (index % 100 === 99) console.log(`    ... ${index + 1}/${missing.length}`);
        await sleep(PHOTON_DELAY_MS);
    }
    store.save();
    for (const c of list) c.address = formatAddress(store.data[c.osm_id], c);
}

const TRANSLATE_PROMPT = `Bạn là biên dịch viên du lịch. Dịch sát nghĩa từng đoạn "text" sang tiếng Việt tự nhiên, chính xác.
- Giữ nguyên số liệu, năm tháng và mọi địa danh, nhân danh: chuyển đúng sang cách viết tiếng Việt chuẩn, tuyệt đối không thay bằng địa danh khác.
- Địa điểm đang mô tả có tên tiếng Việt là trường "name" và hiện thuộc tỉnh/thành trong trường "province"; dùng đúng các tên này khi bản gốc nhắc tới.
- Bỏ phần chú thích tên gốc kiểu "(tiếng Việt: ...)" hay "(Vietnamese: ...)".
- Không thêm hay bớt thông tin, không bình luận.
Trả về JSON đúng dạng {"items":[{"id":"0","vi":"..."}]}, mỗi id tương ứng một đoạn.`;

const tidyDescription = (text) =>
    String(text ?? '')
        .replace(/\s*\((?:tiếng Việt|Vietnamese)\s*:[^)]*\)/gi, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\s+([,.;:])/g, '$1')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

const textKey = (text) => createHash('sha1').update(text).digest('hex');

const needsTranslation = (c) => Boolean(c.description) && c.description_lang !== 'vi';

async function translateDescriptions(list, store) {
    const todo = list.filter((c) => needsTranslation(c) && !(textKey(c.description) in store.data));
    if (!todo.length) return;
    if (SKIP_TRANSLATE || !env.ai.apiKey) {
        console.log(`  Bỏ qua dịch ${todo.length} mô tả không phải tiếng Việt.`);
        return;
    }
    const client = new OpenAI({ apiKey: env.ai.apiKey, baseURL: env.ai.baseUrl, maxRetries: 6 });
    console.log(`  Dịch ${todo.length} mô tả sang tiếng Việt (${env.ai.model})...`);
    for (const batch of chunk(todo, TRANSLATE_BATCH_SIZE)) {
        try {
            const res = await client.chat.completions.create({
                model: env.ai.model,
                response_format: { type: 'json_object' },
                ...(env.ai.reasoningEffort ? { reasoning_effort: env.ai.reasoningEffort } : {}),
                messages: [
                    { role: 'system', content: TRANSLATE_PROMPT },
                    { role: 'user', content: JSON.stringify({ items: batch.map((c, i) => ({ id: String(i), name: c.name, province: stripProvincePrefix(c.province_name), text: c.description })) }) },
                ],
            });
            const items = JSON.parse(res.choices[0]?.message?.content ?? '{}').items ?? [];
            for (const item of items) {
                const c = batch[Number(item?.id)];
                const vi = String(item?.vi ?? '').trim();
                if (c && isVietnamese(vi)) store.data[textKey(c.description)] = vi;
            }
            store.save();
        } catch (error) {
            console.warn(`  ! Lỗi dịch mô tả: ${error.message}`);
        }
    }
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const NAME_PREFIX_LABELS = [
    ['vườn quốc gia ', 'vườn quốc gia'], ['khu bảo tồn ', 'khu bảo tồn thiên nhiên'], ['đài tưởng niệm ', 'đài tưởng niệm'],
    ['tượng đài ', 'tượng đài'], ['bảo tàng ', 'bảo tàng'], ['nhà thờ ', 'nhà thờ'], ['văn miếu ', 'văn miếu'], ['công viên ', 'công viên'],
    ['thác ', 'thác nước'], ['đền ', 'ngôi đền'], ['chùa ', 'ngôi chùa'], ['miếu ', 'ngôi miếu'], ['đình ', 'ngôi đình'],
    ['núi ', 'ngọn núi'], ['đèo ', 'con đèo'], ['hồ ', 'hồ nước'], ['đảo ', 'hòn đảo'], ['hòn ', 'hòn đảo'], ['bãi ', 'bãi biển'],
    ['hang ', 'hang động'], ['động ', 'hang động'], ['lăng ', 'lăng mộ'], ['làng ', 'ngôi làng'], ['bản ', 'bản làng'],
    ['cầu ', 'cây cầu'], ['suối ', 'con suối'], ['vịnh ', 'vịnh'], ['dinh ', 'dinh thự'],
];
const labelOf = (c) => NAME_PREFIX_LABELS.find(([prefix]) => c.name.toLowerCase().startsWith(prefix))?.[1] ?? c.kind_label;

const templateDescription = (c) => {
    const sentences = [`${capitalize(labelOf(c))} nằm tại ${c.address || stripProvincePrefix(c.province_name)}.`];
    if (c.ele && ['peak', 'volcano'].includes(c.kind)) sentences.push(`Độ cao khoảng ${c.ele.toLocaleString('vi-VN')} m so với mực nước biển.`);
    return sentences.join(' ');
};

async function localizeDescriptions(list) {
    const store = loadStore('translations');
    await translateDescriptions(list, store);
    for (const c of list) {
        if (needsTranslation(c)) {
            const translated = store.data[textKey(c.description)];
            c.description_original = c.description;
            c.description = translated ?? null;
            c.description_translated = Boolean(translated);
            c.description_lang = translated ? 'vi' : null;
        }
        if (!c.description) {
            c.description = templateDescription(c);
            c.description_generated = true;
        }
        c.description = tidyDescription(c.description);
    }
}

const OPENING_DAYS = { Mo: 'T2', Tu: 'T3', We: 'T4', Th: 'T5', Fr: 'T6', Sa: 'T7', Su: 'CN', PH: 'ngày lễ' };
const formatOpeningHours = (value) =>
    value === '24/7'
        ? 'mở cửa cả ngày'
        : value
            .replace(/\bMo-Su\b/g, 'hằng ngày')
            .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (day) => OPENING_DAYS[day])
            .replace(/\boff\b/gi, 'nghỉ')
            .replace(/\s*;\s*/g, '; ');

const noteOf = (c) => {
    const p = c.practical ?? {};
    const parts = [];
    if (p.opening_hours) parts.push(`Giờ mở cửa: ${formatOpeningHours(p.opening_hours)}`);
    if (p.charge) parts.push(`Giá vé: ${p.charge}`);
    else if (p.fee === 'yes') parts.push('Có thu phí tham quan');
    else if (p.fee === 'no') parts.push('Miễn phí tham quan');
    if (p.phone) parts.push(`Điện thoại: ${p.phone}`);
    if (p.website && !/youtu\.?be|tiktok\.com|instagram\.com/i.test(p.website)) parts.push(`Website: ${p.website.replace(/[?&](si|utm_[a-z]+|fbclid)=[^&#]*/gi, '').replace(/\?$/, '')}`);
    parts.push(`Nguồn: OpenStreetMap${c.wikipedia ? ', Wikipedia' : ''}${c.description_translated ? ' (mô tả dịch tự động)' : ''}`);
    if (c.image_credit) parts.push(`Ảnh: ${[cleanArtist(c.image_credit.artist), c.image_credit.license, 'Wikimedia Commons'].filter(Boolean).join(', ')}`);
    return parts.join(' · ');
};

const difficultyOf = (c) => {
    if (c.category !== 'nui') return c.difficulty_level;
    if (!c.ele) return 'Trung Bình';
    return c.ele >= 2000 ? 'Khó' : c.ele >= 1000 ? 'Trung Bình' : 'Dễ';
};

function loadOverrides(list) {
    const overrides = OVERRIDES;
    let applied = 0;
    for (const c of list) {
        const patch = overrides[c.osm_id];
        if (!patch) continue;
        if (patch.name) c.name = patch.name;
        if (patch.description) {
            c.description = patch.description;
            c.description_lang = 'vi';
            c.description_translated = false;
            c.description_generated = false;
            c.description_edited = true;
        }
        if (patch.difficulty_level) c.difficulty_level_override = patch.difficulty_level;
        if ('wikipedia' in patch) c.wikipedia = patch.wikipedia;
        applied += 1;
    }
    if (applied) console.log(`  Áp dụng ${applied} hiệu chỉnh từ overrides.json`);
    return overrides;
}

async function completeDetails(list) {
    const overrides = loadOverrides(list);
    if (!SKIP_ADDRESS) await addAddresses(list);
    for (const c of list) if (overrides[c.osm_id]?.address) c.address = overrides[c.osm_id].address;
    await localizeDescriptions(list);
    for (const c of list) {
        c.full_name = c.address ? `${c.name} · ${c.address}` : c.name;
        c.difficulty_level = c.difficulty_level_override ?? difficultyOf(c);
        c.note = noteOf(c);
    }
}

// ---------- 4. Xuất preview ----------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

function writeOutputs(all, selected) {
    writeFileSync(resolve(OUT_DIR, 'locations.all.json'), JSON.stringify(all, null, 2), 'utf8');
    writeFileSync(resolve(OUT_DIR, 'locations.preview.json'), JSON.stringify(selected, null, 2), 'utf8');

    const header = ['province_name', 'full_name', 'category_label', 'difficulty_level', 'score', 'lat', 'lng', 'img', 'description', 'note', 'osm_id', 'wikipedia'];
    const csv = [header.join(',')]
        .concat(selected.map((c) => header.map((h) => csvEscape(h === 'wikipedia' ? (c.wikipedia ? `${c.wikipedia.lang}:${c.wikipedia.title}` : '') : c[h])).join(',')))
        .join('\n');
    writeFileSync(resolve(OUT_DIR, 'locations.preview.csv'), '﻿' + csv, 'utf8');

    const byProvince = [...Map.groupBy(selected, (c) => c.province_name).entries()].sort((a, b) => a[0].localeCompare(b[0], 'vi'));
    const nav = byProvince.map(([p, list]) => `<a href="#${esc(provinceKey(p))}">${esc(p)} (${list.length})</a>`).join(' · ');
    const sections = byProvince.map(([prov, list]) => `
<h2 id="${esc(provinceKey(prov))}">${esc(prov)} <small>(${list.length})</small></h2>
<table><thead><tr><th>Ảnh</th><th>Tên</th><th>Loại</th><th>Độ khó</th><th>Điểm</th><th>Mô tả</th><th>Ghi chú</th></tr></thead><tbody>
${list.map((c) => `<tr>
<td>${c.img ? `<img loading="lazy" src="${esc(c.img)}" alt="">` : '<span class="noimg">không ảnh</span>'}</td>
<td><strong>${esc(c.full_name ?? c.name)}</strong><br><a href="https://www.openstreetmap.org/${esc(c.osm_id)}" target="_blank">${esc(c.osm_id)}</a><br><code>${c.lat}, ${c.lng}</code></td>
<td>${esc(c.category_label)}</td><td>${esc(c.difficulty_level)}</td><td>${c.score}</td>
<td class="desc">${esc(c.description ?? '')}${c.description_translated ? ' <em>(dịch tự động)</em>' : ''}${c.description_generated ? ' <em>(tự sinh)</em>' : ''}</td>
<td class="desc">${esc(c.note ?? '')}${c.wikipedia ? `<br><a href="https://${esc(c.wikipedia.lang)}.wikipedia.org/wiki/${encodeURIComponent(c.wikipedia.title)}" target="_blank">Wikipedia</a>` : ''}</td>
</tr>`).join('\n')}
</tbody></table>`).join('\n');

    const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Preview địa điểm cào được</title>
<style>body{font-family:system-ui,sans-serif;margin:24px;color:#222}table{border-collapse:collapse;width:100%;margin-bottom:32px}th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;font-size:13px}th{background:#f4f4f4;position:sticky;top:0}img{width:120px;height:80px;object-fit:cover;border-radius:6px}.noimg{color:#999;font-size:12px}.desc{max-width:420px}nav{font-size:13px;line-height:1.9;margin-bottom:24px}h2 small{color:#888;font-weight:normal}</style></head>
<body><h1>Preview: ${selected.length} địa điểm / ${byProvince.length} tỉnh thành</h1>
<p>Sinh lúc ${new Date().toLocaleString('vi-VN')} · Nguồn: OpenStreetMap (ODbL), Wikipedia (CC BY-SA), Wikimedia Commons. Chưa ghi vào database.</p>
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
        const isCached = existsSync(resolve(CACHE_DIR, `group-${group.category}.json`));
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
        if (!isCached) await sleep(OVERPASS_DELAY_MS);
    } catch (error) {
        console.log(`LỖI: ${error.message}`);
        await sleep(OVERPASS_DELAY_MS);
    }
}

const all = [...Map.groupBy(raw, (c) => c.province_id).values()].flatMap(dedupe);
console.log(`\n${raw.length} địa điểm thô -> ${all.length} sau khi loại trùng.`);

if (!SKIP_WIKI) {
    console.log('\nLàm giàu dữ liệu từ Wikidata, Wikipedia, Wikimedia Commons...');
    await enrich(all);
}

const grouped = Map.groupBy(all, (c) => c.province_id);
const selected = [];
for (const list of grouped.values()) selected.push(...selectForProvince(list));
selected.sort((a, b) => a.province_name.localeCompare(b.province_name, 'vi') || b.score - a.score);

console.log(`\nBổ sung địa chỉ, mô tả tiếng Việt và ghi chú cho ${selected.length} địa điểm đã chọn...`);
await completeDetails(selected);

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
                mo_ta_wiki: chosen.filter((c) => !c.description_generated && !c.description_translated).length,
                mo_ta_dich: chosen.filter((c) => c.description_translated).length,
                mo_ta_tu_sinh: chosen.filter((c) => c.description_generated).length,
            };
        })
        .sort((a, b) => a.tinh.localeCompare(b.tinh, 'vi')),
);
console.log(`Tổng: ${all.length} địa điểm, chọn ${selected.length} (score >= ${MIN_SCORE}, tối đa ${LIMIT_PER_PROVINCE}/tỉnh${ALLOW_NO_IMAGE ? '' : ', bắt buộc có ảnh'}).`);
console.log(`Có ảnh: ${selected.filter((c) => c.img).length}, có địa chỉ: ${selected.filter((c) => c.address).length}, mô tả dịch tự động: ${selected.filter((c) => c.description_translated).length}, mô tả tự sinh: ${selected.filter((c) => c.description_generated).length}.`);
console.log(`\nXem trước: ${resolve(OUT_DIR, 'preview.html')}`);
console.log('Import khi đã duyệt: node scripts/scrape-locations/import.mjs --dry-run');
