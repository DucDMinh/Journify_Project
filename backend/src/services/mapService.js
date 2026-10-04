import axios from 'axios';
import * as cheerio from 'cheerio';
import { env } from '../config/env.js';
import { HttpError } from '../helpers/httpError.js';
import { chunkPath, distanceMeters } from '../helpers/geo.js';

const GOOGLE_MAPS_HOSTS = new Set([
    'maps.app.goo.gl',
    'goo.gl',
    'maps.google.com',
    'www.google.com',
    'google.com',
    'www.google.com.vn',
    'google.com.vn',
    'maps.google.com.vn',
]);

const MAX_PREVIEW_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PREVIEW_PAGE_BYTES = 3 * 1024 * 1024;
const GEOCODE_TIMEOUT_MS = 8000;
// Khung tọa độ Việt Nam để ưu tiên kết quả trong nước
const VIETNAM_BBOX = '102.1,8.2,109.6,23.5';

const PHOTON_URL = 'https://photon.komoot.io';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

const http = axios.create({
    timeout: GEOCODE_TIMEOUT_MS,
    headers: { 'User-Agent': env.nominatimUserAgent, 'Accept-Language': 'vi' },
});

const isValidCoord = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

const joinParts = (...parts) => [...new Set(parts.filter(Boolean))].join(', ');

const fromPhotonFeature = (feature) => {
    if (!feature?.geometry?.coordinates) return null;
    const [lng, lat] = feature.geometry.coordinates;
    const p = feature.properties ?? {};
    const province = p.state || p.city || p.county || '';
    return {
        lat,
        lng,
        name: p.name || joinParts(p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street, p.district),
        display_name: joinParts(p.name, p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street, p.district, p.city, p.state, p.country),
        province,
    };
};

const fromNominatimResult = (r) => {
    if (!r) return null;
    const address = r.address ?? {};
    return {
        lat: Number(r.lat),
        lng: Number(r.lon),
        name: r.name || r.display_name?.split(',')[0] || '',
        display_name: r.display_name || '',
        province: address.province || address.state || address.city || '',
    };
};

// Photon là nguồn chính (không bị chặn DNS ở một số ISP Việt Nam); Nominatim chỉ dùng khi Photon thất bại.
const withFallback = async (primary, fallback) => {
    try {
        const result = await primary();
        if (result) return result;
    } catch (error) {
        console.warn('[mapService] Photon lỗi, thử Nominatim:', error.message);
    }
    try {
        return await fallback();
    } catch (error) {
        console.warn('[mapService] Nominatim lỗi:', error.message);
        return null;
    }
};

export const geocode = async (query) => {
    const q = String(query ?? '').trim();
    if (!q) throw new HttpError(400, 'Thiếu từ khóa tìm kiếm');

    return withFallback(
        async () => {
            const { data } = await http.get(`${PHOTON_URL}/api/`, { params: { q, limit: 1, bbox: VIETNAM_BBOX, lang: 'default' } });
            return fromPhotonFeature(data.features?.[0]);
        },
        async () => {
            const { data } = await http.get(`${NOMINATIM_URL}/search`, {
                params: { q, format: 'jsonv2', limit: 1, countrycodes: 'vn', addressdetails: 1 },
            });
            return fromNominatimResult(data?.[0]);
        },
    );
};

export const reverseGeocode = async ({ lat, lng }) => {
    if (!isValidCoord(lat, lng)) throw new HttpError(400, 'Tọa độ không hợp lệ');

    return withFallback(
        async () => {
            const { data } = await http.get(`${PHOTON_URL}/reverse`, { params: { lat, lon: lng, lang: 'default' } });
            return fromPhotonFeature(data.features?.[0]);
        },
        async () => {
            const { data } = await http.get(`${NOMINATIM_URL}/reverse`, {
                params: { lat, lon: lng, format: 'jsonv2', addressdetails: 1, 'accept-language': 'vi' },
            });
            return fromNominatimResult(data);
        },
    );
};

export const reverseGeocodeProvince = async (coords) => (await reverseGeocode(coords))?.province ?? '';

