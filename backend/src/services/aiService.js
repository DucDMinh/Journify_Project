import OpenAI from 'openai';
import { env } from '../config/env.js';
import { HttpError } from '../helpers/httpError.js';
import { normalizeText } from '../helpers/text.js';
import { regionKeyOf } from '../config/regions.js';
import { resolveProvinces } from '../config/provinceMerger.js';
import { provinceRepo } from '../repositories/provinceRepository.js';
import { locationRepo } from '../repositories/locationRepository.js';
import { buildItineraryDays } from './itineraryPlanner.js';

// Quy trình: (1) AI phân tích yêu cầu -> các chặng/tỉnh + nhịp độ; (2) hệ thống quy đổi tỉnh (kể cả tên trước sáp nhập)
// và lấy địa điểm thật từ DB; (3) AI chọn địa điểm, viết ghi chú; (4) hệ thống kiểm tra lựa chọn, đảm bảo đủ số điểm,
// chia ngày, tối ưu lộ trình và xếp giờ. Những phần cần chính xác do code đảm nhận, AI chỉ lo phần hiểu ngôn ngữ.

const DEFAULT_DAYS = 3;
const MAX_DAYS = 14;
const MAX_PROMPT_LENGTH = 1500;
const MAX_CANDIDATES = 60;
const MAX_DESCRIPTION_LENGTH = 150;

// Nhịp độ chuyến đi: số điểm mỗi ngày và thời gian tham quan mặc định (phút)
const PACES = {
    cham: { label: 'chậm, thư giãn', stopsPerDay: 3, stayMinutes: 150 },
    vua: { label: 'vừa phải', stopsPerDay: 4, stayMinutes: 90 },
    nhanh: { label: 'nhanh, đi nhiều nơi', stopsPerDay: 5, stayMinutes: 60 },
};

let client;
const getClient = () => {
    if (!env.ai.apiKey) throw new HttpError(503, 'Tính năng AI chưa được cấu hình (thiếu AI_API_KEY)');
    client ??= new OpenAI({ apiKey: env.ai.apiKey, baseURL: env.ai.baseUrl });
    return client;
};

const buildReceptionistPrompt = (provinceNames) => `
Đọc yêu cầu du lịch và phân tích thành các chặng đường (route legs).
Nếu yêu cầu KHÔNG liên quan đến du lịch, đặt "is_valid" = false và giải thích ngắn trong "error_message".

QUY TẮC:
1. Mỗi chặng ứng với MỘT tỉnh/thành. Từ 01/07/2025 Việt Nam còn 34 tỉnh/thành sau sáp nhập, gồm:
${provinceNames.join(', ')}.
   - Ưu tiên ghi đúng một tên trong danh sách trên vào "province_name".
   - Nếu khách dùng tên tỉnh cũ (VD: Hà Giang, Yên Bái, Quảng Nam, Kiên Giang) hoặc tên điểm đến (VD: Sa Pa, Đà Lạt, Phú Quốc, Hội An),
     hãy ghi tên tỉnh chứa địa danh đó; ghi tên tỉnh cũ cũng được, hệ thống sẽ tự quy đổi sang tỉnh mới.
2. Nếu khách nhắc tới cung đường hoặc danh hiệu chung (VD: "tứ đại đỉnh đèo", "vòng cung Tây Bắc"), tự suy ra các tỉnh và địa danh
   cốt lõi của hành trình, chia thành nhiều chặng theo thứ tự di chuyển hợp lý.
3. "keywords": các địa danh cụ thể khách nhắc tới hoặc thuộc hành trình (tên đèo, thác, bản, phố cổ...). Không ghi tên tỉnh vào đây.
4. "pace" (nhịp độ): "cham" nếu khách muốn thư giãn, chữa lành, ít điểm; "nhanh" nếu muốn đi nhiều nơi, check-in, lịch dày; còn lại "vua".

Ví dụ "Đi tứ đại đỉnh đèo": chặng 1 Lào Cai (keywords: Ô Quy Hồ, Khau Phạ), chặng 2 Tuyên Quang (keywords: Mã Pí Lèng),
chặng 3 Điện Biên (keywords: Pha Đin).

Trả về JSON đúng cấu trúc:
{
  "is_valid": true,
  "error_message": "",
  "pace": "vua",
  "route_legs": [
    { "leg": 1, "province_name": "Tên tỉnh", "keywords": ["Địa danh"] }
  ]
}
`;

