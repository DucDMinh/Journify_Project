import { distanceMeters } from '../helpers/geo.js';
import { optimizeOrder, estimateTravelMinutes, formatTime } from './routeOptimizer.js';

// Dựng các ngày của lịch trình từ danh sách điểm đã chọn (phương pháp "route first, cluster second"):
// 1. Nối tất cả điểm thành một tour ngắn (Nearest Neighbor + 2-opt, giữ điểm xuất phát).
// 2. Cắt tour thành từng ngày bằng quy hoạch động: số điểm mỗi ngày cân bằng và ưu tiên cắt ở các chặng dài nhất,
//    để chặng dài trở thành quãng di chuyển giữa hai ngày còn mỗi ngày gói gọn trong một khu vực.
// 3. Tối ưu lại thứ tự trong từng ngày rồi xếp giờ: bắt đầu 08:00, cộng thời gian di chuyển, chèn nghỉ trưa.

const DAY_START_MINUTES = 8 * 60;
const LUNCH_FROM_MINUTES = 11 * 60 + 30;
const LUNCH_MINUTES = 60;
const DEFAULT_STAY_MINUTES = 90;
const MIN_STAY_MINUTES = 30;
const MAX_STAY_MINUTES = 240;

// Chia n điểm liên tiếp của tour thành k đoạn (mỗi đoạn từ lo đến hi điểm) sao cho tổng độ dài các cạnh bị cắt
// lớn nhất, tương đương tổng quãng đường trong các ngày nhỏ nhất. edgeLengths[i] = khoảng cách điểm i -> i+1.
// Trả về số điểm của từng đoạn. Độ phức tạp O(k · n · (hi - lo)). Yêu cầu 1 <= k <= n.
export const splitTour = (edgeLengths, n, k) => {
    const lo = Math.max(1, Math.floor(n / k) - 1);
    const hi = Math.ceil(n / k) + 1;
    // best[j][i]: tổng cạnh bị cắt lớn nhất khi chia i điểm đầu thành j đoạn; lastSize[j][i]: số điểm của đoạn cuối
    const best = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(-Infinity));
    const lastSize = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(0));
    best[0][0] = 0;
    for (let j = 1; j <= k; j++) {
        for (let i = 1; i <= n; i++) {
            for (let size = lo; size <= Math.min(hi, i); size++) {
                const previous = best[j - 1][i - size];
                if (previous === -Infinity) continue;
                // Đoạn thứ j bắt đầu ở điểm i - size; từ đoạn thứ 2 trở đi, cạnh nối với đoạn trước bị cắt
                const value = previous + (j > 1 ? edgeLengths[i - size - 1] : 0);
                if (value > best[j][i]) {
                    best[j][i] = value;
                    lastSize[j][i] = size;
                }
            }
        }
    }

    const sizes = [];
    for (let j = k, i = n; j > 0; j--) {
        sizes.unshift(lastSize[j][i]);
        i -= lastSize[j][i];
    }
    return sizes;
};

const clampStay = (minutes) => {
    const value = Math.round(Number(minutes));
    if (!Number.isFinite(value) || value <= 0) return DEFAULT_STAY_MINUTES;
    return Math.min(MAX_STAY_MINUTES, Math.max(MIN_STAY_MINUTES, value));
};

// Xếp giờ cho các điểm trong một ngày theo đúng thứ tự đã có
export const scheduleDay = (stops) => {
    let cursor = DAY_START_MINUTES;
    let hadLunch = false;
    return stops.map((stop, index) => {
        if (index > 0) cursor += estimateTravelMinutes(distanceMeters(stops[index - 1], stop));
        if (!hadLunch && cursor >= LUNCH_FROM_MINUTES) {
            cursor += LUNCH_MINUTES;
            hadLunch = true;
        }
        const start = cursor;
        cursor += clampStay(stop.duration_minutes);
        return { ...stop, start_time: formatTime(start), end_time: formatTime(cursor) };
    });
};

// stops: các điểm có lat/lng (và duration_minutes), điểm đầu tiên là điểm xuất phát của chuyến đi.
// Trả về mảng dayCount phần tử, mỗi phần tử là danh sách điểm của ngày đó (đã có start_time/end_time).
export const buildItineraryDays = (stops, dayCount) => {
    const days = Array.from({ length: dayCount }, () => []);
    if (stops.length === 0 || dayCount < 1) return days;

    const tour = optimizeOrder(stops).order.map((index) => stops[index]);
    const edgeLengths = tour.slice(1).map((stop, i) => distanceMeters(tour[i], stop));
    const sizes = splitTour(edgeLengths, tour.length, Math.min(dayCount, tour.length));

    let offset = 0;
    sizes.forEach((size, day) => {
        const segment = tour.slice(offset, offset + size);
        offset += size;
        days[day] = scheduleDay(optimizeOrder(segment).order.map((index) => segment[index]));
    });
    return days;
};
