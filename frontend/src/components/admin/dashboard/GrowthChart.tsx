"use client";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MonthlyStat } from "@/interface";
import { ChartTooltip } from "./ChartTooltip";
import { ChartTheme, formatMonthLabel, formatMonthLong, formatNumber } from "./chartTheme";

interface GrowthChartProps {
    data: MonthlyStat[];
    theme: ChartTheme;
}

export function GrowthChart({ data, theme }: GrowthChartProps) {
    return (
        <div className="h-64 w-full" role="img" aria-label="Biểu đồ đường người dùng mới và lộ trình mới theo tháng">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={theme.grid} strokeWidth={1} />
                    <XAxis
                        dataKey="month"
                        tickFormatter={formatMonthLabel}
                        tick={{ fill: theme.muted, fontSize: 12 }}
                        axisLine={{ stroke: theme.axis }}
                        tickLine={false}
                        minTickGap={16}
                    />
                    <YAxis allowDecimals={false} tick={{ fill: theme.muted, fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip
                        cursor={{ stroke: theme.axis, strokeWidth: 1 }}
                        content={<ChartTooltip theme={theme} formatLabel={formatMonthLong} formatValue={(v) => formatNumber(v)} />}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: theme.muted, paddingTop: 8 }} />
                    <Line
                        type="monotone"
                        dataKey="newUsers"
                        name="Người dùng mới"
                        stroke={theme.series[0]}
                        strokeWidth={2}
                        dot={{ r: 4, fill: theme.series[0], stroke: theme.surface, strokeWidth: 2 }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="newItineraries"
                        name="Lộ trình mới"
                        stroke={theme.series[1]}
                        strokeWidth={2}
                        dot={{ r: 4, fill: theme.series[1], stroke: theme.surface, strokeWidth: 2 }}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
