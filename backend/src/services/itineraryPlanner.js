import { distanceMeters } from '../helpers/geo.js';
import { optimizeOrder, estimateTravelMinutes, formatTime } from './routeOptimizer.js';


const DAY_START_MINUTES = 8 * 60;
const DAY_END_MINUTES = 21 * 60;
const LUNCH_FROM_MINUTES = 11 * 60 + 30;
const LUNCH_MINUTES = 60;
const DEFAULT_STAY_MINUTES = 90;
const MIN_STAY_MINUTES = 30;
const MAX_STAY_MINUTES = 240;
const DAY_ACTIVE_MINUTES = DAY_END_MINUTES - DAY_START_MINUTES - LUNCH_MINUTES;
const TIME_BUDGET_RATIO = 0.85;

const clampStay = (minutes) => {
    const value = Math.round(Number(minutes));
    if (!Number.isFinite(value) || value <= 0) return DEFAULT_STAY_MINUTES;
    return Math.min(MAX_STAY_MINUTES, Math.max(MIN_STAY_MINUTES, value));
};

const travelMinutes = (a, b) => estimateTravelMinutes(distanceMeters(a, b));

const tourMinutes = (tour) =>
    tour.reduce((sum, stop, i) => sum + clampStay(stop.duration_minutes) + (i > 0 ? travelMinutes(tour[i - 1], stop) : 0), 0);
export const splitIntoDays = (tour, k) => {
    const n = tour.length;
    const stayPrefix = [0];
    tour.forEach((stop, i) => stayPrefix.push(stayPrefix[i] + clampStay(stop.duration_minutes)));
    const edges = tour.slice(1).map((stop, i) => travelMinutes(tour[i], stop));
    const edgePrefix = [0];
    edges.forEach((minutes, i) => edgePrefix.push(edgePrefix[i] + minutes));
    const dayLoad = (from, to) => {
        const incoming = from > 0 ? edges[from - 1] : 0;
        const active = incoming + (edgePrefix[to - 1] - edgePrefix[from]) + (stayPrefix[to] - stayPrefix[from]);
        return active > LUNCH_FROM_MINUTES - DAY_START_MINUTES ? active + LUNCH_MINUTES : active;
    };
    const worse = (a, b) => a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);
    const best = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(null));
    const lastStart = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(0));
    best[0][0] = [0, 0];
    for (let j = 1; j <= k; j++) {
        for (let i = j; i <= n - (k - j); i++) {
            for (let from = j - 1; from < i; from++) {
                const previous = best[j - 1][from];
                if (!previous) continue;
                const cut = from > 0 ? edges[from - 1] : 0;
                const candidate = [Math.max(previous[0], dayLoad(from, i)), previous[1] - cut];
                if (!best[j][i] || worse(best[j][i], candidate)) {
                    best[j][i] = candidate;
                    lastStart[j][i] = from;
                }
            }
        }
    }

    const sizes = [];
    for (let j = k, i = n; j > 0; j--) {
        sizes.unshift(i - lastStart[j][i]);
        i = lastStart[j][i];
    }
    return sizes;
};

export const scheduleDay = (stops, previous = null) => {
    let cursor = DAY_START_MINUTES + (previous && stops.length ? travelMinutes(previous, stops[0]) : 0);
    let hadLunch = false;
    return stops.map((stop, index) => {
        if (index > 0) cursor += travelMinutes(stops[index - 1], stop);
        if (!hadLunch && cursor >= LUNCH_FROM_MINUTES) {
            cursor += LUNCH_MINUTES;
            hadLunch = true;
        }
        const start = cursor;
        cursor += clampStay(stop.duration_minutes);
        return { ...stop, start_time: formatTime(start), end_time: formatTime(cursor) };
    });
};

const toTour = (stops) => optimizeOrder(stops).order.map((index) => stops[index]);
export const buildItineraryDays = (stops, dayCount) => {
    const days = Array.from({ length: dayCount }, () => []);
    if (stops.length === 0 || dayCount < 1) return { days, dropped: 0 };
    const budget = dayCount * DAY_ACTIVE_MINUTES * TIME_BUDGET_RATIO;
    const priority = new Map(stops.map((stop, index) => [stop, index]));
    let tour = toTour(stops);
    let trimmed = false;
    while (tour.length > Math.max(1, dayCount) && tourMinutes(tour) > budget) {
        const lowest = tour.slice(1).reduce((a, b) => (priority.get(b) > priority.get(a) ? b : a));
        tour = tour.filter((stop) => stop !== lowest);
        trimmed = true;
    }
    if (trimmed) tour = toTour(tour);

    const sizes = splitIntoDays(tour, Math.min(dayCount, tour.length));
    let offset = 0;
    let previous = null;
    sizes.forEach((size, day) => {
        const segment = tour.slice(offset, offset + size);
        offset += size;
        days[day] = scheduleDay(optimizeOrder(segment).order.map((index) => segment[index]), previous);
        previous = days[day].at(-1);
    });
    return { days, dropped: stops.length - tour.length };
};
