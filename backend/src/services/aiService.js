import OpenAI from 'openai';
import { env } from '../config/env.js';
import { HttpError } from '../helpers/httpError.js';
import { normalizeText } from '../helpers/text.js';
import { distanceMeters } from '../helpers/geo.js';
import { REGIONS, normalizeProvinceName, regionKeyOf } from '../config/regions.js';
import { destinationProvinceName, destinationsIn, destinationsMentioned, resolveProvinces } from '../config/provinceMerger.js';
import { provinceRepo } from '../repositories/provinceRepository.js';
import { locationRepo } from '../repositories/locationRepository.js';
import { buildItineraryDays } from './itineraryPlanner.js';
import { focusAround, focusKeys, hasCoords, keywordAnchors, MIN_FOCUSED_STOPS } from './geoFocus.js';
import { geocode } from './mapService.js';

const DEFAULT_DAYS = 3;
const MAX_DAYS = 30;
const MAX_PROMPT_LENGTH = 1500;
const MIN_CANDIDATES = 60;
const MAX_CANDIDATES = 200;
const MAX_DESCRIPTION_LENGTH = 60;
const MAX_DETAILED_STOPS = 40;
const NEAR_DUPLICATE_METERS = 1000;

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
Chỉ đặt "is_valid" = false khi yêu cầu KHÔNG liên quan đến du lịch, kèm giải thích ngắn trong "error_message".
Yêu cầu chung chung (VD: "xuyên Việt", "đi khắp miền Bắc", "đi tất cả các điểm") vẫn HỢP LỆ: hãy tự suy ra các tỉnh phù hợp.

QUY TẮC:
1. Mỗi chặng ứng với MỘT tỉnh/thành. Từ 01/07/2025 Việt Nam còn 34 tỉnh/thành sau sáp nhập, gồm:
${provinceNames.join(', ')}.
   - Ưu tiên ghi đúng một tên trong danh sách trên vào "province_name".
   - Nếu khách dùng tên tỉnh cũ (VD: Hà Giang, Yên Bái, Quảng Nam, Kiên Giang) hoặc tên điểm đến (VD: Sa Pa, Đà Lạt, Phú Quốc, Hội An),
     hãy ghi tên tỉnh chứa địa danh đó; ghi tên tỉnh cũ cũng được, hệ thống sẽ tự quy đổi sang tỉnh mới.
2. Nếu khách nhắc tới cung đường hoặc danh hiệu chung (VD: "tứ đại đỉnh đèo", "vòng cung Tây Bắc"), tự suy ra các tỉnh và địa danh
   cốt lõi của hành trình, chia thành nhiều chặng theo thứ tự di chuyển hợp lý.
3. "keywords": các địa danh cụ thể khách nhắc tới hoặc thuộc hành trình (tên đèo, thác, bản, phố cổ...). Không ghi tên tỉnh vào đây,
   nhưng nếu khách nêu thành phố/điểm đến cụ thể (VD: Đà Lạt, Sa Pa, Hội An, Nha Trang) thì PHẢI ghi tên đó vào keywords.
4. "pace" (nhịp độ): "cham" nếu khách muốn thư giãn, chữa lành, ít điểm; "nhanh" nếu muốn đi nhiều nơi, check-in, lịch dày; còn lại "vua".
5. "whole_country": true nếu khách muốn đi khắp Việt Nam / xuyên Việt; khi đó chỉ cần ghi chặng xuất phát (nếu khách nói rõ),
   hệ thống tự thêm các tỉnh còn lại theo thứ tự Bắc - Nam.
6. "visit_all": true nếu khách muốn đi TẤT CẢ các địa điểm có trong hệ thống/trong các tỉnh đã chọn.

Ví dụ "Đi tứ đại đỉnh đèo": chặng 1 Lào Cai (keywords: Ô Quy Hồ, Khau Phạ), chặng 2 Tuyên Quang (keywords: Mã Pí Lèng),
chặng 3 Điện Biên (keywords: Pha Đin).
Ví dụ "Phượt xuyên Việt từ Hà Nội": whole_country = true, chặng 1 Hà Nội.

Trả về JSON đúng cấu trúc:
{
  "is_valid": true,
  "error_message": "",
  "pace": "vua",
  "whole_country": false,
  "visit_all": false,
  "route_legs": [
    { "leg": 1, "province_name": "Tên tỉnh", "keywords": ["Địa danh"] }
  ]
}
`;

const shortName = (name) => String(name ?? '').split(' · ')[0].trim();

const describeCandidates = (candidates) => {
    let province = null;
    return candidates
        .flatMap((loc, index) => {
            const lines = [];
            const provinceName = loc.provinces?.name ?? '';
            if (provinceName !== province) {
                province = provinceName;
                lines.push(`# ${provinceName}`);
            }
            const description = loc.description ? ` - ${loc.description.trim().slice(0, MAX_DESCRIPTION_LENGTH)}` : '';
            lines.push(`L${index + 1} ${shortName(loc.name)}${description}`);
            return lines;
        })
        .join('\n');
};

