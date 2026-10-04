import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { supabase } from '../../src/config/supabaseClient.js';
import { uploadImageToStorage, deleteImageFromStorage } from '../../src/helpers/uploadHelper.js';
import { provinceKey, nameKey, distanceMeters, chunk, fetchWithRetry, sleep } from './lib.mjs';
import { DEFAULTS } from './config.mjs';

// Cách dùng:
//   node scripts/scrape-locations/import.mjs [--file output/locations.preview.json] [--province "Lào Cai,Hà Nội"]
//        [--min-score 3] [--limit 500] [--no-images] [--dry-run]
// --dry-run: chỉ báo cáo sẽ thêm gì, không ghi DB.

const args = process.argv.slice(2);
const opt = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const OUT_DIR = resolve('scripts/scrape-locations/output');
const FILE = resolve(opt('file', 'scripts/scrape-locations/output/locations.preview.json'));
const MIN_SCORE = Number(opt('min-score', 0));
const LIMIT = Number(opt('limit', Infinity));
const ONLY_PROVINCES = opt('province', '').split(',').map(provinceKey).filter(Boolean);
const DRY_RUN = flag('dry-run');
const SKIP_IMAGES = flag('no-images');
const UNDO_FILE = opt('undo', '');
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const NAME_MATCH_RADIUS_METERS = 3000;

if (UNDO_FILE) {
    const log = JSON.parse(readFileSync(resolve(UNDO_FILE), 'utf8'));
    const ids = log.inserted.map((row) => row.id);
    const inUse = new Set();
    for (const batch of chunk(ids, 100)) {
        const { data: used, error: usedError } = await supabase.from('itinerary_locations').select('location_id').in('location_id', batch);
        if (usedError) throw usedError;
        for (const row of used) inUse.add(row.location_id);
    }
    const removable = log.inserted.filter((row) => !inUse.has(row.id));
    for (const batch of chunk(removable, 100)) {
        const { error } = await supabase.from('locations').delete().in('id', batch.map((row) => row.id));
        if (error) throw error;
        for (const row of batch) if (row.img) await deleteImageFromStorage(row.img);
    }
    console.log(`Đã gỡ ${removable.length}/${ids.length} địa điểm${inUse.size ? `, giữ lại ${inUse.size} địa điểm đang nằm trong lộ trình` : ''}.`);
    process.exit(0);
}

const candidates = JSON.parse(readFileSync(FILE, 'utf8'))
    .filter((c) => c.score >= MIN_SCORE)
    .filter((c) => !ONLY_PROVINCES.length || ONLY_PROVINCES.includes(provinceKey(c.province_name)))
    .slice(0, LIMIT);
console.log(`Đọc ${candidates.length} địa điểm từ ${FILE}${DRY_RUN ? ' (DRY RUN - không ghi DB)' : ''}`);

const existing = [];
for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('locations').select('id, name, lat, lng, province_id').order('id').range(from, from + 999);
    if (error) throw error;
    existing.push(...data);
    if (data.length < 1000) break;
}
console.log(`DB hiện có ${existing.length} địa điểm - sẽ bỏ qua trùng tên (cùng tỉnh), cách < ${DEFAULTS.dedupeRadiusMeters}m, hoặc cùng tên gốc trong bán kính ${NAME_MATCH_RADIUS_METERS / 1000}km.`);

const GENERIC_WORDS = new Set([
    'thac', 'nuoc', 'waterfall', 'falls', 'ho', 'lake', 'nui', 'dinh', 'mount', 'mountain', 'peak', 'hang', 'dong', 'cave', 'caves',
    'chua', 'pagoda', 'den', 'temple', 'mieu', 'shrine', 'bai', 'bien', 'beach', 'vuon', 'quoc', 'gia', 'national', 'park', 'khu',
    'du', 'lich', 'cong', 'vien', 'dao', 'island', 'islands', 'bao', 'tang', 'museum', 'the', 'of', 'va', 'and', 'hoang', 'thanh',
    'imperial', 'city', 'citadel', 'kinh', 'lang', 'tomb', 'mausoleum', 'emperor', 'king', 'vua', 'nha', 'tho', 'church', 'cathedral',
    'cho', 'market', 'cau', 'bridge', 'vinh', 'bay', 'thung', 'lung', 'valley', 'deo', 'pass', 'suoi', 'stream', 'spring', 'tuong',
    'statue', 'monument', 'dai', 'niem', 'memorial', 'di', 'tich', 'relic', 'site', 'historical', 'su', 'ban', 'village', 'tower',
    'thap', 'cua', 'gate', 'viewpoint', 'diem', 'ngam', 'canh', 'check', 'in', 'tourist', 'area', 'resort', 'song', 'river', 'rung', 'forest',
]);
const shortName = (name) => String(name ?? '').split(' · ')[0].trim();
const coreTokens = (name) => nameKey(shortName(name)).split(' ').filter((word) => word && !GENERIC_WORDS.has(word));

const CATEGORY_PATTERNS = [
    ['thac', /^thac\b|\b(waterfalls?|falls|cascade)\b/, 1000],
    ['nui', /^nui\b|\b(mount|mountain|peak)\b/, 1500],
    ['ho', /^ho\b|\blake\b/, 1500],
    ['hang', /^(hang|dong)\b|\b(caves?|grotto)\b/, 800],
    ['bien', /^bai\b|\bbeach\b/, 1500],
    ['dao', /^(dao|hon|cu lao)\b|\bisland\b/, 2000],
    ['vqg', /^(vuon quoc gia|khu bao ton)\b|\b(national park|nature reserve)\b/, 5000],
];
const categoryOf = (name) => {
    const key = nameKey(shortName(name));
    return CATEGORY_PATTERNS.find(([, pattern]) => pattern.test(key)) ?? null;
};