const shortName = (name) => String(name ?? '').split(' · ')[0].trim();

const describeCandidate = (loc, index) => {
    const parts = [`L${index + 1}`, loc.name, loc.provinces?.name ?? '', `độ khó: ${loc.difficulty_level || '-'}`, `đã lưu: ${loc.saved_count ?? 0}`];
    if (loc.description) parts.push(loc.description.trim().slice(0, MAX_DESCRIPTION_LENGTH));
    return parts.join(' | ');
};

const buildPlannerPrompt = ({ daysCount, pace, targetStops, candidates }) => `
Bạn là chuyên gia lên lịch trình du lịch Việt Nam. Chuyến đi ${daysCount} ngày, nhịp độ ${PACES[pace].label}.

DANH SÁCH ĐỊA ĐIỂM (mỗi dòng: mã | tên | tỉnh | độ khó | số người đã lưu | mô tả nếu có):
${candidates.map(describeCandidate).join('\n')}

NHIỆM VỤ:
1. Chọn ĐÚNG ${targetStops} địa điểm trong danh sách trên, ghi bằng mã (VD: "L3"). Không lặp lại, không tự tạo địa điểm mới.
   Ưu tiên địa điểm khớp yêu cầu và phong cách của khách, địa danh nổi tiếng, nhiều người lưu.
   Nếu hai dòng là cùng một địa điểm (tên giống nhau hoặc chỉ khác ngôn ngữ), chỉ chọn một.
2. Liệt kê theo thứ tự hành trình (theo thứ tự các chặng). KHÔNG cần chia ngày hay ghi giờ: hệ thống sẽ tự chia ngày,
   tối ưu quãng đường và xếp giờ.
3. Với mỗi địa điểm:
   - "ref" và "name": mã và tên chép đúng từ dòng tương ứng trong danh sách.
   - "duration_minutes": thời gian tham quan hợp lý (30-240 phút); lâu hơn nếu khách muốn thư giãn.
   - "cost": ước tính chi phí vé/dịch vụ tại điểm đó (VNĐ, số nguyên; 0 nếu miễn phí). Không cộng tiền ăn ở.
   - "activity_note": 1-2 câu tiếng Việt gợi ý nên làm gì ở ĐÚNG địa điểm đó, theo phong cách khách muốn.
     Không nhắc thời điểm trong ngày (sáng, trưa, hoàng hôn...) vì giờ giấc do hệ thống xếp sau.
4. "daily_expense": chi phí ăn, ở, đi lại ước tính cho MỘT ngày của một người (VNĐ, số nguyên), hợp với ngân sách của khách.
5. "title", "theme", "summary" cho cả chuyến đi, bằng tiếng Việt.

Trả về JSON đúng cấu trúc:
{
  "title": "Tên chuyến đi",
  "theme": "Khám phá/Nghỉ dưỡng...",
  "summary": "Tóm tắt 2-3 câu",
  "daily_expense": 700000,
  "stops": [
    { "ref": "L1", "name": "Tên địa điểm", "duration_minutes": 90, "cost": 0, "activity_note": "..." }
  ]
}
`;

const askJson = async (systemPrompt, userPrompt, temperature) => {
    let res;
    try {
        res = await getClient().chat.completions.create({
            model: env.ai.model,
            response_format: { type: 'json_object' },
            temperature,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        });
    } catch (error) {
        if (error?.status === 429) {
            throw new HttpError(429, 'Dịch vụ AI đang quá tải hoặc đã hết lượt miễn phí, vui lòng thử lại sau ít phút.');
        }
        throw new HttpError(502, `Không gọi được dịch vụ AI: ${error.message}`);
    }
    try {
        return JSON.parse(res.choices[0].message.content);
    } catch {
        throw new HttpError(502, 'AI trả về dữ liệu không đúng định dạng JSON');
    }
};

