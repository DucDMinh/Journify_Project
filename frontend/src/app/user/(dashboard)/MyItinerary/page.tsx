/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
    Compass,
    Plus,
    PlaneTakeoff,
    Archive
} from "lucide-react";
import { toast } from 'sonner';
import { Itinerary } from "@/interface";
import { MyItineraryCard } from "@/components/user/MyItinerary/MyItineraryCard";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/hooks/auth/AuthContext";
import { TripDetailModal1 } from "@/components/modals/user/TripDetailModal1";
import { useDashboard } from "@/app/user/(dashboard)/layout";

export default function MyItineraryPage() {
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [activeTripDetail, setActiveTripDetail] = useState<Itinerary | null>(null);
    const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">("all");
    const { setIsCreatingTrip, notify } = useDashboard();
    const { user: currentUser } = useAuth();
    const filteredItineraries = useMemo(() => {
        const now = new Date();
        return itineraries.filter((iti) => {
            if (activeTab === "all") return true;
            const startDate = new Date(iti.start_date);
            if (activeTab === "upcoming") {
                return startDate >= now;
            } else {
                return startDate < now;
            }
        });
    }, [itineraries, activeTab]);
    const handleDelete = async (id: string) => {
        const toastId = toast.loading("Đang xóa...");
        try {
            const { data, response } = await api.delete(`/itineraries/${id}`);
            if (!response.ok) {
                throw new Error("Failed to delete itinerary");
            }
            toast.success(`Xóa "${data.data.title}" thành công`, { id: toastId });
            setItineraries(prev => prev.filter(iti => iti.id !== id));
        } catch (err: any) {
            console.error("Lỗi xóa:", err);
            toast.error(err.message || "Có lỗi xảy ra khi xóa lộ trình", { id: toastId });
        }
    };


    useEffect(() => {
        const fetchMyItineraries = async () => {
            try {
                const { data, response } = await api.get('/itineraries/me');
                if (!response.ok) {
                    throw new Error("Failed to fetch itineraries");
                }
                if (currentUser && data.userId !== currentUser.id) {
                    toast.error("Bạn không có quyền truy cập vào lộ trình này");
                }
                const my_itineraries: Itinerary[] = data?.data?.data || data?.data || data || [];
                setItineraries(my_itineraries);
            } catch (error) {
                console.error("Error fetching itineraries:", error);
            }
        };
        if (currentUser) {
            fetchMyItineraries();
        }
    }, [currentUser]);
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] font-display">
                            Khu vực cá nhân
                        </span>
                    </div>
                    <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-main)]">
                        Sổ tay hành trình của tôi
                    </h1>
                    <p className="mt-2 text-[var(--text-muted)] text-sm md:text-base font-medium max-w-xl">
                        Nơi lưu giữ những kế hoạch vi vu và kỉ niệm trên từng chặng đường. Bạn hiện có
                        <strong className="text-[var(--text-main)] mx-1">{itineraries.length}</strong>
                        cuốn sổ tay.
                    </p>
                </div>

                <button onClick={() => setIsCreatingTrip(true)} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)] text-white text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all shrink-0">
                    <Plus className="w-4 h-4" />
                    Bắt đầu hành trình mới
                </button>
            </div>
            <div className="flex items-center gap-2 mb-8 bg-[var(--bg-card)] border border-[var(--border-color)] p-1.5 rounded-2xl w-fit shadow-sm">
                <button
                    onClick={() => setActiveTab("all")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "all" ? "bg-[var(--bg-paper)] text-[var(--text-main)] shadow-sm border border-[var(--border-color)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent"
                        }`}
                >
                    <Compass className="w-4 h-4" /> Tất cả
                </button>
                <button
                    onClick={() => setActiveTab("upcoming")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "upcoming" ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" : "text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent"
                        }`}
                >
                    <PlaneTakeoff className="w-4 h-4" /> Sắp khởi hành
                </button>
                <button
                    onClick={() => setActiveTab("past")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "past" ? "bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" : "text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent"
                        }`}
                >
                    <Archive className="w-4 h-4" /> Đã hoàn thành
                </button>
            </div>
            {filteredItineraries.length === 0 ? (
                <div className="p-16 text-center bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] rounded-[32px]">
                    <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[var(--bg-bento)] flex items-center justify-center text-[var(--text-muted)]">
                        <Compass className="w-10 h-10 opacity-40 animate-pulse" />
                    </div>
                    <h3 className="font-display font-bold text-xl mb-2 text-[var(--text-main)]">
                        Chưa có lịch trình nào
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto mb-6">
                        Hãy bắt đầu lên kế hoạch cho chuyến đi tiếp theo của bạn ngay hôm nay.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filteredItineraries.map((itinerary, index) => (
                            <MyItineraryCard
                                key={itinerary.id}
                                itinerary={itinerary}
                                index={index}
                                onOpen={() => setActiveTripDetail(itinerary)}
                                onDelete={() => handleDelete(itinerary.id)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
            <AnimatePresence>
                {activeTripDetail && (
                    <TripDetailModal1 itinerary={activeTripDetail} onClose={() => setActiveTripDetail(null)} onSave={() => notify("okokok", "!!!")} />
                )}
            </AnimatePresence>
        </div>
    );
}