const isDuplicate = (c) => {
    const core = coreTokens(c.name);
    const category = categoryOf(c.name);
    return existing.some((e) => {
        const distance = Number.isFinite(e.lat) && Number.isFinite(e.lng) ? distanceMeters(e, c) : Infinity;
        if (distance < DEFAULTS.dedupeRadiusMeters) return true;
        if (e.province_id === c.province_id && nameKey(shortName(e.name)) === nameKey(c.name)) return true;
        if (category && categoryOf(e.name)?.[0] === category[0] && distance < category[2]) return true;
        if (distance >= NAME_MATCH_RADIUS_METERS) return false;
        const other = coreTokens(e.name);
        if (core.join('').length < 3 || other.join('').length < 3) return false;
        const [small, large] = core.length <= other.length ? [core, other] : [other, core];
        return small.length >= 2 ? small.every((token) => large.includes(token)) : small.join(' ') === large.join(' ');
    });
};

const MIME_BY_SIGNATURE = [
    ['image/jpeg', (b) => b[0] === 0xff && b[1] === 0xd8],
    ['image/png', (b) => b.subarray(0, 4).toString('hex') === '89504e47'],
    ['image/webp', (b) => b.subarray(8, 12).toString() === 'WEBP'],
];

async function mirrorImage(url) {
    const res = await fetchWithRetry(url, { redirect: 'follow' }, { retries: 4, backoffMs: 3000, label: 'ảnh' });
    const buffer = Buffer.from(await res.arrayBuffer());
    const mimetype = MIME_BY_SIGNATURE.find(([, test]) => test(buffer))?.[0];
    if (!mimetype) throw new Error(`không phải ảnh JPEG/PNG/WEBP (${res.headers.get('content-type')})`);
    if (buffer.length > IMAGE_MAX_BYTES) throw new Error('ảnh > 5MB');
    return uploadImageToStorage({ buffer, mimetype, size: buffer.length, originalname: 'scraped' }, 'locations');
}

const toInsert = [];
let skippedDuplicate = 0;
for (const c of candidates) {
    if (isDuplicate(c)) {
        skippedDuplicate += 1;
        continue;
    }
    toInsert.push(c);
    existing.push({ name: c.full_name ?? c.name, lat: c.lat, lng: c.lng, province_id: c.province_id });
}
console.log(`Bỏ qua ${skippedDuplicate} trùng; sẽ thêm ${toInsert.length} địa điểm.`);

if (DRY_RUN) {
    for (const c of toInsert.slice(0, 30)) console.log(`  + [${c.province_name}] ${c.full_name ?? c.name} (${c.category_label}, score ${c.score})`);
    if (toInsert.length > 30) console.log(`  ... và ${toInsert.length - 30} địa điểm khác`);
    process.exit(0);
}

const log = { file: FILE, startedAt: new Date().toISOString(), inserted: [], skippedImage: [] };
const logFile = resolve(OUT_DIR, `import-log-${log.startedAt.replace(/[:.]/g, '-')}.json`);
const saveLog = () => writeFileSync(logFile, JSON.stringify(log, null, 2), 'utf8');

let imagesOk = 0;
for (const batch of chunk(toInsert, 25)) {
    const rows = [];
    const sources = [];
    for (const c of batch) {
        let img = null;
        if (c.img && !SKIP_IMAGES) {
            try {
                img = await mirrorImage(c.img);
                imagesOk += 1;
            } catch (err) {
                console.warn(`  ! Bỏ qua "${c.name}" vì ảnh lỗi: ${err.message}`);
                log.skippedImage.push({ osm_id: c.osm_id, name: c.name, img: c.img, reason: err.message });
                continue;
            }
            await sleep(800);
        }
        rows.push({
            name: c.full_name ?? c.name,
            lat: c.lat,
            lng: c.lng,
            img,
            description: c.description ?? null,
            difficulty_level: c.difficulty_level ?? null,
            province_id: c.province_id,
            note: c.note ?? `Nguồn: ${c.sources.join(', ')}`,
            saved_count: 0,
        });
        sources.push(c);
    }
    if (!rows.length) continue;
    const { data: insertedRows, error: insertError } = await supabase.from('locations').insert(rows).select('id, name, img');
    if (insertError) {
        console.error('Lỗi insert batch:', insertError.message);
        for (const row of rows) if (row.img) await deleteImageFromStorage(row.img);
        continue;
    }
    for (const row of insertedRows) {
        const source = sources.find((c) => (c.full_name ?? c.name) === row.name);
        log.inserted.push({ id: row.id, osm_id: source?.osm_id ?? null, name: row.name, img: row.img });
    }
    saveLog();
    console.log(`  Đã thêm ${log.inserted.length}/${toInsert.length}`);
}

log.finishedAt = new Date().toISOString();
saveLog();
console.log(`\nHoàn tất: thêm ${log.inserted.length} địa điểm, ảnh tải lên ${imagesOk}, bỏ qua do ảnh lỗi ${log.skippedImage.length}, bỏ qua trùng ${skippedDuplicate}.`);
console.log(`Nhật ký: ${logFile} (gỡ lại bằng --undo)`);
