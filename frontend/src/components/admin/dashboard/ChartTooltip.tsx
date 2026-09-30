import type { ChartTheme } from "./chartTheme";

interface TooltipRow {
    name?: string;
    value?: number | string;
    color?: string;
}

interface ChartTooltipProps {
    active?: boolean;
    label?: string | number;
    payload?: TooltipRow[];
    theme: ChartTheme;
    formatLabel: (label: string) => string;
    formatValue: (value: number, name?: string) => string;
}

export function ChartTooltip({ active, label, payload, theme, formatLabel, formatValue }: ChartTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div
            className="rounded-lg px-3 py-2 text-xs shadow-lg"
            style={{ background: theme.surface, border: `1px solid ${theme.tooltipBorder}`, color: theme.text }}
        >
            <p className="mb-1 font-semibold">{formatLabel(String(label))}</p>
            {payload.map((row) => (
                <p key={row.name} className="flex items-center gap-2" style={{ color: theme.text }}>
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: row.color }} />
                    <span style={{ color: theme.muted }}>{row.name}</span>
                    <span className="ml-auto font-medium tabular-nums">{formatValue(Number(row.value ?? 0), row.name)}</span>
                </p>
            ))}
        </div>
    );
}
