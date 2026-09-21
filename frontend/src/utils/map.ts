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
