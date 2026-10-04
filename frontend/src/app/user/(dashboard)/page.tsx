"use client";

import React, { useMemo, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Sparkles, Award } from "lucide-react";
import { toast } from 'sonner';
import confetti from "canvas-confetti";
import { Itinerary, Location } from "@/interface";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/hooks/auth/AuthContext";
import { UserBanner } from "@/components/user/HomePage/UserBanner";
import { TrendingItinerary } from "@/components/user/HomePage/TrendingItinerary";
import { TripDetailModal2 } from "@/components/modals/user/TripDetailModal2";
import { RegionExplore } from "@/components/user/HomePage/RegionExplore";
import { WishlistPreview } from "@/components/user/HomePage/WishlistPreview";
import { TravelTips } from "@/components/user/HomePage/TravelTips";
import { useDashboard } from "@/app/user/(dashboard)/layout";
import { useRouter } from "next/navigation";
import { cloneItinerary } from "@/lib/itinerary";

const readCookie = (name: string) => {
    const match = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

const clearCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

function triggerConfetti() {
    confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#FF5A36", "#0EA5E9", "#10B981", "#F59E0B"],
    });
}

export default function JournifyUserDashboard() {
    const [trendingItineraries, setTrendingItineraries] = useState<Itinerary[]>([]);
    const [isTrendingLoading, setIsTrendingLoading] = useState(true);
    const [myItineraries, setMyItineraries] = useState<Itinerary[] | null>(null);
    const [wishlist, setWishlist] = useState<Location[]>([]);
    const [activeTripDetail, setActiveTripDetail] = useState<Itinerary | null>(null);
    const router = useRouter();
    const { notify, openAiPlanner } = useDashboard();
    const { user: currentUser } = useAuth();

    useEffect(() => {
        const errorCookie = readCookie("toast_error");
        if (readCookie("clear_storage") || errorCookie) {
            localStorage.removeItem("userData");
            clearCookie("clear_storage");
        }
        if (errorCookie) {
            toast.error(errorCookie === "TOKEN_EXPIRED" ? "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!" : "Vui lòng đăng nhập để tiếp tục.");
            clearCookie("toast_error");
        }
    }, []);

    useEffect(() => {
        let ignore = false;
        api.get<Itinerary[]>("/itineraries?trending=weekly")
            .then(({ data, response }) => {
                if (ignore) return;
                if (!response.ok) throw new Error(data.message || "Không tải được lộ trình nổi bật");
                setTrendingItineraries(data.data ?? []);
            })
            .catch((error: unknown) => !ignore && notify(error instanceof Error ? error.message : "Không thể tải dữ liệu", "⚠️"))
            .finally(() => !ignore && setIsTrendingLoading(false));
        api.get<Location[]>("/locations?trending=true&limit=4")
            .then(({ data, response }) => {
                if (!ignore && response.ok) setWishlist(data.data ?? []);
            })
            .catch(() => undefined);
        return () => {
            ignore = true;
        };
    }, [notify]);

    useEffect(() => {
        if (!currentUser) return;
        let ignore = false;
        api.get<Itinerary[]>("/itineraries/me")
            .then(({ data, response }) => {
                if (!ignore && response.ok) setMyItineraries(data.data ?? []);
            })
            .catch(() => undefined);
        return () => {
            ignore = true;
        };
    }, [currentUser]);

    const handleCloneTrip = async (trip: Itinerary) => {
        if (!currentUser) {
            toast.error("Vui lòng đăng nhập để lưu lộ trình");
            router.push("/auth/signin?next=/");
            return;
        }
        const toastId = toast.loading("Đang lưu lộ trình vào sổ tay...");
        const result = await cloneItinerary(trip.id);
        if (!result.ok) {
            toast.error(result.message, { id: toastId });
            return;
        }
        toast.success(`Đã lưu "${trip.title}" vào Lộ trình của tôi`, {
            id: toastId,
            action: { label: "Xem", onClick: () => router.push("/my-itinerary") },
        });
        triggerConfetti();
        api.get<Itinerary[]>("/itineraries/me").then(({ data, response }) => response.ok && setMyItineraries(data.data ?? []));
    };

    const handleViewDetailItinerary = async (id: string) => {
        const { data, response } = await api.get<Itinerary>(`/itineraries/${id}`);
        if (!response.ok || !data.data) {
            toast.error(data.message || "Không tải được chi tiết lộ trình");
            return;
        }
        setActiveTripDetail(data.data);
    };

    const personalStats = useMemo(() => {
        const trips = myItineraries ?? [];
        return {
            totalTrips: trips.length,
            publicTrips: trips.filter((trip) => trip.share).length,
            totalCloned: trips.filter((trip) => trip.cloned_from_id).length,
            totalPlaces: trips.reduce(
                (sum, trip) => sum + (trip.itinerary_days ?? []).reduce((acc, day) => acc + (day.itinerary_locations?.length ?? 0), 0),
                0,
            ),
        };
    }, [myItineraries]);

    const statRows = [
        { label: "Lộ trình đã lưu", value: personalStats.totalTrips },
        { label: "Đang chia sẻ công khai", value: personalStats.publicTrips },
        { label: "Lộ trình đã clone", value: personalStats.totalCloned },
        { label: "Hoạt động đã lên lịch", value: personalStats.totalPlaces },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-paper)] text-[var(--text-main)] transition-colors selection:bg-[var(--accent-primary)] selection:text-white">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
                <div className="space-y-12 md:space-y-16">
                    <UserBanner currentUser={currentUser} onOpenAiPlanner={openAiPlanner} />
                    <TrendingItinerary
                        trendingItineraries={trendingItineraries}
                        isLoading={isTrendingLoading}
                        handleViewDetailItinerary={handleViewDetailItinerary}
                        handleCloneTrip={handleCloneTrip}
                    />
                    <RegionExplore />
                    <TravelTips />

                    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm lg:col-span-1">
                            <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-bold">
                                <Award className="h-5 w-5 text-[var(--accent-gold)]" /> Hành trình của bạn
                            </h3>
                            {currentUser ? (
                                <>
                                    <div className="space-y-4">
                                        {statRows.map((row) => (
                                            <div key={row.label} className="flex items-center justify-between">
                                                <span className="text-sm text-[var(--text-muted)]">{row.label}</span>
                                                {myItineraries === null ? (
                                                    <span className="h-5 w-8 animate-pulse rounded bg-[var(--border-color)]" />
                                                ) : (
                                                    <span className="text-lg font-bold">{row.value}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => router.push('/my-itinerary')}
                                        className="mt-6 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-paper)] py-2.5 text-sm font-bold transition hover:bg-[var(--accent-primary)] hover:text-white"
                                    >
                                        Quản lý lộ trình
                                    </button>
                                </>
                            ) : (
                                <div className="py-6 text-center text-[var(--text-muted)]">
                                    <Award className="mx-auto mb-2 h-8 w-8 opacity-30" />
                                    <p className="text-sm">Đăng nhập để xem thống kê cá nhân.</p>
                                </div>
                            )}
                        </div>
                        <WishlistPreview wishlist={wishlist} onOpenAiPlanner={openAiPlanner} />
                    </section>
                    <section className="relative overflow-hidden rounded-3xl border border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-gold)]/10 p-8 shadow-sm md:p-10">
                        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                            <div className="flex-1">
                                <h2 className="font-display mb-2 flex items-center gap-2 text-2xl font-bold">
                                    <Sparkles className="h-6 w-6 text-[var(--accent-gold)]" /> Bạn chưa có ý tưởng?
                                </h2>
                                <p className="max-w-md text-sm text-[var(--text-muted)]">
                                    Hãy để AI tạo lộ trình cá nhân hóa dựa trên sở thích, ngân sách và thời gian của bạn chỉ trong vài giây.
                                </p>
                            </div>
                            <button
                                onClick={openAiPlanner}
                                className="whitespace-nowrap rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)] px-6 py-3 font-bold text-white shadow-lg transition hover:opacity-90"
                            >
                                Tạo lộ trình với AI
                            </button>
                        </div>
                    </section>
                </div>
            </div>
            <AnimatePresence>
                {activeTripDetail && (
                    <TripDetailModal2
                        currentUser={currentUser}
                        itinerary={activeTripDetail}
                        onClose={() => setActiveTripDetail(null)}
                        onClone={() => handleCloneTrip(activeTripDetail)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