const hasCoords = (loc) => Number.isFinite(loc.lat) && Number.isFinite(loc.lng) && !(loc.lat === 0 && loc.lng === 0);

// Bỏ trùng (cùng tên), xếp hạng (khớp từ khóa > lượt lưu > đánh giá) và chia đều hạn mức cho các tỉnh
// để tỉnh nào trong hành trình cũng có địa điểm trong danh sách gửi AI.
const rankCandidates = (locations, keywords) => {
    const keys = keywords.map(normalizeText).filter((key) => key.length >= 2);
    const matchesKeyword = (loc) => (keys.some((key) => normalizeText(loc.name).includes(key)) ? 1 : 0);

    const unique = new Map();
    for (const loc of locations.filter(hasCoords)) {
        const key = normalizeText(shortName(loc.name));
        const existing = unique.get(key);
        if (!existing || (loc.saved_count ?? 0) > (existing.saved_count ?? 0)) unique.set(key, loc);
    }
    const sorted = [...unique.values()].sort(
        (a, b) =>
            matchesKeyword(b) - matchesKeyword(a) ||
            (b.saved_count ?? 0) - (a.saved_count ?? 0) ||
            (b.rating ?? 0) - (a.rating ?? 0),
    );
    const groups = Map.groupBy(sorted, (loc) => loc.province_id);
    const perProvince = Math.ceil(MAX_CANDIDATES / Math.max(1, groups.size));
    return [...groups.values()].flatMap((list) => list.slice(0, perProvince)).slice(0, MAX_CANDIDATES);
};

const loadCandidates = async (legs, provinces) => {
    const matched = new Map();
    const unmatched = [];
    for (const leg of legs) {
        const found = resolveProvinces(leg.province_name, provinces);
        found.forEach((province) => matched.set(province.id, province));
        if (!found.length) unmatched.push(leg);
    }

    const [byProvince, byKeyword] = await Promise.all([
        locationRepo.getByProvincesForAi([...matched.keys()]),
        // Chặng không xác định được tỉnh thì tìm theo địa danh
        unmatched.length ? locationRepo.searchByKeywordsForAi(unmatched.flatMap((leg) => [...leg.keywords, leg.province_name])) : [],
    ]);
    return {
        candidates: rankCandidates([...byProvince, ...byKeyword], legs.flatMap((leg) => leg.keywords)),
        searchedNames: [...[...matched.values()].map((p) => p.name), ...unmatched.map((leg) => leg.province_name)],
    };
};

const toRef = (value) => {
    const ref = String(value ?? '').trim().toUpperCase();
    return /^\d+$/.test(ref) ? `L${ref}` : ref;
};

const toCost = (value) => {
    const cost = Math.round(Number(value));
    return Number.isFinite(cost) && cost > 0 ? cost : 0;
};

// AI đôi khi ghi lệch mã so với tên (ghi chú của điểm này gán cho mã điểm khác) -> đối chiếu tên để sửa
const findCandidate = (stop, byRef, candidates) => {
    const byCode = byRef.get(toRef(stop?.ref));
    const name = normalizeText(shortName(stop?.name));
    if (!name) return byCode;
    const sameName = (loc) => normalizeText(shortName(loc.name)) === name;
    if (byCode && sameName(byCode)) return byCode;
    return candidates.find(sameName) ?? byCode;
};