const assertGoogleMapsUrl = (rawUrl) => {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw new HttpError(400, 'URL không hợp lệ');
    }
    if (parsed.protocol !== 'https:' || !GOOGLE_MAPS_HOSTS.has(parsed.hostname)) {
        throw new HttpError(400, 'Chỉ hỗ trợ link Google Maps');
    }
    return parsed;
};

const GOOGLE_IMAGE_HOST_SUFFIXES = ['.googleusercontent.com', '.googleapis.com', '.gstatic.com', '.ggpht.com', '.google.com'];

const isGoogleImageUrl = (rawUrl) => {
    try {
        const { protocol, hostname } = new URL(rawUrl);
        return protocol === 'https:' && GOOGLE_IMAGE_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
    } catch {
        return false;
    }
};

const rejectForeignRedirect = (options) => {
    if (options.protocol !== 'https:' || !GOOGLE_MAPS_HOSTS.has(options.hostname)) {
        throw new HttpError(400, 'Link chuyển hướng ra ngoài Google Maps');
    }
};

export const extractGoogleMapsPreview = async (rawUrl) => {
    assertGoogleMapsUrl(rawUrl);

    let response;
    try {
        response = await axios.get(rawUrl, {
            headers: { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' },
            timeout: 10000,
            maxRedirects: 5,
            maxContentLength: MAX_PREVIEW_PAGE_BYTES,
            beforeRedirect: rejectForeignRedirect,
        });
    } catch (error) {
        const reason = [error, error?.cause].find((candidate) => candidate instanceof HttpError);
        if (reason) throw reason;
        throw new HttpError(502, 'Không truy cập được link Google Maps, vui lòng thử lại');
    }
    const expandedUrl = response.request?.res?.responseUrl || rawUrl;
    assertGoogleMapsUrl(expandedUrl);

    const $ = cheerio.load(response.data);
    const imageUrl = $('meta[property="og:image"]').attr('content');
    const name = ($('meta[property="og:title"]').attr('content') || '')
        .replace(' - Google Maps', '')
        .replace('Google Maps', '')
        .trim();

    if (!imageUrl || !isGoogleImageUrl(imageUrl)) return { expandedUrl, name, base64: null };

    const image = await axios
        .get(imageUrl, { responseType: 'arraybuffer', timeout: 10000, maxRedirects: 0, maxContentLength: MAX_PREVIEW_IMAGE_BYTES })
        .catch(() => null);
    if (!image) return { expandedUrl, name, base64: null };
    const mimeType = image.headers['content-type'] || 'image/jpeg';
    if (!mimeType.startsWith('image/')) return { expandedUrl, name, base64: null };
    return {
        expandedUrl,
        name,
        base64: `data:${mimeType};base64,${Buffer.from(image.data).toString('base64')}`,
        fileName: 'google-map-preview.jpg',
        mimeType,
    };
};

const ROUTE_TIMEOUT_MS = 30000;
const ROUTE_MAX_LOCATIONS = 10;
const ROUTE_MAX_SPAN_METERS = 1_400_000;
const ROUTE_REQUEST_GAP_MS = 300;
const ROUTE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const ROUTE_CACHE_LIMIT = 200;
const BORDER_CROSSING_PENALTY_SECONDS = 1_000_000;
const VALHALLA_MAX_DISTANCE_ERROR = 154;
const VIA_CITIES = [
    { name: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
    { name: 'Thanh Hóa', lat: 19.8067, lng: 105.7852 },
    { name: 'Vinh', lat: 18.6796, lng: 105.6813 },
    { name: 'Đồng Hới', lat: 17.4831, lng: 106.6 },
    { name: 'Huế', lat: 16.4637, lng: 107.5909 },
    { name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022 },
    { name: 'Quảng Ngãi', lat: 15.1214, lng: 108.8044 },
    { name: 'Quy Nhơn', lat: 13.7829, lng: 109.2196 },
    { name: 'Nha Trang', lat: 12.2388, lng: 109.1967 },
    { name: 'Phan Thiết', lat: 10.9333, lng: 108.1 },
    { name: 'TP. Hồ Chí Minh', lat: 10.7769, lng: 106.7009 },
    { name: 'Cần Thơ', lat: 10.0452, lng: 105.7469 },
];

const routeHttp = axios.create({
    timeout: ROUTE_TIMEOUT_MS,
    headers: { 'User-Agent': env.nominatimUserAgent, 'Content-Type': 'application/json' },
});
const routeCache = new Map();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const straightLeg = () => ({ shapes: [], distanceKm: null, durationMinutes: null });

const requestRoadLegs = async (points) => {
    const { data } = await routeHttp.post(env.valhallaUrl, {
        locations: points.map(({ lat, lng }) => ({ lat, lon: lng, type: 'break' })),
        costing: 'auto',
        costing_options: {
            auto: { country_crossing_penalty: BORDER_CROSSING_PENALTY_SECONDS, country_crossing_cost: BORDER_CROSSING_PENALTY_SECONDS },
        },
        directions_type: 'none',
    });
    return data.trip.legs.map((leg) => ({
        shapes: [leg.shape],
        distanceKm: leg.summary.length,
        durationMinutes: Math.round(leg.summary.time / 60),
    }));
};

const pickViaCity = (from, to) =>
    VIA_CITIES.filter((city) => distanceMeters(from, city) < ROUTE_MAX_SPAN_METERS && distanceMeters(city, to) < ROUTE_MAX_SPAN_METERS)
        .map((city) => ({ city, detour: distanceMeters(from, city) + distanceMeters(city, to) }))
        .sort((a, b) => a.detour - b.detour)[0]?.city ?? null;

const routeLongLeg = async (from, to) => {
    const via = pickViaCity(from, to);
    if (!via) return straightLeg();
    const [first] = await routeChunk([from, via]);
    await sleep(ROUTE_REQUEST_GAP_MS);
    const [second] = await routeChunk([via, to]);
    if (!first.shapes.length || !second.shapes.length) return straightLeg();
    return {
        shapes: [...first.shapes, ...second.shapes],
        distanceKm: first.distanceKm + second.distanceKm,
        durationMinutes: first.durationMinutes + second.durationMinutes,
    };
};

async function routeChunk(chunk) {
    try {
        return await requestRoadLegs(chunk);
    } catch (error) {
        if (error.response?.status !== 400) throw error;
        if (chunk.length === 2) {
            return [error.response.data?.error_code === VALHALLA_MAX_DISTANCE_ERROR ? await routeLongLeg(chunk[0], chunk[1]) : straightLeg()];
        }
    }
    const legs = [];
    for (let i = 0; i < chunk.length - 1; i += 1) {
        await sleep(ROUTE_REQUEST_GAP_MS);
        legs.push(...(await routeChunk([chunk[i], chunk[i + 1]])));
    }
    return legs;
}

const buildRoadRoute = async (points) => {
    const legs = [];
    try {
        for (const [index, chunk] of chunkPath(points, ROUTE_MAX_LOCATIONS, ROUTE_MAX_SPAN_METERS).entries()) {
            if (index > 0) await sleep(ROUTE_REQUEST_GAP_MS);
            legs.push(...(await routeChunk(chunk)));
        }
    } catch (error) {
        console.warn('[mapService] Không tìm được đường đi:', error.message);
        return { legs: points.slice(1).map(straightLeg), distanceKm: null, durationMinutes: null, degraded: true };
    }
    const routed = legs.filter((leg) => leg.shapes.length);
    return {
        legs,
        distanceKm: Math.round(routed.reduce((sum, leg) => sum + leg.distanceKm, 0)),
        durationMinutes: routed.reduce((sum, leg) => sum + leg.durationMinutes, 0),
        degraded: false,
    };
};

export const getRoadRoute = async (points) => {
    const key = points.map(({ lat, lng }) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join(';');
    const cached = routeCache.get(key);
    if (cached && cached.expires > Date.now()) return cached.route;
    const route = buildRoadRoute(points);
    routeCache.set(key, { route, expires: Date.now() + ROUTE_CACHE_TTL_MS });
    if (routeCache.size > ROUTE_CACHE_LIMIT) routeCache.delete(routeCache.keys().next().value);
    const result = await route;
    if (result.degraded) routeCache.delete(key);
    return result;
};
