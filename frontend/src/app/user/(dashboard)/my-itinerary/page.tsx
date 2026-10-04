"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Compass, Plus, PlaneTakeoff, Archive, CalendarOff } from "lucide-react";
import { toast } from 'sonner';
import { Itinerary } from "@/interface";
import { MyItineraryCard } from "@/components/user/my-itinerary/MyItineraryCard";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/hooks/auth/AuthContext";
import { TripDetailModal1 } from "@/components/modals/user/TripDetailModal1";
import { useDashboard } from "@/app/user/(dashboard)/layout";
import { todayIso } from "@/lib/format";

type Tab = "all" | "upcoming" | "past" | "undated";

const TABS: { id: Tab; label: string; icon: typeof Compass; active: string }[] = [
    { id: "all", label: "Tất cả", icon: Compass, active: "bg-[var(--bg-paper)] text-[var(--text-main)] border-[var(--border-color)]" },
    { id: "upcoming", label: "Sắp khởi hành", icon: PlaneTakeoff, active: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400" },
    { id: "past", label: "Đã hoàn thành", icon: Archive, active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" },
    { id: "undated", label: "Chưa chọn ngày", icon: CalendarOff, active: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400" },
];

const tripStatus = (itinerary: Itinerary): Exclude<Tab, "all"> => {
    if (!itinerary.start_date) return "undated";
    const lastDay = itinerary.end_date ?? itinerary.start_date;
    return lastDay.slice(0, 10) >= todayIso() ? "upcoming" : "past";
};

export default function MyItineraryPage() {
    const [loadedItineraries, setItineraries] = useState<Itinerary[] | null>(null);
    const [activeTripDetail, setActiveTripDetail] = useState<Itinerary | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("all");
    const { openCreateTrip } = useDashboard();
    const { user: currentUser, isReady } = useAuth();
    const itineraries = useMemo(() => loadedItineraries ?? [], [loadedItineraries]);
    const isLoading = !isReady || (Boolean(currentUser) && loadedItineraries === null);

    const filteredItineraries = useMemo(
        () => itineraries.filter((iti) => activeTab === "all" || tripStatus(iti) === activeTab),
        [itineraries, activeTab],
    );

    useEffect(() => {
        if (!isReady || !currentUser) return;
        let ignore = false;
        api.get<Itinerary[]>('/itineraries/me')
            .then(({ data, response }) => {
                if (ignore) return;
                if (!response.ok) throw new Error(data.message || "Không tải được lộ trình của bạn");
                setItineraries(data.data ?? []);
            })
            .catch((error: unknown) => {
                if (ignore) return;
                setItineraries([]);
                toast.error(error instanceof Error ? error.message : "Không tải được lộ trình của bạn");
            });
        return () => {
            ignore = true;
        };
    }, [currentUser, isReady]);

    const deleteItinerary = async (itinerary: Itinerary) => {
        const toastId = toast.loading("Đang xóa...");
        const { data, response } = await api.delete<Itinerary>(`/itineraries/${itinerary.id}`);
        if (!response.ok) {
            toast.error(data.message || "Xóa lộ trình thất bại", { id: toastId });
            return;
        }
        setItineraries((prev) => (prev ?? []).filter((iti) => iti.id !== itinerary.id));
        toast.success(`Đã xóa "${itinerary.title}"`, { id: toastId });
    };

    const confirmDelete = (itinerary: Itinerary) => {
        toast.warning(`Xóa lộ trình "${itinerary.title}"?`, {
            description: "Toàn bộ ngày và hoạt động sẽ bị xóa vĩnh viễn.",
            duration: 8000,
            action: { label: "Xóa", onClick: () => deleteItinerary(itinerary) },
            cancel: { label: "Hủy", onClick: () => undefined },
        });
    };

    const handleSaved = (updated: Itinerary) => {
        setItineraries((prev) => (prev ?? []).map((iti) => (iti.id === updated.id ? updated : iti)));
        setActiveTripDetail(updated);
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
            <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-primary)]" />
                        <span className="font-display text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">Khu vực cá nhân</span>
                    </div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-main)] md:text-4xl">Sổ tay hành trình của tôi</h1>
                    <p className="mt-2 max-w-xl text-sm font-medium text-[var(--text-muted)] md:text-base">
                        Nơi lưu giữ những kế hoạch vi vu và kỉ niệm trên từng chặng đường. Bạn hiện có
                        <strong className="mx-1 text-[var(--text-main)]">{itineraries.length}</strong>
                        cuốn sổ tay.
                    </p>
                </div>

                <button
                    onClick={() => openCreateTrip()}
                    className="flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                    <Plus className="h-4 w-4" />
                    Bắt đầu hành trình mới
                </button>
            </div>
            <div className="mb-8 flex w-full gap-2 overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-1.5 shadow-sm [scrollbar-width:none] sm:w-fit">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                            activeTab === tab.id ? `${tab.active} shadow-sm` : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        }`}
                    >
                        <tab.icon className="h-4 w-4" /> {tab.label}
                    </button>
                ))}
            </div>
            {isLoading ? (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-80 animate-pulse rounded-[24px] bg-[var(--border-color)]" />
                    ))}
                </div>
            ) : filteredItineraries.length === 0 ? (
                <div className="rounded-[32px] border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] p-16 text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bg-bento)] text-[var(--text-muted)]">
                        <Compass className="h-10 w-10 opacity-40" />
                    </div>
                    <h3 className="font-display mb-2 text-xl font-bold text-[var(--text-main)]">
                        {itineraries.length === 0 ? "Chưa có lịch trình nào" : "Không có lộ trình trong mục này"}
                    </h3>
                    <p className="mx-auto mb-6 max-w-sm text-sm text-[var(--text-muted)]">
                        Hãy bắt đầu lên kế hoạch cho chuyến đi tiếp theo của bạn ngay hôm nay.
                    </p>
                    {itineraries.length === 0 && (
                        <button onClick={() => openCreateTrip()} className="rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90">
                            Tạo lộ trình đầu tiên
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                        {filteredItineraries.map((itinerary, index) => (
                            <MyItineraryCard
                                key={itinerary.id}
                                itinerary={itinerary}
                                index={index}
                                status={tripStatus(itinerary)}
                                onOpen={() => setActiveTripDetail(itinerary)}
                                onDelete={() => confirmDelete(itinerary)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
            <AnimatePresence>
                {activeTripDetail && (
                    <TripDetailModal1 itinerary={activeTripDetail} onClose={() => setActiveTripDetail(null)} onSaved={handleSaved} />
                )}
            </AnimatePresence>
        </div>
    );
}
