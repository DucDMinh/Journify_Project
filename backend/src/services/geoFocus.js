import { distanceMeters } from '../helpers/geo.js';
import { normalizeText } from '../helpers/text.js';

export const FOCUS_RADII_METERS = [35_000, 70_000];
export const MIN_FOCUSED_STOPS = 3;
const MIN_KEYWORD_LENGTH = 3;

export const hasCoords = (point) =>
    Number.isFinite(point?.lat) && Number.isFinite(point?.lng) && !(point.lat === 0 && point.lng === 0);

export const focusKeys = (keywords) =>
    [...new Set((keywords ?? []).map(normalizeText).filter((key) => key.length >= MIN_KEYWORD_LENGTH))];

export const keywordAnchors = (locations, keywords) => {
    const keys = focusKeys(keywords);
    if (keys.length === 0) return [];
    return locations
        .filter((loc) => hasCoords(loc) && keys.some((key) => normalizeText(loc.name).includes(key)))
        .map(({ lat, lng }) => ({ lat, lng }));
};

export const focusAround = (locations, anchors, wanted) => {
    const points = (anchors ?? []).filter(hasCoords);
    if (points.length === 0) return locations;
    let widest = [];
    for (const radius of FOCUS_RADII_METERS) {
        widest = locations.filter((loc) => hasCoords(loc) && points.some((anchor) => distanceMeters(anchor, loc) <= radius));
        if (widest.length >= wanted) return widest;
    }
    return widest.length >= Math.min(MIN_FOCUSED_STOPS, wanted) ? widest : locations;
};
