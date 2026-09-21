import { geocode, reverseGeocode, reverseGeocodeProvince, extractGoogleMapsPreview } from '../services/mapService.js';
import { ok } from '../helpers/response.js';

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
