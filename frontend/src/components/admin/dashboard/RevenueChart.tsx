"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MonthlyStat } from "@/interface";
import { ChartTooltip } from "./ChartTooltip";
import { ChartTheme, formatCompactVnd, formatMonthLabel, formatMonthLong, formatVnd } from "./chartTheme";

interface RevenueChartProps {
    data: MonthlyStat[];
    theme: ChartTheme;
}

export function RevenueChart({ data, theme }: RevenueChartProps) {
    return (
        <div className="h-64 w-full" role="img" aria-label="Biểu đồ cột doanh thu theo tháng">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="35%">
                    <CartesianGrid vertical={false} stroke={theme.grid} strokeWidth={1} />
                    <XAxis
                        dataKey="month"
                        tickFormatter={formatMonthLabel}
                        tick={{ fill: theme.muted, fontSize: 12 }}
                        axisLine={{ stroke: theme.axis }}
                        tickLine={false}
                        minTickGap={16}
                    />
                    <YAxis
                        tickFormatter={formatCompactVnd}
                        tick={{ fill: theme.muted, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={64}
                    />
                    <Tooltip
                        cursor={{ fill: theme.grid, opacity: 0.4 }}
                        content={<ChartTooltip theme={theme} formatLabel={formatMonthLong} formatValue={(v) => formatVnd(v)} />}
                    />
                    <Bar dataKey="revenue" name="Doanh thu" fill={theme.series[0]} radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
