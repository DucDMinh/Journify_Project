import OpenAI from 'openai';
import { env } from '../config/env.js';
import { HttpError } from '../helpers/httpError.js';
import { provinceRepo } from '../repositories/provinceRepository.js';
import { locationRepo } from '../repositories/locationRepository.js';

const DEFAULT_DAYS = 3;
const MAX_DAYS = 14;
const MAX_PROMPT_LENGTH = 1500;

let client;
const getClient = () => {
    if (!env.groqApiKey) throw new HttpError(503, 'Tính năng AI chưa được cấu hình (thiếu GROQ_API_KEY)');
    client ??= new OpenAI({ apiKey: env.groqApiKey, baseURL: 'https://api.groq.com/openai/v1' });
    return client;
};

const RECEPTIONIST_PROMPT = `
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
    { "leg": 1, "province_name": "Tên Tỉnh 1", "keywords": ["Địa danh/Đèo 1"] },
    { "leg": 2, "province_name": "Tên Tỉnh 2", "keywords": ["Địa danh/Đèo 2"] }
  ]
}
`;

const buildPlannerPrompt = (daysCount, legsData) => `
Bạn là hệ thống ánh xạ dữ liệu và chuyên gia xếp lịch trình (Data Mapper & Travel Planner).
Nhiệm vụ: Tạo lịch trình ${daysCount} ngày từ DANH SÁCH ĐỊA ĐIỂM CUNG CẤP.

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
    { "province_id": "Lấy chính xác từ trường province_id trong danh sách mớm vào", "province_name": "Tên của tỉnh đó" }
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

const askJson = async (systemPrompt, userPrompt, temperature) => {
    const res = await getClient().chat.completions.create({
        model: env.groqModel,
        response_format: { type: 'json_object' },
        temperature,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
    });
    return JSON.parse(res.choices[0].message.content);
};

const resolveLeg = async (leg) => {
    const province = leg.province_name ? await provinceRepo.findByName(leg.province_name) : null;
    let locations;
    if (province) {
        locations = await locationRepo.getByProvinceForAi(province.id);
    } else if (leg.keywords?.length) {
        locations = await locationRepo.searchByKeywordsForAi(leg.keywords);
    } else {
        locations = await locationRepo.searchByKeywordsForAi([leg.province_name]);
    }
    return {
        leg_number: leg.leg,
        province_id: province?.id ?? null,
        province_matched: province?.name ?? leg.province_name,
        available_locations: locations,
    };
};

const sanitizeDays = (daysCount) => {
    const n = Number(daysCount);
    if (!Number.isInteger(n) || n < 1) return DEFAULT_DAYS;
    return Math.min(n, MAX_DAYS);
};

export const generateItinerary = async ({ prompt, daysCount }) => {
    if (typeof prompt !== 'string' || !prompt.trim()) {
        throw new HttpError(400, 'Vui lòng cung cấp prompt yêu cầu.');
    }
    const cleanPrompt = prompt.trim().slice(0, MAX_PROMPT_LENGTH);
    const days = sanitizeDays(daysCount);

    const intent = await askJson(RECEPTIONIST_PROMPT, cleanPrompt, 0);
    if (!intent.is_valid || !Array.isArray(intent.route_legs) || intent.route_legs.length === 0) {
        throw new HttpError(400, intent.error_message || 'Yêu cầu không hợp lệ.');
    }

    const legsData = await Promise.all(intent.route_legs.map(resolveLeg));
    const totalLocations = legsData.reduce((sum, leg) => sum + leg.available_locations.length, 0);
    if (totalLocations === 0) {
        throw new HttpError(404, 'Không tìm thấy địa điểm nào trong hệ thống khớp với tuyến đường của bạn. Vui lòng thử địa danh khác!');
    }

    return askJson(buildPlannerPrompt(days, legsData), `Hãy xếp lịch trình cho yêu cầu: ${cleanPrompt}`, 0.5);
};
