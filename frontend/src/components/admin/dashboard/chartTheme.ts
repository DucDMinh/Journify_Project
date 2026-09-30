// Bảng màu biểu đồ đã được kiểm tra an toàn cho người mù màu (skill dataviz, palette tham chiếu).
// Slot 1 = xanh dương, slot 2 = cam; màu tối là bước riêng cho nền tối, không phải đảo ngược.
export interface ChartTheme {
    series: readonly string[];
    grid: string;
    axis: string;
    muted: string;
    text: string;
    surface: string;
    tooltipBorder: string;
}

export const CHART_THEME: Record<"light" | "dark", ChartTheme> = {
    light: {
        series: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"],
        grid: "#e1e0d9",
        axis: "#c3c2b7",
        muted: "#898781",
        text: "#0b0b0b",
        surface: "#ffffff",
        tooltipBorder: "rgba(11,11,11,0.10)",
    },
    dark: {
        series: ["#3987e5", "#d95926", "#199e70", "#c98500"],
        grid: "#2c2c2a",
        axis: "#383835",
        muted: "#898781",
        text: "#ffffff",
        surface: "#1a1a19",
        tooltipBorder: "rgba(255,255,255,0.10)",
    },
};

export const STATUS_COLORS = {
    PAID: "#0ca30c",
    PENDING: "#fab219",
    CANCEL: "#d03b3b",
} as const;

const vnd = new Intl.NumberFormat("vi-VN");
const compact = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 });

export const formatVnd = (value: number) => `${vnd.format(value)} ₫`;
export const formatCompactVnd = (value: number) => (value === 0 ? "0" : `${compact.format(value)} ₫`);
export const formatNumber = (value: number) => vnd.format(value);

export const formatMonthLabel = (month: string) => {
    const [year, m] = month.split("-");
    return `T${Number(m)}/${year.slice(2)}`;
};

export const formatMonthLong = (month: string) => {
    const [year, m] = month.split("-");
    return `Tháng ${Number(m)}/${year}`;
};

export const percentChange = (current: number, previous: number): number | null => {
    if (previous === 0) return current === 0 ? 0 : null;
    return Math.round(((current - previous) / previous) * 100);
};
