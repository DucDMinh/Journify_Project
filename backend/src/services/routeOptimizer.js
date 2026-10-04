import { distanceMeters } from '../helpers/geo.js';

// Sắp xếp thứ tự tham quan trong một ngày sao cho tổng quãng đường di chuyển ngắn nhất, giữ cố định điểm đầu tiên
// (điểm xuất phát / nơi lưu trú do người dùng đặt đầu ngày).
// Đây là bài toán đường đi Hamilton ngắn nhất có điểm xuất phát cố định (TSP dạng mở - không quay lại điểm đầu),
// thuộc lớp NP-khó, nên dùng heuristic: Nearest Neighbor dựng lời giải ban đầu, 2-opt cải thiện cục bộ.
// Khoảng cách là đường chim bay (Haversine); thời gian di chuyển được ước lượng từ khoảng cách đó.

const EPSILON = 1e-6;

// Quy đổi đường chim bay sang đường bộ và tốc độ trung bình, chỉ dùng để ước lượng thời gian di chuyển:
// LOCAL_ROAD_KM đầu tiên đi đường tỉnh/đèo núi, phần còn lại của quãng dài coi như đi quốc lộ/cao tốc
const ROAD_DETOUR_FACTOR = 1.3;
const LOCAL_ROAD_KM = 50;
const LOCAL_SPEED_KMH = 35;
const HIGHWAY_SPEED_KMH = 60;
const TRAVEL_ROUND_MINUTES = 5;
const LAST_MINUTE_OF_DAY = 23 * 60 + 59;

// ---------- Thuật toán ----------

export const buildDistanceMatrix = (points) => points.map((a) => points.map((b) => distanceMeters(a, b)));

export const pathLength = (path, dist) => {
    let total = 0;
    for (let i = 1; i < path.length; i++) total += dist[path[i - 1]][path[i]];
    return total;
};

// Nearest Neighbor (tham lam): nối tiếp đoạn đường cho trước, mỗi bước đi tới điểm chưa thăm gần nhất. O(n²)
export const nearestNeighbor = (prefix, dist) => {
    const n = dist.length;
    const visited = new Array(n).fill(false);
    const path = [...prefix];
    for (const index of path) visited[index] = true;
    while (path.length < n) {
        const current = path[path.length - 1];
        let next = -1;
        for (let j = 0; j < n; j++) {
            if (!visited[j] && (next === -1 || dist[current][j] < dist[current][next])) next = j;
        }
        visited[next] = true;
        path.push(next);
    }
    return path;
};

const reverseSegment = (arr, i, j) => {
    for (; i < j; i++, j--) [arr[i], arr[j]] = [arr[j], arr[i]];
};

// 2-opt cho đường đi mở có điểm đầu cố định: đảo ngược đoạn route[i..j] (i >= 1 nên route[0] không bao giờ bị di chuyển)
// nếu việc đó làm tổng quãng đường ngắn đi, lặp đến khi không còn phép đảo nào có lợi (tối ưu cục bộ). Mỗi vòng quét O(n²).
export const twoOpt = (path, dist) => {
    const route = [...path];
    const n = route.length;
    // Sau điểm cuối không còn cạnh nào -> độ dài 0
    const edge = (a, b) => (b >= n ? 0 : dist[route[a]][route[b]]);
    let improved = true;
    while (improved) {
        improved = false;
        for (let i = 1; i < n - 1; i++) {
            for (let j = i + 1; j < n; j++) {
                // Thay cạnh (i-1, i) và (j, j+1) bằng (i-1, j) và (i, j+1)
                const delta = edge(i - 1, j) + edge(i, j + 1) - edge(i - 1, i) - edge(j, j + 1);
                if (delta < -EPSILON) {
                    reverseSegment(route, i, j);
                    improved = true;
                }
            }
        }
    }
    return route;
};

// Điểm 0 luôn đứng đầu. Chạy Nearest Neighbor với mọi lựa chọn điểm thứ hai (0 -> k -> ...) và cả thứ tự ban đầu,
// cải thiện từng lời giải bằng 2-opt rồi lấy đường ngắn nhất -> kết quả không bao giờ dài hơn thứ tự ban đầu.
// Khoảng O(n³) mỗi vòng 2-opt, đủ nhanh với số điểm trong một ngày (vài chục).
export const optimizeOrder = (points) => {
    const identity = points.map((_, i) => i);
    const dist = buildDistanceMatrix(points);
    const originalDistanceMeters = pathLength(identity, dist);
    const unchanged = { order: identity, distanceMeters: originalDistanceMeters, originalDistanceMeters };
    if (points.length < 3) return unchanged;

    let best = twoOpt(identity, dist);
    let bestLength = pathLength(best, dist);
    for (let second = 1; second < points.length; second++) {
        const candidate = twoOpt(nearestNeighbor([0, second], dist), dist);
        const length = pathLength(candidate, dist);
        if (length < bestLength - EPSILON) {
            best = candidate;
            bestLength = length;
        }
    }
    if (bestLength > originalDistanceMeters - EPSILON) return unchanged;
    return { order: best, distanceMeters: bestLength, originalDistanceMeters };
};

