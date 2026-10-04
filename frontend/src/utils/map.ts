// tile.openstreetmap.org bị chặn DNS ở một số ISP Việt Nam nên dùng mirror openstreetmap.de (cùng style, không cần API key).
// Đổi qua NEXT_PUBLIC_MAP_TILE_URL nếu cần, ví dụ: https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png
export const MAP_TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://tile.openstreetmap.de/{z}/{x}/{y}.png";

export const MAP_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const MAP_TILE_SUBDOMAINS = "abc";

export const VIETNAM_CENTER: [number, number] = [16.047079, 108.20623];

export interface GeocodeResult {
    lat: number;
    lng: number;
    name: string;
    display_name: string;
    province: string;
}

export interface RoadRouteLeg {
    shapes: string[];
    distanceKm: number | null;
    durationMinutes: number | null;
}

export interface RoadRoute {
    legs: RoadRouteLeg[];
    distanceKm: number | null;
    durationMinutes: number | null;
    degraded: boolean;
}

export const decodePolyline = (encoded: string, precision = 6): [number, number][] => {
    const factor = 10 ** precision;
    const coordinates: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;
    while (index < encoded.length) {
        const deltas = [0, 0];
        for (let axis = 0; axis < 2; axis += 1) {
            let result = 0;
            let shift = 0;
            let byte: number;
            do {
                byte = encoded.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);
            deltas[axis] = result & 1 ? ~(result >> 1) : result >> 1;
        }
        lat += deltas[0];
        lng += deltas[1];
        coordinates.push([lat / factor, lng / factor]);
    }
    return coordinates;
};
