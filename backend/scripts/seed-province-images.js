import { createClient } from '@supabase/supabase-js';

// Thay bằng thông tin của bạn
const supabaseUrl = 'https://olyoukmspibiafejrezj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9seW91a21zcGliaWFmZWpyZXpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1ODI5NCwiZXhwIjoyMDk3ODM0Mjk0fQ.LU2dTa-pe3CuHo3EZMsESC87xkx2NnECXlK3_V96siQ'; // Dùng role key hoặc anon key có quyền update
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Đổi tên bucket thành 'image'
const BUCKET_NAME = 'image';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, '-');
};

async function fetchAndUploadImages() {
    console.log("🚀 Bắt đầu quá trình: Cào Wiki -> Tải về -> Đẩy lên thư mục province của Supabase...");

    const { data: provinces, error } = await supabase.from('provinces').select('id, name');
    if (error) return console.error("❌ Lỗi lấy danh sách tỉnh:", error);

    for (const province of provinces) {
        let cleanName = province.name.replace(/Tỉnh |Thành phố |TP\. /gi, '').trim();

        try {
            const wikiApiUrl = `https://vi.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanName)}&prop=pageimages&format=json&pithumbsize=800`;
            const wikiRes = await fetch(wikiApiUrl, {
                headers: { 'User-Agent': 'VietNamProvinceBot/1.0 (bot@example.com)' }
            });

            if (!wikiRes.ok) {
                console.error(`⚠️ Wiki từ chối: ${province.name}`);
                continue;
            }

            const rawText = await wikiRes.text();
            let wikiData;
            try {
                wikiData = JSON.parse(rawText);
            } catch (e) {
                console.error(`⚠️ Không parse được JSON: ${province.name}`);
                continue;
            }

            const pages = wikiData.query.pages;
            const pageId = Object.keys(pages)[0];

            if (pageId !== "-1" && pages[pageId].thumbnail) {
                const imageUrl = pages[pageId].thumbnail.source;
                console.log(`⏳ Đang tải và xử lý ảnh: ${province.name}...`);

                const imageResponse = await fetch(imageUrl);
                const arrayBuffer = await imageResponse.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                const safeFileName = `${removeAccents(cleanName)}.jpg`;

                // 2. Thêm tiền tố 'provinces/' vào đường dẫn upload
                const filePath = `provinces/${safeFileName}`;

                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, buffer, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) {
                    console.error(`❌ Lỗi đẩy ảnh lên Storage (${province.name}):`, uploadError.message);
                    continue;
                }

                // 3. Lấy Public URL với đường dẫn mới
                const { data: publicUrlData } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(filePath);

                const finalSupabaseUrl = publicUrlData.publicUrl;

                const { error: updateError } = await supabase
                    .from('provinces')
                    .update({ image_url: finalSupabaseUrl })
                    .eq('id', province.id);

                if (updateError) {
                    console.error(`❌ Lỗi cập nhật DB (${province.name}):`, updateError.message);
                } else {
                    console.log(`✅ Thành công: Đã lưu ảnh của ${province.name} vào image/provinces/`);
                }

            } else {
                console.log(`⚠️ Không tìm thấy ảnh trên Wiki cho: ${province.name}`);
            }

            await delay(1000);

        } catch (err) {
            console.error(`❌ Lỗi hệ thống khi xử lý ${province.name}:`, err.message);
        }
    }

    console.log("🎉 Hoàn tất!");
}

fetchAndUploadImages();