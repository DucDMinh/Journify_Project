import axios from 'axios';
import * as cheerio from 'cheerio';
import { env } from '../config/env.js';
import { HttpError } from '../helpers/httpError.js';

const GOOGLE_MAPS_HOSTS = new Set([
    'maps.app.goo.gl',
    'goo.gl',
    'maps.google.com',
    'www.google.com',
    'google.com',
    'www.google.com.vn',
    'google.com.vn',
]);

const MAX_PREVIEW_IMAGE_BYTES = 5 * 1024 * 1024;
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

export const extractGoogleMapsPreview = async (rawUrl) => {
    assertGoogleMapsUrl(rawUrl);

    const response = await axios.get(rawUrl, {
        headers: { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' },
        timeout: 10000,
        maxRedirects: 5,
    });
    const expandedUrl = response.request?.res?.responseUrl || rawUrl;
    assertGoogleMapsUrl(expandedUrl);

    const $ = cheerio.load(response.data);
    const imageUrl = $('meta[property="og:image"]').attr('content');
    const name = ($('meta[property="og:title"]').attr('content') || '')
        .replace(' - Google Maps', '')
        .replace('Google Maps', '')
        .trim();

    if (!imageUrl) return { expandedUrl, name, base64: null };

    const image = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        maxContentLength: MAX_PREVIEW_IMAGE_BYTES,
    });
    const mimeType = image.headers['content-type'] || 'image/jpeg';
    return {
        expandedUrl,
        name,
        base64: `data:${mimeType};base64,${Buffer.from(image.data).toString('base64')}`,
        fileName: 'google-map-preview.jpg',
        mimeType,
    };
};