// Ghép lựa chọn của AI với dữ liệu thật: bỏ mã không tồn tại hoặc bị lặp; AI chọn thiếu thì bổ sung
// các địa điểm xếp hạng cao nhất còn lại để đủ số điểm theo nhịp độ.
const pickStops = (aiStops, candidates, target, stayMinutes) => {
    const byRef = new Map(candidates.map((loc, index) => [`L${index + 1}`, loc]));
    const chosen = new Map();
    for (const stop of Array.isArray(aiStops) ? aiStops : []) {
        const loc = findCandidate(stop, byRef, candidates);
        if (!loc || chosen.has(loc.id) || chosen.size >= target) continue;
        chosen.set(loc.id, {
            location: loc,
            duration_minutes: stop.duration_minutes ?? stayMinutes,
            cost: toCost(stop.cost),
            activity_note: String(stop.activity_note ?? '').trim(),
        });
    }
    for (const loc of candidates) {
        if (chosen.size >= target) break;
        if (!chosen.has(loc.id)) chosen.set(loc.id, { location: loc, duration_minutes: stayMinutes, cost: 0, activity_note: '' });
    }
    return [...chosen.values()].map((stop) => ({ ...stop, lat: stop.location.lat, lng: stop.location.lng }));
};

const dayTitle = (dayNumber, stops) => {
    if (!stops.length) return `Ngày ${dayNumber}: Tự do nghỉ ngơi`;
    const first = shortName(stops[0].location.name);
    return stops.length > 1 ? `Ngày ${dayNumber}: ${first} → ${shortName(stops.at(-1).location.name)}` : `Ngày ${dayNumber}: ${first}`;
};

const toItinerary = (plan, dayStops) => {
    const allStops = dayStops.flat();
    const provinces = new Map(allStops.map((stop) => [stop.location.province_id, stop.location.provinces?.name ?? '']));
    // Tổng chi phí = vé/dịch vụ tại các điểm + chi phí ăn, ở, đi lại mỗi ngày
    const ticketCost = allStops.reduce((sum, stop) => sum + stop.cost, 0);
    return {
        title: String(plan?.title ?? '').trim(),
        theme: String(plan?.theme ?? '').trim(),
        summary: String(plan?.summary ?? '').trim(),
        estimated_cost: ticketCost + dayStops.length * toCost(plan?.daily_expense),
        itinerary_provinces: [...provinces].map(([province_id, province_name]) => ({ province_id, province_name })),
        itinerary_days: dayStops.map((stops, index) => ({
            day_number: index + 1,
            title: dayTitle(index + 1, stops),
            itinerary_locations: stops.map((stop, order) => ({
                location_id: stop.location.id,
                location_name: stop.location.name,
                lat: stop.lat,
                lng: stop.lng,
                start_time: stop.start_time,
                end_time: stop.end_time,
                cost: stop.cost,
                activity_note: stop.activity_note,
                sequence_order: order + 1,
            })),
        })),
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
    // Chỉ dùng các tỉnh có trong danh sách 34 tỉnh chính thức (bỏ dữ liệu rác trong bảng provinces)
    const provinces = (await provinceRepo.getAllNames()).filter((p) => regionKeyOf(p.name));

    const intent = await askJson(buildReceptionistPrompt(provinces.map((p) => p.name)), cleanPrompt, 0);
    if (!intent.is_valid || !Array.isArray(intent.route_legs) || intent.route_legs.length === 0) {
        throw new HttpError(400, intent.error_message || 'Yêu cầu không hợp lệ.');
    }
    const legs = intent.route_legs.map((leg) => ({
        province_name: String(leg?.province_name ?? ''),
        keywords: Array.isArray(leg?.keywords) ? leg.keywords.map(String) : [],
    }));
    const pace = PACES[intent.pace] ? intent.pace : 'vua';

    const { candidates, searchedNames } = await loadCandidates(legs, provinces);
    if (candidates.length === 0) {
        throw new HttpError(404, `Hệ thống chưa có địa điểm nào cho: ${searchedNames.join(', ') || cleanPrompt}. Vui lòng thử địa danh khác!`);
    }

    const targetStops = Math.min(candidates.length, days * PACES[pace].stopsPerDay);
    const plan = await askJson(
        buildPlannerPrompt({ daysCount: days, pace, targetStops, candidates }),
        `Yêu cầu của khách: ${cleanPrompt}`,
        0.4,
    );
    const stops = pickStops(plan?.stops, candidates, targetStops, PACES[pace].stayMinutes);
    return toItinerary(plan, buildItineraryDays(stops, days));
};
