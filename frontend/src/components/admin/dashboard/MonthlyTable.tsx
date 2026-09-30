import { MonthlyStat } from "@/interface";
import { formatMonthLong, formatNumber, formatVnd } from "./chartTheme";

export function MonthlyTable({ data }: { data: MonthlyStat[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                        <th className="py-2 pr-4 font-semibold">Tháng</th>
                        <th className="py-2 pr-4 text-right font-semibold">Doanh thu</th>
                        <th className="py-2 pr-4 text-right font-semibold">Đơn đã thanh toán</th>
                        <th className="py-2 pr-4 text-right font-semibold">Người dùng mới</th>
                        <th className="py-2 text-right font-semibold">Lộ trình mới</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.map((row) => (
                        <tr key={row.month} className="text-gray-700 dark:text-gray-300">
                            <td className="py-2 pr-4 font-medium">{formatMonthLong(row.month)}</td>
                            <td className="py-2 pr-4 text-right tabular-nums">{formatVnd(row.revenue)}</td>
                            <td className="py-2 pr-4 text-right tabular-nums">{formatNumber(row.paidOrders)}</td>
                            <td className="py-2 pr-4 text-right tabular-nums">{formatNumber(row.newUsers)}</td>
                            <td className="py-2 text-right tabular-nums">{formatNumber(row.newItineraries)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
