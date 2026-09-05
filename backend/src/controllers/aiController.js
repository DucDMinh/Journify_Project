import OpenAI from 'openai';
import { supabase } from '../config/supabaseClient.js';
import dotenv from 'dotenv';

dotenv.config();
let rawKey = process.env.MY_NEW_GROQ_KEY || process.env.GROQ_API_KEY || "";
let cleanApiKey = rawKey.trim().replace(/['"]/g, '');
if (cleanApiKey.endsWith('s')) {
    cleanApiKey = cleanApiKey.slice(0, -1);
}
const openai = new OpenAI({
    apiKey: cleanApiKey,
    baseURL: "https://api.groq.com/openai/v1"
});

export async function generateItinerary(ctx) {
    try {
        const { prompt, days_count } = ctx.request.body;
        if (!prompt) {
            ctx.status = 400;
            ctx.body = { success: false, message: "Vui lòng cung cấp prompt yêu cầu." };
            return;
        }
        const receptionistPrompt = `
        Đọc yêu cầu du lịch sau và phân tích thành các chặng đường (route legs).
        Nếu yêu cầu KHÔNG liên quan đến du lịch, đặt "is_valid" = false.
        
        LUẬT XỬ LÝ THÔNG MINH (QUAN TRỌNG):
        1. Nếu người dùng nhắc đến một tên thử thách, cung đường, hoặc danh hiệu chung chung (VD: "tứ đại đỉnh đèo", "Xuyên Việt", "vòng cung Tây Bắc"...):
           - BẠN PHẢI TỰ ĐỘNG PHÂN TÍCH KỸ CÁC ĐỊA ĐIỂM CÓ TRONG YÊU CẦU VÀ TÌM RA CÁC TỈNH/ĐỊA ĐIỂM cốt lõi tạo nên hành trình đó.
           - Chia nhỏ hành trình thành NHIỀU CHẶNG (nhiều phần tử trong mảng route_legs) tương ứng với các tỉnh/địa danh phải đi qua.
        2. province_name: Tên Tỉnh/Thành phố chính của chặng đó.
        3. keywords: Các địa danh, ngọn đèo, hoặc điểm tham quan cụ thể thuộc chặng đó.

        Ví dụ nếu khách nhập "Đi tứ đại đỉnh đèo", AI tự chia thành 4 chặng:
        - Chặng 1: Tỉnh Lào Cai/Lai Châu (Keyword: Đèo Ô Quy Hồ)
        - Chặng 2: Tỉnh Yên Bái (Keyword: Đèo Khau Phạ)
        - Chặng 3: Tỉnh Hà Giang (Keyword: Đèo Mã Pí Lèng)
        - Chặng 4: Tỉnh Điện Biên/Sơn La (Keyword: Đèo Pha Đin)

        Trả về JSON đúng cấu trúc:
        {
          "is_valid": true,
          "error_message": "",
          "route_legs": [
            { 
              "leg": 1, 
              "province_name": "Tên Tỉnh 1", 
              "keywords": ["Địa danh/Đèo 1"] 
            },
            { 
              "leg": 2, 
              "province_name": "Tên Tỉnh 2", 
              "keywords": ["Địa danh/Đèo 2"] 
            }
          ]
        }
        `;

        const receptionistRes = await openai.chat.completions.create({
            model: "openai/gpt-oss-120b",
            response_format: { type: "json_object" },
            temperature: 0,
            messages: [
                { role: "system", content: receptionistPrompt },
                { role: "user", content: prompt }
            ]
        });

        const intentData = JSON.parse(receptionistRes.choices[0].message.content);

        if (!intentData.is_valid) {
            ctx.status = 400;
            ctx.body = { success: false, message: intentData.error_message || "Yêu cầu không hợp lệ." };
            return;
        }
        const legsData = await Promise.all(
            intentData.route_legs.map(async (leg) => {
                let locations = [];
                console.log(`\n--- [DEBUG] ĐANG XỬ LÝ CHẶNG: ${leg.leg} ---`);
                console.log(`[DEBUG] AI Lễ tân phân tích Tỉnh: "${leg.province_name}" | Từ khóa:`, leg.keywords);
                const { data: provinceData, error: provError } = await supabase
                    .from('provinces')
                    .select('id, name')
                    .ilike('name', `%${leg.province_name}%`)
                    .limit(1)
                    .maybeSingle();

                if (provError) {
                    console.error("[DEBUG] ❌ LỖI QUERY PROVINCES:", provError.message);
                }

                if (provinceData) {
                    console.log(`[DEBUG] ✅ Đã match được Tỉnh trong DB: [${provinceData.id}] - ${provinceData.name}`);
                } else {
                    console.log(`[DEBUG] ⚠️ KHÔNG match được Tỉnh nào có tên chứa chữ "${leg.province_name}"`);
                }
                let query = supabase.from('locations').select('id, name, lat, lng, description');

                if (provinceData) {
                    console.log("[DEBUG] 👉 Đang dùng CÁCH A: Tìm tất cả locations theo province_id");
                    query = query.eq('province_id', provinceData.id);
                } else if (leg.keywords && leg.keywords.length > 0) {
                    console.log("[DEBUG] 👉 Đang dùng CÁCH B: Tìm locations theo từ khóa (keywords)");
                    const orConditions = leg.keywords.map(kw => `name.ilike.%${kw}%,description.ilike.%${kw}%`).join(',');
                    query = query.or(orConditions);
                } else {
                    console.log("[DEBUG] 👉 Đang dùng CÁCH C: Fallback tìm locations chứa tên Tỉnh");
                    query = query.or(`name.ilike.%${leg.province_name}%,description.ilike.%${leg.province_name}%`);
                }
                const { data: locData, error: locError } = await query.limit(12);

                if (locError) {
                    console.error("[DEBUG] ❌ LỖI QUERY LOCATIONS:", locError.message);
                }

                locations = locData || [];
                console.log(`[DEBUG] 🎯 Đã tìm thấy ${locations.length} địa điểm cho chặng này.`);

                return {
                    leg_number: leg.leg,
                    province_id: provinceData ? provinceData.id : null,
                    province_matched: provinceData ? provinceData.name : leg.province_name,
                    available_locations: locations
                };
            })
        );

        const totalLocationsFound = legsData.reduce((sum, leg) => sum + leg.available_locations.length, 0);
        if (totalLocationsFound === 0) {
            ctx.status = 404;
            ctx.body = {
                success: false,
                message: "Không tìm thấy địa điểm nào trong hệ thống khớp với tuyến đường của bạn. Vui lòng thử địa danh khác!"
            };
            return;
        }
        const plannerPrompt = `
        Bạn là hệ thống ánh xạ dữ liệu và chuyên gia xếp lịch trình (Data Mapper & Travel Planner).
        Nhiệm vụ: Tạo lịch trình ${days_count || 3} ngày từ DANH SÁCH ĐỊA ĐIỂM CUNG CẤP.
        
        LUẬT TỐI THƯỢNG (PHẢI TUÂN THỦ 100%):
        1. BẠN KHÔNG ĐƯỢC PHÉP SÁNG TẠO ĐỊA ĐIỂM MỚI. CHỈ ĐƯỢC PHÉP CHỌN CÁC ĐỊA ĐIỂM CÓ TRONG "DANH SÁCH ĐỊA ĐIỂM".
        2. Phải sao chép chính xác tuyệt đối 'location_id', 'location_name', 'lat', 'lng' từ danh sách.
        3. Nếu một ngày không có đủ địa điểm trong danh sách, hãy để ít địa điểm thôi, TUYỆT ĐỐI KHÔNG TỰ BỊA THÊM.
        4. TÍNH TOÁN LỘ TRÌNH THỰC TẾ: Các địa điểm trong cùng một ngày phải có tính logic về mặt di chuyển (dựa vào tên và tọa độ lat/lng nếu có thể phán đoán).
        5. CÁ NHÂN HÓA THEO YÊU CẦU (RẤT QUAN TRỌNG):
           - Hãy đọc kỹ "Yêu cầu của người dùng" để tinh chỉnh 'start_time' và 'end_time'.
           - Nếu khách yêu cầu "đi nhiều nơi, dừng 30-45p": Hãy nhồi nhiều địa điểm vào một ngày, mỗi 'start_time' và 'end_time' cách nhau đúng 30-45 phút, cộng thêm thời gian di chuyển.
           - Nếu khách yêu cầu "thư giãn, chữa lành": Hãy LỌC RA những địa điểm phù hợp (quán cafe, suối, resort...), xếp ít điểm thôi (2-3 điểm/ngày), và cho thời gian lưu trú dài (2-4 tiếng/điểm).
           - Viết 'activity_note' dựa trên phong cách khách muốn (Ví dụ: "Ngồi chill ngắm hoàng hôn..." thay vì "Chạy show check-in...").
        6. TÍNH TOÁN NGÂN SÁCH THỰC TẾ (estimated_cost):
           - BƯỚC 1: Đọc "Mức ngân sách" từ yêu cầu của người dùng (Thấp/Trung bình/Cao) để ước lượng chi phí sinh hoạt (Khách sạn + Ăn uống + Đi lại) cho 1 ngày:
             + Ngân sách "Thấp" (Tiết kiệm): khoảng 500,000 VNĐ - 700,000 VNĐ / 1 ngày.
             + Ngân sách "Trung bình": khoảng 1,000,000 VNĐ - 1,500,000 VNĐ / 1 ngày.
             + Ngân sách "Cao" (Cao cấp): khoảng 2,500,000 VNĐ - 4,500,000 VNĐ / 1 ngày.
           - BƯỚC 2: Tính thuộc tính 'cost' (giá vé/dịch vụ/nghỉ ngơi) của từng ĐỊA ĐIỂM TRONG NGÀY mà bạn ĐÃ CHỌN từ danh sách và viết 'activity_note' những khoản cần chi. (ĐIỀU NÀY LÀ BẮT BUỘC).
           - BƯỚC 3: Công thức: estimated_cost = (Tổng cost các địa điểm).
           - Yêu cầu: Trả về một con số nguyên (Ví dụ: 3450000). TUYỆT ĐỐI KHÔNG trả về chuỗi.
        DANH SÁCH ĐỊA ĐIỂM (CHỈ ĐƯỢC CHỌN TRONG NÀY):
        ${JSON.stringify(legsData)}

        TRẢ VỀ JSON ĐÚNG CẤU TRÚC NÀY:
        {
          "title": "Tên chuyến đi",
          "theme": "Khám phá/Nghỉ dưỡng...",
          "summary": "Tóm tắt...",
          "estimated_cost": 5000000,
          "itinerary_provinces": [
            {
              "province_id": "Lấy chính xác từ trường province_id trong danh sách mớm vào",
              "province_name": "Tên của tỉnh đó"
            }
          ],
          "itinerary_days": [
            {
              "day_number": 1,
              "title": "Ngày 1: ...",
              "itinerary_locations": [
                {
                  "location_id": "Lấy từ id trong danh sách",
                  "location_name": "Lấy từ name trong danh sách",
                  "lat": 12.34,
                  "lng": 105.67,
                  "start_time": "08:00",
                  "end_time": "10:00",
                  "cost": 100000,
                  "activity_note": "Ghi chú...",
                  "sequence_order": 1
                }
              ]
            }
          ]
        }
        `;

        const plannerRes = await openai.chat.completions.create({
            model: "openai/gpt-oss-120b",
            response_format: { type: "json_object" },
            temperature: 0.5,
            messages: [
                { role: "system", content: plannerPrompt },
                { role: "user", content: `Hãy xếp lịch trình cho yêu cầu: ${prompt}` }
            ]
        });

        const finalItinerary = JSON.parse(plannerRes.choices[0].message.content);
        ctx.status = 200;
        ctx.body = {
            success: true,
            message: "Tạo lịch trình AI thành công",
            data: finalItinerary
        };

    } catch (error) {
        console.error("Lỗi AI Planner:", error);
        ctx.status = 500;
        ctx.body = { success: false, message: "Lỗi hệ thống khi tạo lịch trình AI", error_detail: error.message };
    }
}