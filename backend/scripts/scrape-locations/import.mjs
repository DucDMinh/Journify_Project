import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { supabase } from '../../src/config/supabaseClient.js';
import { uploadImageToStorage } from '../../src/helpers/uploadHelper.js';
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

const FILE = resolve(opt('file', 'scripts/scrape-locations/output/locations.preview.json'));
const MIN_SCORE = Number(opt('min-score', 0));
const LIMIT = Number(opt('limit', Infinity));
const ONLY_PROVINCES = opt('province', '').split(',').map(provinceKey).filter(Boolean);
const DRY_RUN = flag('dry-run');
const SKIP_IMAGES = flag('no-images');
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const candidates = JSON.parse(readFileSync(FILE, 'utf8'))
    .filter((c) => c.score >= MIN_SCORE)
    .filter((c) => !ONLY_PROVINCES.length || ONLY_PROVINCES.includes(provinceKey(c.province_name)))
    .slice(0, LIMIT);
console.log(`Đọc ${candidates.length} địa điểm từ ${FILE}${DRY_RUN ? ' (DRY RUN - không ghi DB)' : ''}`);

const { data: existing, error } = await supabase.from('locations').select('id, name, lat, lng, province_id');
if (error) throw error;
console.log(`DB hiện có ${existing.length} địa điểm - sẽ bỏ qua trùng tên (cùng tỉnh) hoặc cách < ${DEFAULTS.dedupeRadiusMeters}m.`);

const isDuplicate = (c) =>
    existing.some(
        (e) =>
            (e.province_id === c.province_id && nameKey(e.name) === nameKey(c.name)) ||
            (Number.isFinite(e.lat) && Number.isFinite(e.lng) && distanceMeters(e, c) < DEFAULTS.dedupeRadiusMeters),
    );

async function mirrorImage(url) {
    const res = await fetchWithRetry(url, { redirect: 'follow' }, { retries: 2, backoffMs: 2000, label: 'ảnh' });
    const mimetype = res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg';
    if (!mimetype.startsWith('image/')) throw new Error(`không phải ảnh (${mimetype})`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > IMAGE_MAX_BYTES) throw new Error('ảnh > 5MB');
    const ext = mimetype === 'image/png' ? 'png' : mimetype === 'image/webp' ? 'webp' : 'jpg';
    return uploadImageToStorage({ buffer, mimetype, size: buffer.length, originalname: `scraped.${ext}` }, 'locations');
}

const toInsert = [];
let skippedDuplicate = 0;
for (const c of candidates) {
    if (isDuplicate(c)) {
        skippedDuplicate += 1;
        continue;
    }
    toInsert.push(c);
    existing.push({ name: c.name, lat: c.lat, lng: c.lng, province_id: c.province_id });
}
console.log(`Bỏ qua ${skippedDuplicate} trùng; sẽ thêm ${toInsert.length} địa điểm.`);

if (DRY_RUN) {
    for (const c of toInsert.slice(0, 30)) console.log(`  + [${c.province_name}] ${c.name} (${c.category_label}, score ${c.score})`);
    if (toInsert.length > 30) console.log(`  ... và ${toInsert.length - 30} địa điểm khác`);
    process.exit(0);
}

let inserted = 0;
let imagesOk = 0;
let imagesFailed = 0;
for (const batch of chunk(toInsert, 25)) {
    const rows = [];
    for (const c of batch) {
        let img = null;
        if (c.img && !SKIP_IMAGES) {
            try {
                img = await mirrorImage(c.img);
                imagesOk += 1;
            } catch (err) {
                imagesFailed += 1;
                console.warn(`  ! Ảnh lỗi cho "${c.name}": ${err.message}`);
            }
            await sleep(150);
        }
        rows.push({
            name: c.name,
            lat: c.lat,
            lng: c.lng,
            img,
            description: c.description,
            difficulty_level: c.difficulty_level,
            province_id: c.province_id,
            note: `Nguồn: ${c.sources.join(', ')} · ${c.osm_id}${c.wikipedia ? ` · ${c.wikipedia.lang}.wikipedia:${c.wikipedia.title}` : ''}`,
            saved_count: 0,
        });
    }
    const { error: insertError } = await supabase.from('locations').insert(rows);
    if (insertError) {
        console.error('Lỗi insert batch:', insertError.message);
        continue;
    }
    inserted += rows.length;
    console.log(`  Đã thêm ${inserted}/${toInsert.length}`);
}

console.log(`\nHoàn tất: thêm ${inserted} địa điểm, ảnh tải lên ${imagesOk}, ảnh lỗi ${imagesFailed}, bỏ qua trùng ${skippedDuplicate}.`);
