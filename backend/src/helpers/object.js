export const pick = (source, keys) =>
    Object.fromEntries(keys.filter((k) => source?.[k] !== undefined).map((k) => [k, source[k]]));

export const toNumber = (value) => (value === undefined || value === null || value === '' ? undefined : Number(value));

export const toBoolean = (value) => value === true || value === 'true';

export const parseJsonField = (value) => (typeof value === 'string' ? JSON.parse(value) : value);
