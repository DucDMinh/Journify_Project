import { formatNumber } from "./chartTheme";

interface RankedItem {
    id: string;
    label: string;
    sublabel?: string | null;
    value: number;
}

interface RankedListProps {
    items: RankedItem[];
    unit: string;
    color: string;
    emptyText?: string;
}

export function RankedList({ items, unit, color, emptyText = "Chưa có dữ liệu" }: RankedListProps) {
    if (items.length === 0) return <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>;
    const max = Math.max(...items.map((i) => i.value), 1);
    return (
        <ol className="space-y-3">
            {items.map((item, index) => (
                <li key={item.id}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                            <span className="w-4 shrink-0 text-xs font-semibold text-gray-400">{index + 1}</span>
                            <span className="truncate font-medium text-gray-800 dark:text-gray-100" title={item.label}>
                                {item.label}
                            </span>
                            {item.sublabel && <span className="hidden shrink-0 text-xs text-gray-400 sm:inline">· {item.sublabel}</span>}
                        </span>
                        <span className="shrink-0 tabular-nums text-gray-600 dark:text-gray-300">
                            {formatNumber(item.value)} {unit}
                        </span>
                    </div>
                    <div className="ml-6 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.max(4, (item.value / max) * 100)}%`, background: color }} />
                    </div>
                </li>
            ))}
        </ol>
    );
}