// ---------- Áp dụng vào lịch trình ----------

const toPoint = (value) => {
    const lat = Number(value?.lat);
    const lng = Number(value?.lng);
    const valid = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
    return valid ? { lat, lng } : null;
};

const parseTime = (value) => {
    const match = /^(\d{1,2}):(\d{2})/.exec(String(value ?? '').trim());
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
};

const pad = (n) => String(n).padStart(2, '0');
export const formatTime = (minutes) => {
    const clamped = Math.min(minutes, LAST_MINUTE_OF_DAY);
    return `${pad(Math.floor(clamped / 60))}:${pad(clamped % 60)}`;
};

const durationOf = (activity) => {
    const start = parseTime(activity.start_time);
    const end = parseTime(activity.end_time);
    return start !== null && end !== null && end > start ? end - start : null;
};

export const estimateTravelMinutes = (meters) => {
    if (meters <= 0) return 0;
    const roadKm = (meters / 1000) * ROAD_DETOUR_FACTOR;
    const hours = Math.min(roadKm, LOCAL_ROAD_KM) / LOCAL_SPEED_KMH + Math.max(0, roadKm - LOCAL_ROAD_KM) / HIGHWAY_SPEED_KMH;
    return Math.ceil((hours * 60) / TRAVEL_ROUND_MINUTES) * TRAVEL_ROUND_MINUTES;
};

// Xếp lại giờ theo thứ tự mới: giữ giờ bắt đầu ngày, thời lượng của từng hoạt động và khoảng nghỉ gốc theo vị trí
// (VD: nghỉ trưa sau hoạt động thứ 2), nhưng khoảng cách giữa hai điểm không ngắn hơn thời gian di chuyển ước lượng.
const reschedule = (original, reordered) => {
    const starts = original.map((a) => parseTime(a.start_time));
    const ends = original.map((a) => parseTime(a.end_time));
    const validStarts = starts.filter((s) => s !== null);
    if (validStarts.length === 0) return { activities: reordered, exceedsDay: false };

    const gapBefore = (index) =>
        index > 0 && starts[index] !== null && ends[index - 1] !== null ? Math.max(0, starts[index] - ends[index - 1]) : 0;

    let cursor = starts[0] ?? Math.min(...validStarts);
    let lastPoint = null;
    let exceedsDay = false;
    const activities = reordered.map((activity, index) => {
        const point = toPoint(activity);
        const travel = point && lastPoint ? estimateTravelMinutes(distanceMeters(lastPoint, point)) : 0;
        if (index > 0) cursor += Math.max(gapBefore(index), travel);
        if (point) lastPoint = point;

        const start = cursor;
        const duration = durationOf(activity);
        if (duration !== null) cursor += duration;
        if (cursor > LAST_MINUTE_OF_DAY) exceedsDay = true;
        return {
            ...activity,
            start_time: formatTime(start),
            end_time: duration === null ? activity.end_time : formatTime(cursor),
        };
    });
    return { activities, exceedsDay };
};

// Tối ưu một ngày. Hoạt động có tọa độ đầu tiên giữ nguyên là điểm xuất phát; chỉ hoán đổi các hoạt động có tọa độ
// còn lại với nhau (trong chính các vị trí của chúng); hoạt động không có tọa độ (ô trống, ghi chú...) giữ nguyên vị trí.
export const optimizeDay = (activities) => {
    const list = Array.isArray(activities) ? activities : [];
    const slots = list.flatMap((activity, index) => (toPoint(activity) ? [index] : []));
    const { order, distanceMeters: optimized, originalDistanceMeters } = optimizeOrder(slots.map((index) => toPoint(list[index])));

    const changed = order.some((k, position) => k !== position);
    const stats = { distanceMeters: optimized, originalDistanceMeters, changed };
    if (!changed) return { ...stats, exceedsDay: false, activities: list };

    const reordered = [...list];
    slots.forEach((slot, position) => {
        reordered[slot] = list[slots[order[position]]];
    });
    const { activities: scheduled, exceedsDay } = reschedule(list, reordered);
    return { ...stats, exceedsDay, activities: scheduled.map((activity, index) => ({ ...activity, sequence_order: index + 1 })) };
};
