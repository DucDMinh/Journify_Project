"use client";
import { useState } from "react";
import { BarChart3, BookOpen, Crown, MapPin, Map as MapIcon, RefreshCw, Route, ShoppingBag, Table2, Users, Wallet } from "lucide-react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useTheme } from "@/context/ThemeContext";
import { RANGE_OPTIONS, useDashboardStats } from "@/hooks/admin/useDashboardStats";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { ChartCard } from "@/components/admin/dashboard/ChartCard";
import { RevenueChart } from "@/components/admin/dashboard/RevenueChart";
import { GrowthChart } from "@/components/admin/dashboard/GrowthChart";
import { RankedList } from "@/components/admin/dashboard/RankedList";
import { MonthlyTable } from "@/components/admin/dashboard/MonthlyTable";
import { RecentOrders } from "@/components/admin/dashboard/RecentOrders";
import { CHART_THEME, formatNumber, formatVnd, percentChange, STATUS_COLORS } from "@/components/admin/dashboard/chartTheme";

const STATUS_LABELS: Record<string, string> = { PAID: "Đã thanh toán", PENDING: "Chờ thanh toán", CANCEL: "Đã hủy" };

export default function Dashboard() {
    const { theme } = useTheme();
    const chartTheme = CHART_THEME[theme];
    const { stats, isLoading, error, months, changeRange, refresh } = useDashboardStats(6);
    const [showTable, setShowTable] = useState(false);

    return (
        <div>
            <PageBreadcrumb pageTitle="Tổng quan" />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {stats ? `Số liệu từ ${stats.range.from} đến ${stats.range.to}` : "Đang tải số liệu..."}
                </p>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-white/[0.03]">
                        {RANGE_OPTIONS.map((opt) => (
                            <button
                                key={opt.months}
                                onClick={() => changeRange(opt.months)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    months === opt.months
                                        ? "bg-brand-500 text-white"
                                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => refresh()}
                        disabled={isLoading}
                        className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-gray-800"
                        title="Làm mới"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                    {error}
                </div>
            )}

            {!stats ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
                    ))}
                </div>
            ) : (
                <div className={`space-y-6 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Doanh thu tháng này"
                            value={formatVnd(stats.thisMonth.revenue)}
                            change={percentChange(stats.thisMonth.revenue, stats.previousMonth.revenue)}
                            icon={Wallet}
                        />
                        <StatCard
                            label="Người dùng mới tháng này"
                            value={formatNumber(stats.thisMonth.newUsers)}
                            change={percentChange(stats.thisMonth.newUsers, stats.previousMonth.newUsers)}
                            icon={Users}
                        />
                        <StatCard
                            label="Lộ trình mới tháng này"
                            value={formatNumber(stats.thisMonth.newItineraries)}
                            change={percentChange(stats.thisMonth.newItineraries, stats.previousMonth.newItineraries)}
                            icon={Route}
                        />
                        <StatCard
                            label="Hội viên Premium"
                            value={formatNumber(stats.totals.premiumUsers)}
                            hint={`${Math.round((stats.totals.premiumUsers / Math.max(stats.totals.users, 1)) * 100)}% trên ${formatNumber(stats.totals.users)} người dùng`}
                            icon={Crown}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                        <StatCard label="Tổng doanh thu" value={formatVnd(stats.totals.revenue)} hint={`${stats.totals.paidOrders}/${stats.totals.orders} đơn đã thanh toán`} icon={ShoppingBag} />
                        <StatCard label="Lộ trình" value={formatNumber(stats.totals.itineraries)} hint={`${stats.totals.publicItineraries} công khai`} icon={MapIcon} />
                        <StatCard label="Địa điểm" value={formatNumber(stats.totals.locations)} hint={`${stats.totals.provinces} tỉnh thành`} icon={MapPin} />
                        <StatCard label="Bài viết cộng đồng" value={formatNumber(stats.totals.blogs)} hint={`${stats.totals.activeUsers} người dùng đang hoạt động`} icon={BookOpen} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <ChartCard title="Doanh thu theo tháng" subtitle="Tổng tiền các đơn Premium đã thanh toán">
                            <RevenueChart data={stats.monthly} theme={chartTheme} />
                        </ChartCard>
                        <ChartCard title="Tăng trưởng" subtitle="Người dùng và lộ trình mới theo tháng">
                            <GrowthChart data={stats.monthly} theme={chartTheme} />
                        </ChartCard>
                    </div>

                    <ChartCard
                        title="Số liệu theo tháng"
                        subtitle="Bảng dữ liệu của hai biểu đồ phía trên"
                        action={
                            <button
                                onClick={() => setShowTable((v) => !v)}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                {showTable ? <BarChart3 className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
                                {showTable ? "Ẩn bảng" : "Xem bảng"}
                            </button>
                        }
                    >
                        {showTable ? <MonthlyTable data={stats.monthly} /> : <p className="text-sm text-gray-500 dark:text-gray-400">Bấm &quot;Xem bảng&quot; để xem số liệu chi tiết từng tháng.</p>}
                    </ChartCard>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <ChartCard title="Tỉnh thành được chọn nhiều nhất" subtitle="Số lộ trình đi qua tỉnh">
                            <RankedList
                                items={stats.topProvinces.map((p) => ({ id: p.id, label: p.name, value: p.itineraries }))}
                                unit="lộ trình"
                                color={chartTheme.series[0]}
                            />
                        </ChartCard>
                        <ChartCard title="Địa điểm được lưu nhiều nhất" subtitle="Theo số lượt lưu của người dùng">
                            <RankedList
                                items={stats.topLocations.map((l) => ({ id: l.id, label: l.name.split(" · ")[0], sublabel: l.province, value: l.saved_count }))}
                                unit="lượt"
                                color={chartTheme.series[1]}
                            />
                        </ChartCard>
                        <ChartCard title="Chủ đề lộ trình" subtitle="Phân bố theo chủ đề">
                            <RankedList
                                items={stats.themes.slice(0, 6).map((t) => ({ id: t.theme, label: t.theme, value: t.count }))}
                                unit="lộ trình"
                                color={chartTheme.series[2]}
                            />
                        </ChartCard>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <ChartCard title="Đơn hàng theo trạng thái">
                            <ul className="space-y-3">
                                {stats.ordersByStatus.map((s) => {
                                    const color = STATUS_COLORS[s.status as keyof typeof STATUS_COLORS] ?? "#898781";
                                    const pct = Math.round((s.count / Math.max(stats.totals.orders, 1)) * 100);
                                    return (
                                        <li key={s.status}>
                                            <div className="mb-1 flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                                                    {STATUS_LABELS[s.status] ?? s.status}
                                                </span>
                                                <span className="tabular-nums text-gray-600 dark:text-gray-300">
                                                    {s.count} <span className="text-xs text-gray-400">({pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                                                <div className="h-1.5 rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: color }} />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </ChartCard>
                        <ChartCard title="Giao dịch gần đây" className="xl:col-span-2">
                            <RecentOrders orders={stats.recentOrders} />
                        </ChartCard>
                    </div>

                    <ChartCard title="Người dùng mới nhất">
                        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            {stats.recentUsers.map((u) => (
                                <li key={u.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                                    {u.avatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={u.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                                    ) : (
                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                                            {u.name?.charAt(0).toUpperCase() ?? "?"}
                                        </span>
                                    )}
                                    <div className="min-w-0">
                                        <p className="flex items-center gap-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                                            {u.name}
                                            {u.is_premium && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                                        </p>
                                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </ChartCard>
                </div>
            )}
        </div>
    );
}
