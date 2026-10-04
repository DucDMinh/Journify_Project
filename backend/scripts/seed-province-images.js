import 'dotenv/config';
import { supabase } from '../src/config/supabaseClient.js';

const BUCKET_NAME = 'image';
const USER_AGENT = 'JournifyProvinceImageBot/1.0 (https://github.com/DucDMinh/Journify_Project)';
const EXTENSION_BY_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const FORCE = process.argv.includes('--force');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const slugify = (str) =>
    str.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, '-');

const cleanProvinceName = (name) => name.replace(/^(Tỉnh|Thành phố|TP\.)\s*/i, '').trim();

const hasImageSignature = (buffer) => {
    const hex = buffer.subarray(0, 4).toString('hex');
    return hex.startsWith('ffd8') || hex === '89504e47' || hex === '47494638' || buffer.subarray(8, 12).toString() === 'WEBP';
};

const isWorkingImage = async (url) => {
    if (!url) return false;
    try {
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        return res.ok && hasImageSignature(Buffer.from(await res.arrayBuffer()));
    } catch {
        return false;
    }
};

const findWikipediaImage = async (title) => {
    const api = `https://vi.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=1200&redirects=1`;
    const res = await fetch(api, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`Wikipedia trả về HTTP ${res.status}`);
    const pages = (await res.json())?.query?.pages ?? {};
    return Object.values(pages).find((page) => page.thumbnail?.source)?.thumbnail.source ?? null;
};

const downloadImage = async (url) => {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const mimeType = (res.headers.get('content-type') ?? '').split(';')[0].trim();
    if (!res.ok || !EXTENSION_BY_MIME[mimeType]) {
        throw new Error(`Không tải được ảnh (HTTP ${res.status}, ${mimeType || 'không rõ định dạng'})`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (!hasImageSignature(buffer)) throw new Error('Nội dung tải về không phải ảnh');
    return { buffer, mimeType };
};

async function seedProvinceImages() {
    const { data: provinces, error } = await supabase.from('provinces').select('id, name, image_url').order('name');
    if (error) throw error;

    let updated = 0;
    for (const province of provinces) {
        if (!FORCE && (await isWorkingImage(province.image_url))) continue;
        const title = cleanProvinceName(province.name);
        try {
            const sourceUrl = await findWikipediaImage(title);
            if (!sourceUrl) {
                console.log(`⚠️  Không tìm thấy ảnh Wikipedia cho ${province.name}`);
                continue;
            }
            const { buffer, mimeType } = await downloadImage(sourceUrl);
            const filePath = `provinces/${slugify(title)}.${EXTENSION_BY_MIME[mimeType]}`;
            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, buffer, { contentType: mimeType, upsert: true });
            if (uploadError) throw uploadError;

            const publicUrl = `${supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath).data.publicUrl}?v=${Date.now()}`;
            const { error: updateError } = await supabase.from('provinces').update({ image_url: publicUrl }).eq('id', province.id);
            if (updateError) throw updateError;
            updated += 1;
            console.log(`✅ ${province.name}: ${publicUrl}`);
        } catch (err) {
            console.error(`❌ ${province.name}: ${err.message}`);
        }
        await delay(1000);
    }
    console.log(`Hoàn tất: cập nhật ${updated}/${provinces.length} tỉnh${FORCE ? ' (--force)' : ' có ảnh hỏng hoặc thiếu'}.`);
}

seedProvinceImages().catch((err) => {
    console.error(err);
    process.exit(1);
});
