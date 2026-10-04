import { removeAccents } from "@/utils/text";

const vndFormatter = new Intl.NumberFormat("vi-VN");
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatVnd = (value?: number | string | null) => `${vndFormatter.format(Math.round(Number(value) || 0))} đ`;

export const formatCost = (value?: number | string | null, fallback = "Chưa ước tính") =>
    Number(value) > 0 ? formatVnd(value) : fallback;

export const formatDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
};

export const formatTime = (value?: string | null) => (value ? value.slice(0, 5) : "");

export const formatTimeRange = (start?: string | null, end?: string | null) => {
    const from = formatTime(start);
    const to = formatTime(end);
    if (from && to) return `${from} - ${to}`;
    return from || to || "Chưa đặt giờ";
};

export const formatPhone = (value?: string | number | null) => {
    const text = String(value ?? "").trim();
    return /^\d{9}$/.test(text) && !text.startsWith("0") ? `0${text}` : text;
};

export const formatDistanceKm = (km?: number | null) => (km == null ? "" : `${vndFormatter.format(Math.round(km))} km`);

export const formatDuration = (minutes?: number | null) => {
    if (minutes == null) return "";
    const total = Math.max(0, Math.round(minutes));
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    if (!hours) return `${rest} phút`;
    return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
};

export const PHONE_PATTERN = /^(0|\+84)\d{9,10}$/;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const todayIso = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const countTripDays = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    const diff = Date.parse(end) - Date.parse(start);
    if (Number.isNaN(diff) || diff < 0) return null;
    return Math.round(diff / 86_400_000) + 1;
};

export const shortPlaceName = (name?: string | null) => String(name ?? "").split(" · ")[0].trim();

export const matchesSearch = (query: string, ...fields: (string | null | undefined)[]) => {
    const needle = removeAccents(query.trim());
    return !needle || removeAccents(fields.filter(Boolean).join(" ")).includes(needle);
};

export const errorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback;
