export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_NAME_LENGTH = 100;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_PATTERN = /^0\d{9,10}$/;

export const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();

export const isValidEmail = (value) => EMAIL_PATTERN.test(String(value ?? ''));

export const isUuid = (value) => UUID_PATTERN.test(String(value ?? ''));

export const normalizePhone = (value) => {
    if (value === undefined) return undefined;
    const digits = String(value ?? '').replace(/[\s.\-()]/g, '');
    if (!digits) return null;
    const local = digits.startsWith('+84') ? `0${digits.slice(3)}` : digits.startsWith('84') && digits.length >= 11 ? `0${digits.slice(2)}` : digits;
    return /^\d{9}$/.test(local) && !local.startsWith('0') ? `0${local}` : local;
};

export const isValidPhone = (value) => value === null || PHONE_PATTERN.test(String(value));

export const toCoordinate = (value, limit) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) && Math.abs(number) <= limit ? number : Number.NaN;
};
