"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Search,
    CheckCircle2,
    Clock,
    XCircle,
    Filter,
    ArrowDownToLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order } from '@/interface';
import { toast } from 'sonner';
import { api } from '@/lib/apiClient';
import { formatVnd } from '@/lib/format';
import { useAutoRefresh } from '@/hooks/admin/useAutoRefresh';

const STATUS_TEXT: Record<string, string> = { PAID: 'Thành công', PENDING: 'Đang chờ', CANCEL: 'Hủy' };

const csvCell = (value: unknown) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadCsv = (orders: Order[]) => {
    const header = ['Mã đơn', 'Khách hàng', 'Mô tả', 'TK đối ứng', 'Số tiền (VNĐ)', 'Trạng thái', 'Ngày tạo'];
    const rows = orders.map((order) => [
        order.order_code,
        order.user_id?.name ?? '',
        order.description ?? '',
        order.counterAccountNumber ?? '',
        Math.round(Number(order.amount) || 0),
        STATUS_TEXT[order.status] ?? order.status,
        new Date(order.created_at).toLocaleString('vi-VN'),
    ]);
    const csv = '\uFEFF' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `giao-dich-journify-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

const TABS = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PAID', label: 'Thành công' },
    { id: 'PENDING', label: 'Đang chờ' },
    { id: 'CANCEL', label: 'Thất bại/Hủy' }
];

export default function AdminOrderManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("ALL");
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const filteredOrders = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return orders.filter((order) => {
            const matchesSearch =
                !query ||
                String(order.order_code ?? '').includes(query) ||
                (order.user_id?.name ?? "").toLowerCase().includes(query);
            const matchesStatus = activeTab === "ALL" || order.status === activeTab;
            return matchesSearch && matchesStatus;
        });
    }, [searchQuery, activeTab, orders]);

    const fetchOrderData = useCallback(async () => {
        const { data, response } = await api.get<Order[]>('/orders');
        if (!response.ok) toast.error(data.message || "Không tải được danh sách giao dịch");
        else setOrders(data.data ?? []);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        let ignore = false;
        api.get<Order[]>('/orders').then(({ data, response }) => {
            if (ignore) return;
            if (!response.ok) toast.error(data.message || "Không tải được danh sách giao dịch");
            else setOrders(data.data ?? []);
            setIsLoading(false);
        });
        return () => {
            ignore = true;
        };
    }, []);

    useAutoRefresh(fetchOrderData);

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return {
            dateStr: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            timeStr: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const getStatusUI = (status: string) => {
        switch (status) {
            case 'PAID': return { color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-200', icon: CheckCircle2, text: 'Thành công' };
            case 'PENDING': return { color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-200', icon: Clock, text: 'Đang chờ' };
            default: return { color: 'text-rose-600', bg: 'bg-rose-500/10 border-rose-200', icon: XCircle, text: 'Hủy' };
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-4 md:p-1 font-sans text-slate-900 dark:text-slate-100 transition-colors">
            <div className="max-w-full mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Lịch sử Giao dịch</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý chi tiết luồng thanh toán từ hệ thống</p>
                    </div>
                    <button
                        onClick={() => {
                            if (filteredOrders.length === 0) {
                                toast.info("Không có giao dịch nào để xuất");
                                return;
                            }
                            downloadCsv(filteredOrders);
                            toast.success(`Đã xuất ${filteredOrders.length} giao dịch ra file CSV`);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/20"
                    >
                        <ArrowDownToLine className="w-4 h-4" />
                        Xuất CSV
                    </button>
                </div>
                <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/80 rounded-xl overflow-x-auto w-full md:w-auto hide-scrollbar">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative px-5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id ? "text-indigo-700 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        }`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div layoutId="activeTabIndicator" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm" />
                                    )}
                                    <span className="relative z-10">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm Mã đơn, Tên KH..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Table - Hiển thị Full thông tin */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                                    <th className="py-4 px-6">Mã Giao Dịch PayOS</th>
                                    <th className="py-4 px-6">Khách hàng</th>
                                    <th className="py-4 px-6">Nội dung / Mô tả</th>
                                    <th className="py-4 px-6">TK Đối Ứng (PayOS)</th>
                                    <th className="py-4 px-6 text-right">Số tiền</th>
                                    <th className="py-4 px-6">Trạng thái</th>
                                    <th className="py-4 px-6 text-right">Ngày tạo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                <AnimatePresence>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center text-sm text-slate-500">Đang tải giao dịch...</td>
                                        </tr>
                                    ) : filteredOrders.length > 0 ? (
                                        filteredOrders.map((order) => {
                                            const ui = getStatusUI(order.status);
                                            const StatusIcon = ui.icon;
                                            const { dateStr, timeStr } = formatDate(order.created_at);
                                            const userName = typeof order.user_id === 'object' && order.user_id !== null
                                                ? (order.user_id.name || 'User')
                                                : String(order.user_id);
                                            return (
                                                <motion.tr
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    key={order.id}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                                >
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{order.order_code}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <>
                                                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                {userName}
                                                            </div>
                                                        </>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            {order.description}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {order.counterAccountNumber ? (
                                                            <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                                                {order.counterAccountNumber}
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm italic text-slate-400">---</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {formatVnd(order.amount)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${ui.bg} ${ui.color}`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {ui.text}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-sm font-medium text-slate-900 dark:text-slate-300">{dateStr}</span>
                                                            <span className="text-xs text-slate-500 mt-0.5">{timeStr}</span>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <Filter className="w-12 h-12 mb-4 opacity-20" />
                                                    <p className="text-base font-medium text-slate-600 dark:text-slate-300">Không tìm thấy giao dịch nào</p>
                                                    <p className="text-sm mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-sm text-slate-500 flex justify-between items-center">
                        <span>Hiển thị <strong className="text-slate-900 dark:text-white">{filteredOrders.length}</strong> giao dịch</span>
                    </div>
                </div>
            </div>
        </div>
    );
}