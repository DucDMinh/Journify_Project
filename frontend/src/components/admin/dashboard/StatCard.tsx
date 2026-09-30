import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string;
    hint?: string;
    change?: number | null;
    changeLabel?: string;
    icon: LucideIcon;
}

export function StatCard({ label, value, hint, change, changeLabel = "so với tháng trước", icon: Icon }: StatCardProps) {
    const hasChange = change !== undefined;
    const trend = change === null || change === undefined ? "none" : change > 0 ? "up" : change < 0 ? "down" : "flat";
    const trendClass =
        trend === "up"
            ? "text-green-700 dark:text-green-400"
            : trend === "down"
              ? "text-red-600 dark:text-red-400"
              : "text-gray-500 dark:text-gray-400";
    const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    <Icon className="h-5 w-5" />
                </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</p>
            {hasChange ? (
                <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${trendClass}`}>
                    <TrendIcon className="h-3.5 w-3.5" />
                    {change === null ? "Chưa có dữ liệu kỳ trước" : `${change > 0 ? "+" : ""}${change}% ${changeLabel}`}
                </p>
            ) : hint ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
            ) : null}
        </div>
    );
}