const buildPlannerPrompt = ({ daysCount, pace, targetStops, candidates }) => {
    const detailed = Math.min(targetStops, MAX_DETAILED_STOPS);
    const takesAll = targetStops >= candidates.length;
    const selection = takesAll
        ? `Tất cả ${candidates.length} địa điểm trong danh sách đều được đưa vào lịch trình, không cần chọn.`
        : `Chọn ĐÚNG ${targetStops} địa điểm trong danh sách, chỉ dùng mã (VD: "L3"). Không lặp lại, không tự tạo địa điểm mới.
   Ưu tiên địa điểm khớp yêu cầu và phong cách của khách, địa danh nổi tiếng.
   Nếu hai dòng là cùng một địa điểm (chỉ khác ngôn ngữ), chỉ chọn một.`;
    return `
Bạn là chuyên gia lên lịch trình du lịch Việt Nam. Chuyến đi ${daysCount} ngày, nhịp độ ${PACES[pace].label}.

DANH SÁCH ĐỊA ĐIỂM (nhóm theo tỉnh, trong mỗi tỉnh xếp từ phổ biến nhất; mỗi dòng: mã, tên, mô tả nếu có):
${describeCandidates(candidates)}

NHIỆM VỤ:
1. ${selection}
   Hệ thống sẽ tự chia ngày, tối ưu quãng đường và xếp giờ nên KHÔNG cần sắp thứ tự hay ghi giờ.
2. "highlights": ${detailed} địa điểm nổi bật nhất trong số đã chọn, mỗi điểm gồm:
   - "ref" và "name": mã và tên chép đúng từ danh sách.
   - "duration_minutes": thời gian tham quan hợp lý (30-240 phút); lâu hơn nếu khách muốn thư giãn.
   - "cost": ước tính giá vé/dịch vụ tại điểm đó (VNĐ, số nguyên; 0 nếu miễn phí). Không cộng tiền ăn ở.
   - "activity_note": MỘT câu tiếng Việt (tối đa 25 từ) gợi ý nên làm gì ở ĐÚNG địa điểm đó, theo phong cách khách muốn.
     Không nhắc thời điểm trong ngày (sáng, trưa, hoàng hôn...) vì giờ giấc do hệ thống xếp sau.
3. "other_refs": ${takesAll || targetStops === detailed ? 'để mảng rỗng.' : `mã của ${targetStops - detailed} địa điểm đã chọn còn lại (không trùng với highlights).`}
4. "daily_expense": chi phí ăn, ở, đi lại ước tính cho MỘT ngày của một người (VNĐ, số nguyên), hợp với ngân sách của khách.
5. "title", "theme", "summary" (2-3 câu) cho cả chuyến đi, bằng tiếng Việt.

Trả về JSON đúng cấu trúc:
{
  "title": "Tên chuyến đi",
  "theme": "Khám phá/Nghỉ dưỡng...",
  "summary": "Tóm tắt",
  "daily_expense": 700000,
  "highlights": [
    { "ref": "L1", "name": "Tên địa điểm", "duration_minutes": 90, "cost": 0, "activity_note": "..." }
  ],
  "other_refs": ["L5", "L9"]
}
`;
};

