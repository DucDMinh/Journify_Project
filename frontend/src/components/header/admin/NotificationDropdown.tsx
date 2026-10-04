"use client";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { Bell, ShoppingBag, UserPlus, X } from "lucide-react";
import { Dropdown } from "../../ui/dropdown/Dropdown";
import { api } from "@/lib/apiClient";
import { DashboardStats } from "@/interface";
import { timeAgo } from "@/utils/time";
import { formatVnd } from "@/lib/format";

type Activity = { id: string; kind: "order" | "user"; title: string; detail: string; createdAt: string };

const SEEN_KEY = "admin_activity_seen_at";
const ORDER_LABELS: Record<string, string> = { PAID: "đã thanh toán", PENDING: "đang chờ thanh toán", CANCEL: "đã hủy" };

const readSeenAt = () => {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
};

const toActivities = (stats: DashboardStats): Activity[] =>
  [
    ...stats.recentOrders.map((order) => ({
      id: `order-${order.id}`,
      kind: "order" as const,
      title: `${order.user_id?.name ?? "Người dùng"} tạo đơn ${formatVnd(order.amount)}`,
      detail: `Đơn #${order.order_code} ${ORDER_LABELS[order.status] ?? order.status}`,
      createdAt: order.created_at,
    })),
    ...stats.recentUsers.map((user) => ({
      id: `user-${user.id}`,
      kind: "user" as const,
      title: `${user.name} vừa đăng ký`,
      detail: user.email,
      createdAt: user.created_at,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [seenAt, setSeenAt] = useState(0);

  const load = useCallback(
    () =>
      api.get<DashboardStats>("/stats/overview?months=1").then(({ response, data }) => {
        if (response.ok && data.data) setActivities(toActivities(data.data));
        else setActivities([]);
      }),
    [],
  );

  useEffect(() => {
    let ignore = false;
    api.get<DashboardStats>("/stats/overview?months=1").then(({ response, data }) => {
      if (ignore) return;
      setSeenAt(readSeenAt());
      setActivities(response.ok && data.data ? toActivities(data.data) : []);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const hasUnread = (activities ?? []).some((activity) => new Date(activity.createdAt).getTime() > seenAt);

  const toggleDropdown = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      load();
      const now = Date.now();
      setSeenAt(now);
      try {
        localStorage.setItem(SEEN_KEY, String(now));
      } catch {
        return;
      }
    }
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
        aria-label="Hoạt động gần đây"
      >
        {hasUnread && (
          <span className="absolute right-0 top-0.5 z-10 flex h-2 w-2 rounded-full bg-orange-400">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
          </span>
        )}
        <Bell className="h-5 w-5" />
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute -right-[240px] mt-[17px] flex max-h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Hoạt động gần đây</h5>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          {activities === null && <li className="px-2 py-6 text-center text-sm text-gray-500">Đang tải...</li>}
          {activities?.length === 0 && <li className="px-2 py-6 text-center text-sm text-gray-500">Chưa có hoạt động nào.</li>}
          {activities?.map((activity) => (
            <li key={activity.id} className="flex gap-3 rounded-lg px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${activity.kind === "order" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-brand-50 text-brand-600 dark:bg-brand-500/10"}`}>
                {activity.kind === "order" ? <ShoppingBag className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{activity.title}</span>
                <span className="block truncate text-theme-xs text-gray-500 dark:text-gray-400">{activity.detail}</span>
                <span className="block text-theme-xs text-gray-400">{timeAgo(activity.createdAt)}</span>
              </span>
            </li>
          ))}
        </ul>
        <Link
          href="/orders"
          onClick={() => setIsOpen(false)}
          className="mt-3 block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Xem tất cả giao dịch
        </Link>
      </Dropdown>
    </div>
  );
}
