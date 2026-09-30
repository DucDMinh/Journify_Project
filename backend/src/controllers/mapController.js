import { geocode, reverseGeocode, reverseGeocodeProvince, extractGoogleMapsPreview } from '../services/mapService.js';
import { optimizeDay } from '../services/routeOptimizer.js';
import { ok } from '../helpers/response.js';

const MAX_ROUTE_POINTS = 50;

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