const askJson = async (systemPrompt, userPrompt, temperature) => {
    let res;
    try {
        res = await getClient().chat.completions.create({
            model: env.ai.model,
            response_format: { type: 'json_object' },
            temperature,
            ...(env.ai.reasoningEffort ? { reasoning_effort: env.ai.reasoningEffort } : {}),
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

const nameTokens = (loc) => new Set(normalizeText(shortName(loc.name)).split(' ').filter((token) => token.length > 2));

const isSamePlace = (a, b) => {
    if (distanceMeters(a, b) > NEAR_DUPLICATE_METERS) return false;
    const nameA = normalizeText(shortName(a.name));
    const nameB = normalizeText(shortName(b.name));
    if (nameA.includes(nameB) || nameB.includes(nameA)) return true;
    const tokensA = nameTokens(a);
    const tokensB = nameTokens(b);
    const shared = [...tokensA].filter((token) => tokensB.has(token)).length;
    return shared > 0 && shared / Math.min(tokensA.size, tokensB.size) >= 0.75;
};

const rankCandidates = (locations, keywords, limit) => {
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
    const distinct = [];
    for (const loc of sorted) if (!distinct.some((kept) => isSamePlace(kept, loc))) distinct.push(loc);

    const groups = [...Map.groupBy(distinct, (loc) => loc.province_id).values()];
    const picked = new Set();
    for (let round = 0; picked.size < limit && groups.some((list) => list.length > round); round++) {
        for (const list of groups) {
            if (round < list.length && picked.size < limit) picked.add(list[round]);
        }
    }
    return groups.flatMap((list) => list.filter((loc) => picked.has(loc)));
};

const MAX_GEOCODED_KEYWORDS = 2;

const legAnchors = async (leg, pool) => {
    const anchors = keywordAnchors(pool, leg.keywords);
    if (anchors.length > 0 || focusKeys(leg.keywords).length === 0) return anchors;
    const geocoded = await Promise.all(leg.keywords.slice(0, MAX_GEOCODED_KEYWORDS).map((keyword) => geocode(keyword).catch(() => null)));
    return geocoded.filter((point) => point && hasCoords(point));
};

const loadCandidates = async (legs, provinces, limit, wantedStops) => {
    const legProvinces = legs.map((leg) => resolveProvinces(leg.province_name, provinces));
    const matched = new Map(legProvinces.flat().map((province) => [province.id, province]));
    const unmatched = legs.filter((_, index) => legProvinces[index].length === 0);

    const [byProvince, byKeyword] = await Promise.all([
        locationRepo.getByProvincesForAi([...matched.keys()]),
        unmatched.length ? locationRepo.searchByKeywordsForAi(unmatched.flatMap((leg) => [...leg.keywords, leg.province_name])) : [],
    ]);

    const perLegStops = Math.max(MIN_FOCUSED_STOPS, Math.ceil(wantedStops / Math.max(1, legs.length - unmatched.length)));
    const focusedPools = await Promise.all(
        legs.map(async (leg, index) => {
            const ids = new Set(legProvinces[index].map((province) => province.id));
            if (ids.size === 0) return [];
            const pool = byProvince.filter((loc) => ids.has(loc.province_id));
            return focusAround(pool, await legAnchors(leg, pool), perLegStops);
        }),
    );
    const pooled = [...new Map([...focusedPools.flat(), ...byKeyword].map((loc) => [loc.id, loc])).values()];
    const searchedNames = legs.map((leg, index) => {
        const destinations = leg.keywords.filter(destinationProvinceName);
        const provinceLabel = legProvinces[index].map((p) => p.name).join(', ') || leg.province_name;
        return destinations.length ? `${destinations.join(', ')} (${provinceLabel})` : provinceLabel;
    });
    return {
        candidates: rankCandidates(pooled, legs.flatMap((leg) => leg.keywords), limit),
        searchedNames: [...new Set(searchedNames)],
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

const findCandidate = (stop, byRef, candidates) => {
    const byCode = byRef.get(toRef(stop?.ref));
    const name = normalizeText(shortName(stop?.name));
    if (!name) return byCode;
    const sameName = (loc) => normalizeText(shortName(loc.name)) === name;
    if (byCode && sameName(byCode)) return byCode;
    return candidates.find(sameName) ?? byCode;
};

const pickStops = (plan, candidates, target, stayMinutes) => {
    const byRef = new Map(candidates.map((loc, index) => [`L${index + 1}`, loc]));
    const chosen = new Map();
    const add = (loc, details = {}) => {
        if (!loc || chosen.has(loc.id) || chosen.size >= target) return;
        chosen.set(loc.id, {
            location: loc,
            duration_minutes: details.duration_minutes ?? stayMinutes,
            cost: toCost(details.cost),
            activity_note: String(details.activity_note ?? '').trim(),
        });
    };
    for (const stop of Array.isArray(plan?.highlights) ? plan.highlights : []) add(findCandidate(stop, byRef, candidates), stop);
    for (const ref of Array.isArray(plan?.other_refs) ? plan.other_refs : []) add(byRef.get(toRef(ref)));
    for (const loc of candidates) {
        if (chosen.size >= target) break;
        if (!chosen.has(loc.id)) chosen.set(loc.id, { location: loc, duration_minutes: stayMinutes, cost: 0, activity_note: '' });
    }
    return [...chosen.values()].map((stop) => ({ ...stop, lat: stop.location.lat, lng: stop.location.lng }));
};

const provincesNorthToSouth = (provinces) => {
    const byKey = new Map(provinces.map((p) => [normalizeProvinceName(p.name), p]));
    return REGIONS.flatMap((region) => region.provinces)
        .map((name) => byKey.get(normalizeProvinceName(name)))
        .filter(Boolean);
};

const withStartFirst = (stops, startProvinceId) => {
    if (stops.length < 2) return stops;
    const center = {
        lat: stops.reduce((sum, s) => sum + s.lat, 0) / stops.length,
        lng: stops.reduce((sum, s) => sum + s.lng, 0) / stops.length,
    };
    const inStartProvince = stops.filter((s) => s.location.province_id === startProvinceId);
    const pool = inStartProvince.length ? inStartProvince : stops;
    const start = pool.reduce((best, s) => (distanceMeters(center, s) > distanceMeters(center, best) ? s : best));
    return [start, ...stops.filter((s) => s !== start)];
};

const dayTitle = (dayNumber, stops) => {
    if (!stops.length) return `Ngày ${dayNumber}: Tự do nghỉ ngơi`;
    const first = shortName(stops[0].location.name);
    return stops.length > 1 ? `Ngày ${dayNumber}: ${first} → ${shortName(stops.at(-1).location.name)}` : `Ngày ${dayNumber}: ${first}`;
};

const toItinerary = (plan, dayStops) => {
    const allStops = dayStops.flat();
    const provinces = new Map(allStops.map((stop) => [stop.location.province_id, stop.location.provinces?.name ?? '']));
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
    const provinces = (await provinceRepo.getAllNames()).filter((p) => regionKeyOf(p.name));

    const intent = await askJson(buildReceptionistPrompt(provinces.map((p) => p.name)), cleanPrompt, 0);
    if (intent.is_valid === false) {
        throw new HttpError(400, intent.error_message || 'Yêu cầu không liên quan đến du lịch.');
    }
    const legs = (Array.isArray(intent.route_legs) ? intent.route_legs : []).map((leg) => {
        const provinceName = String(leg?.province_name ?? '');
        const keywords = [...new Set([...(Array.isArray(leg?.keywords) ? leg.keywords.map(String) : []), ...destinationsIn(provinceName)])];
        const knownProvince = keywords.map(destinationProvinceName).find(Boolean);
        return { province_name: knownProvince ?? provinceName, keywords };
    });
    const mentioned = destinationsMentioned(cleanPrompt);
    const coveredProvinces = () => new Set(legs.flatMap((leg) => resolveProvinces(leg.province_name, provinces).map((p) => normalizeProvinceName(p.name))));
    for (const destination of mentioned) {
        if (intent.whole_country !== true && !coveredProvinces().has(destination.province)) {
            legs.push({ province_name: destinationProvinceName(destination.name), keywords: [destination.name] });
        }
    }
    for (const leg of legs) {
        const legProvinces = new Set(resolveProvinces(leg.province_name, provinces).map((p) => normalizeProvinceName(p.name)));
        const extra = mentioned.filter((destination) => legProvinces.has(destination.province)).map((destination) => destination.name);
        leg.keywords = [...new Set([...leg.keywords, ...extra])];
    }
    if (intent.whole_country === true) {
        legs.push(...provincesNorthToSouth(provinces).map((p) => ({ province_name: p.name, keywords: [] })));
    }
    if (legs.length === 0) throw new HttpError(400, 'Vui lòng cho biết điểm đến hoặc hành trình mong muốn.');
    const pace = PACES[intent.pace] ? intent.pace : 'vua';

    const wantedStops = intent.visit_all === true ? MAX_CANDIDATES : days * PACES[pace].stopsPerDay;
    const candidateLimit = Math.min(MAX_CANDIDATES, Math.max(MIN_CANDIDATES, Math.ceil(wantedStops * 1.5)));
    const { candidates, searchedNames } = await loadCandidates(legs, provinces, candidateLimit, wantedStops);
    if (candidates.length === 0) {
        throw new HttpError(404, `Hệ thống chưa có địa điểm nào cho: ${searchedNames.join(', ') || cleanPrompt}. Vui lòng thử địa danh khác!`);
    }

    const targetStops = Math.min(candidates.length, wantedStops);
    let plan;
    try {
        plan = await askJson(buildPlannerPrompt({ daysCount: days, pace, targetStops, candidates }), `Yêu cầu của khách: ${cleanPrompt}`, 0.4);
    } catch (error) {
        console.warn('[aiService] Bước chọn địa điểm lỗi, dùng lịch trình tự động:', error.message);
        plan = {
            summary: 'AI tạm thời chưa viết được gợi ý chi tiết; lịch trình được hệ thống tự chọn theo độ phổ biến và tối ưu quãng đường.',
        };
    }
    const stops = pickStops(plan, candidates, targetStops, PACES[pace].stayMinutes);
    const startProvinceId = resolveProvinces(legs[0].province_name, provinces)[0]?.id;
    const { days: dayStops, dropped } = buildItineraryDays(withStartFirst(stops, startProvinceId), days);
    const itinerary = toItinerary(plan, dayStops);
    if (dropped > 0) {
        itinerary.summary = `${itinerary.summary} (${days} ngày không đủ thời gian để đi hết nên hệ thống đã bỏ bớt ${dropped} địa điểm ít nổi bật nhất.)`.trim();
    }
    return itinerary;
};
