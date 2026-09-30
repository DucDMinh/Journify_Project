import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Order } from "@/interface";
import { formatVnd, STATUS_COLORS } from "./chartTheme";

const STATUS_META: Record<string, { label: string; icon: typeof CheckCircle2 }> = {
    PAID: { label: "Đã thanh toán", icon: CheckCircle2 },
    PENDING: { label: "Chờ thanh toán", icon: Clock },
    CANCEL: { label: "Đã hủy", icon: XCircle },
};

const formatDate = (iso: string) => new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function RecentOrders({ orders }: { orders: Order[] }) {
    if (orders.length === 0) return <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Chưa có giao dịch nào</p>;
    return (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {orders.map((order) => {
                const meta = STATUS_META[order.status] ?? { label: order.status, icon: Clock };
                const Icon = meta.icon;
                const color = STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] ?? "#898781";
                return (
                    <li key={order.id} className="flex items-center gap-3 py-2.5 text-sm">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: `${color}1a`, color }}>
                            <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-800 dark:text-gray-100">{order.user_id?.name ?? "Người dùng ẩn danh"}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                #{order.order_code} · {formatDate(order.created_at)} · {meta.label}
                            </p>
                        </div>
                        <span className="shrink-0 tabular-nums font-semibold text-gray-800 dark:text-gray-100">{formatVnd(order.amount)}</span>
                    </li>
                );
            })}
        </ul>
    );
}
