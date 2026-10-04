import { geocode, reverseGeocode, reverseGeocodeProvince, extractGoogleMapsPreview, getRoadRoute } from '../services/mapService.js';
import { optimizeDay } from '../services/routeOptimizer.js';
import { ok } from '../helpers/response.js';

const MAX_ROUTE_POINTS = 50;
const MAX_ROAD_ROUTE_POINTS = 120;

const parseCoords = (ctx) => ({ lat: parseFloat(ctx.query.lat), lng: parseFloat(ctx.query.lng) });

export const searchPlace = async (ctx) => {
    ok(ctx, await geocode(ctx.query.q));
};

export const reversePlace = async (ctx) => {
    ok(ctx, await reverseGeocode(parseCoords(ctx)));
};

export const provinceFromCoords = async (ctx) => {
    ok(ctx, { provinceName: await reverseGeocodeProvince(parseCoords(ctx)) });
};

export const extractMap = async (ctx) => {
    const { url } = ctx.query;
    ctx.assert(typeof url === 'string' && url, 400, 'Thiếu URL');
    ok(ctx, await extractGoogleMapsPreview(url));
};

export const roadRoute = async (ctx) => {
    const { points } = ctx.request.body ?? {};
    ctx.assert(
        Array.isArray(points) && points.length >= 2 && points.length <= MAX_ROAD_ROUTE_POINTS,
        400,
        `Cần từ 2 đến ${MAX_ROAD_ROUTE_POINTS} điểm để vẽ đường đi`,
    );
    const parsed = points.map((point) => ({ lat: Number(point?.lat), lng: Number(point?.lng) }));
    ctx.assert(
        parsed.every(({ lat, lng }) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180),
        400,
        'Tọa độ không hợp lệ',
    );
    ok(ctx, await getRoadRoute(parsed));
};

export const optimizeRoute = async (ctx) => {
    const { locations } = ctx.request.body ?? {};
    ctx.assert(
        Array.isArray(locations) && locations.length <= MAX_ROUTE_POINTS && locations.every((loc) => loc && typeof loc === 'object'),
        400,
        `Danh sách địa điểm không hợp lệ (tối đa ${MAX_ROUTE_POINTS} điểm)`,
    );
    const activities = locations.map(({ id, lat, lng, start_time, end_time }) => ({ id, lat, lng, start_time, end_time }));
    const result = optimizeDay(activities);
    ok(ctx, {
        locations: result.activities.map(({ id, sequence_order, start_time, end_time }) => ({ id, sequence_order, start_time, end_time })),
        distanceMeters: Math.round(result.distanceMeters),
        originalDistanceMeters: Math.round(result.originalDistanceMeters),
        changed: result.changed,
        exceedsDay: result.exceedsDay,
    });
};
