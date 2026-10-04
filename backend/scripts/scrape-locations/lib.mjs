export const USER_AGENT = 'Journify-thesis-scraper/1.0 (student project; contact via GitHub DucDMinh/Journify_Project)';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const removeAccents = (str) =>
    String(str ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();

export const stripProvincePrefix = (name) => String(name ?? '').replace(/^(Tỉnh|Thành phố|TP\.?)\s+/i, '').trim();

export const provinceKey = (name) => removeAccents(stripProvincePrefix(name)).replace(/\s+/g, ' ');

export const nameKey = (name) => removeAccents(name).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

export { distanceMeters } from '../../src/helpers/geo.js';

export const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

export async function fetchWithRetry(url, options = {}, { retries = 3, backoffMs = 3000, label = url } = {}) {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        let retryAfterMs = 0;
        try {
            const res = await fetch(url, { ...options, headers: { 'User-Agent': USER_AGENT, ...(options.headers ?? {}) } });
            if (res.status === 429 || res.status >= 500) {
                retryAfterMs = (Number(res.headers.get('retry-after')) || 0) * 1000;
                throw new Error(`HTTP ${res.status}`);
            }
            if (!res.ok) throw new Error(`HTTP ${res.status} (không thử lại)`);
            return res;
        } catch (error) {
            lastError = error;
            if (String(error.message).includes('không thử lại') || attempt === retries) break;
            const wait = Math.max(backoffMs * attempt, retryAfterMs);
            console.warn(`  ! ${label}: ${error.message} -> thử lại sau ${wait / 1000}s (${attempt}/${retries})`);
            await sleep(wait);
        }
    }
    throw lastError;
}

export const csvEscape = (value) => {
    const s = value === null || value === undefined ? '' : String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
