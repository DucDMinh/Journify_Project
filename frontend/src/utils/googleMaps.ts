import { removeAccents, stripProvincePrefix } from "./text";

const EXACT_PIN_PATTERN = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
const VIEWPORT_PATTERN = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
const PLACE_PATTERN = /\/place\/([^/]+)/;

export interface LatLng {
    lat: string;
    lng: string;
}

export const cleanMapLink = (raw: string) => {
    const trimmed = raw.trim();
    const httpsIndex = trimmed.indexOf("https://");
    if (httpsIndex > 0) return trimmed.slice(httpsIndex);
    const httpIndex = trimmed.indexOf("http://");
    if (httpIndex > 0) return trimmed.slice(httpIndex);
    return trimmed;
};

export const extractCoordsFromMapsUrl = (url: string): LatLng | null => {
    const match = url.match(EXACT_PIN_PATTERN) ?? url.match(VIEWPORT_PATTERN);
    return match ? { lat: match[1], lng: match[2] } : null;
};

export const extractPlaceNameFromMapsUrl = (url: string) => {
    const match = url.match(PLACE_PATTERN);
    return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "";
};

export const matchProvince = <T extends { id: string; name: string }>(candidate: string, provinces: T[]): T | undefined => {
    const normalized = removeAccents(candidate.trim());
    if (!normalized) return undefined;
    return provinces.find((p) => {
        const dbName = removeAccents(stripProvincePrefix(p.name));
        return normalized.includes(dbName) || dbName.includes(normalized);
    });
};

export const matchProvinceFromPlaceName = <T extends { id: string; name: string }>(placeName: string, provinces: T[]) => {
    const lastPart = placeName.split(",").at(-1) ?? "";
    return matchProvince(lastPart, provinces);
};

export const base64ToFile = (base64String: string, fileName: string, mimeType: string): File => {
    const binary = atob(base64String.split(",")[1] ?? "");
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new File([bytes], fileName, { type: mimeType });
};
