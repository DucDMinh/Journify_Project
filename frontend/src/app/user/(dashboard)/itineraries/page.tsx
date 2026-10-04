"use client";

import React, { useState, useMemo, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Wallet, SlidersHorizontal, ChevronRight, BookmarkPlus, TrendingUp, Compass } from "lucide-react";
import { toast } from 'sonner';
import { Itinerary } from "@/interface";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/hooks/auth/AuthContext";
import SafeImage from "@/components/common/SafeImage";
import UserAvatar from "@/components/common/UserAvatar";
import { TripDetailModal2 } from "@/components/modals/user/TripDetailModal2";
import { cloneItinerary, itineraryAuthor, provinceNames } from "@/lib/itinerary";
import { formatCost, matchesSearch } from "@/lib/format";

const PRICE_RANGES = [
    { id: "all", label: "Tất cả mức giá" },
    { id: "low", label: "Dưới 2 triệu" },
    { id: "mid", label: "2 - 5 triệu" },
    { id: "high", label: "Trên 5 triệu" },
];

const SORT_OPTIONS = [
    { id: "newest", label: "Mới nhất" },
    { id: "cost-asc", label: "Chi phí thấp → cao" },
    { id: "cost-desc", label: "Chi phí cao → thấp" },
    { id: "days-asc", label: "Ít ngày nhất" },
    { id: "days-desc", label: "Nhiều ngày nhất" },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]["id"];

const comparators: Record<SortId, (a: Itinerary, b: Itinerary) => number> = {
    newest: (a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""),
    "cost-asc": (a, b) => (Number(a.estimated_cost) || 0) - (Number(b.estimated_cost) || 0),
    "cost-desc": (a, b) => (Number(b.estimated_cost) || 0) - (Number(a.estimated_cost) || 0),
    "days-asc": (a, b) => (a.days ?? 1) - (b.days ?? 1),
    "days-desc": (a, b) => (b.days ?? 1) - (a.days ?? 1),
};

export default function ExploreItinerariesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--bg-paper)]" />}>
            <ExploreItinerariesContent />
        </Suspense>
    );
}

function ExploreItinerariesContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState("all");
    const [selectedProvince, setSelectedProvince] = useState(searchParams.get("province") || "all");
    const [sortBy, setSortBy] = useState<SortId>("newest");
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTrip, setActiveTrip] = useState<Itinerary | null>(null);

    useEffect(() => {
        let ignore = false;
        api.get<Itinerary[]>('/itineraries?is_public=true')
            .then(({ data, response }) => {
                if (ignore) return;
                if (!response.ok) throw new Error(data.message || "Lỗi khi lấy thông tin lộ trình!");
                setItineraries(data.data ?? []);
            })
            .catch((error: unknown) => !ignore && toast.error(error instanceof Error ? error.message : "Không thể tải dữ liệu"))
            .finally(() => !ignore && setIsLoading(false));
        return () => {
            ignore = true;
        };
    }, []);

    const openTrip = useCallback(async (id: string) => {
        const { data, response } = await api.get<Itinerary>(`/itineraries/${id}`);
        if (!response.ok || !data.data) {
            toast.error(data.message || "Không tải được lộ trình");
            return;
        }
        setActiveTrip(data.data);
    }, []);

    const sharedTripId = searchParams.get("trip");
    useEffect(() => {
        if (!sharedTripId) return;
        let ignore = false;
        api.get<Itinerary>("/itineraries/" + sharedTripId).then(({ data, response }) => {
            if (ignore) return;
            if (!response.ok || !data.data) {
                toast.error(data.message || "Lộ trình không tồn tại hoặc chưa được chia sẻ công khai");
                return;
            }
            setActiveTrip(data.data);
        });
        return () => {
            ignore = true;
        };
    }, [sharedTripId]);

    const closeTrip = () => {
        setActiveTrip(null);
        if (sharedTripId) router.replace("/itineraries", { scroll: false });
    };

    const handleClone = async (trip: Itinerary) => {
        if (!currentUser) {
            toast.error("Vui lòng đăng nhập để lưu lộ trình");
            router.push(`/auth/signin?next=${encodeURIComponent("/itineraries")}`);
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
    };

    const availableProvinces = useMemo(
        () => [...new Set(itineraries.flatMap((trip) => provinceNames(trip)))].sort((a, b) => a.localeCompare(b, "vi")),
        [itineraries],
    );
    const availableThemes = useMemo(
        () => [...new Set(itineraries.map((trip) => trip.theme?.trim()).filter((theme): theme is string => Boolean(theme)))].sort((a, b) => a.localeCompare(b, "vi")),
        [itineraries],
    );

    const filteredTrips = useMemo(() => {
        return itineraries
            .filter((trip) => {
                const names = provinceNames(trip);
                const cost = Number(trip.estimated_cost) || 0;
                const matchPrice =
                    priceRange === "all" ||
                    (priceRange === "low" && cost < 2_000_000) ||
                    (priceRange === "mid" && cost >= 2_000_000 && cost <= 5_000_000) ||
                    (priceRange === "high" && cost > 5_000_000);
                return (
                    matchesSearch(searchQuery, trip.title, trip.summary, trip.theme, names.join(" ")) &&
                    (selectedThemes.length === 0 || selectedThemes.includes(trip.theme?.trim() ?? "")) &&
                    (selectedProvince === "all" || names.includes(selectedProvince)) &&
                    matchPrice
                );
            })
            .sort(comparators[sortBy]);
    }, [searchQuery, selectedThemes, priceRange, selectedProvince, sortBy, itineraries]);

    const hasFilters = selectedThemes.length > 0 || priceRange !== "all" || selectedProvince !== "all" || searchQuery.trim() !== "";

    return (
        <div className="min-h-screen bg-[var(--bg-paper)] pb-20">
            <div className="relative flex h-[280px] items-center justify-center overflow-hidden rounded-b-[32px] px-4 shadow-sm sm:px-6 lg:px-8">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)]"></div>
                <div className="absolute inset-0 bg-black/20"></div>

                <div className="relative z-10 mt-[-20px] w-full max-w-4xl text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="font-display mb-3 text-3xl font-extrabold text-white drop-shadow-md md:text-4xl">Lộ trình từ cộng đồng</h1>
                        <p className="mb-6 text-base font-medium text-white/90 drop-shadow md:text-lg">
                            Tham khảo, lưu về và chỉnh sửa những lộ trình được chia sẻ công khai
                        </p>
                    </motion.div>

                    <motion.form
                        onSubmit={(e) => e.preventDefault()}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="absolute -bottom-12 left-4 right-4 mx-auto flex max-w-3xl flex-col gap-2.5 rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-2 shadow-xl md:left-0 md:right-0 md:flex-row md:p-3"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                type="search"
                                placeholder="Tìm theo tên, tỉnh thành, chủ đề (VD: Đà Lạt, Sa Pa...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-transparent bg-[var(--bg-paper)] py-3 pl-11 pr-4 text-base font-medium text-[var(--text-main)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)]"
                                aria-label="Tìm lộ trình"
                            />
                        </div>
                        <span className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)] px-6 py-3 text-base font-bold text-white shadow-md">
                            <Compass className="h-4 w-4" /> {filteredTrips.length} kết quả
                        </span>
                    </motion.form>
                </div>
            </div>

            <div className="mx-auto mt-20 flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:px-8">
                <aside className="w-full shrink-0 lg:w-72">
                    <div className="sticky top-24 space-y-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="h-5 w-5 text-[var(--accent-primary)]" />
                                <h3 className="text-lg font-bold text-[var(--text-main)]">Bộ lọc</h3>
                            </div>
                            {hasFilters && (
                                <button
                                    onClick={() => {
                                        setSelectedThemes([]);
                                        setPriceRange("all");
                                        setSelectedProvince("all");
                                        setSearchQuery("");
                                    }}
                                    className="text-sm font-medium text-[var(--accent-primary)] hover:underline"
                                >
                                    Xóa lọc
                                </button>
                            )}
                        </div>

                        <div>
                            <h4 className="mb-4 flex items-center gap-2 font-bold text-[var(--text-main)]">
                                <MapPin className="h-4 w-4 text-[var(--text-muted)]" /> Điểm đến
                            </h4>
                            <select
                                value={selectedProvince}
                                onChange={(e) => setSelectedProvince(e.target.value)}
                                className="w-full cursor-pointer rounded-xl border border-[var(--border-color)] bg-[var(--bg-paper)] px-4 py-3 text-sm font-bold text-[var(--text-main)] outline-none transition-colors focus:border-[var(--accent-primary)]"
                            >
                                <option value="all">Tất cả điểm đến</option>
                                {availableProvinces.map((prov) => (
                                    <option key={prov} value={prov}>{prov}</option>
                                ))}
                            </select>
                        </div>

                        {availableThemes.length > 0 && (
                            <div>
                                <h4 className="mb-4 flex items-center gap-2 font-bold text-[var(--text-main)]">
                                    <TrendingUp className="h-4 w-4 text-[var(--text-muted)]" /> Chủ đề
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {availableThemes.map((theme) => (
                                        <button
                                            key={theme}
                                            onClick={() => setSelectedThemes((prev) => (prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]))}
                                            className={`rounded-xl border px-3 py-2 text-sm font-bold transition-all ${
                                                selectedThemes.includes(theme)
                                                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white shadow-md"
                                                    : "border-[var(--border-color)] bg-[var(--bg-paper)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                                            }`}
                                        >
                                            {theme}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="mb-4 flex items-center gap-2 font-bold text-[var(--text-main)]">
                                <Wallet className="h-4 w-4 text-[var(--text-muted)]" /> Ngân sách dự kiến
                            </h4>
                            <div className="space-y-3" role="radiogroup" aria-label="Ngân sách dự kiến">
                                {PRICE_RANGES.map((range) => (
                                    <button
                                        key={range.id}
                                        role="radio"
                                        aria-checked={priceRange === range.id}
                                        onClick={() => setPriceRange(range.id)}
                                        className="group flex w-full items-center gap-3 text-left"
                                    >
                                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${priceRange === range.id ? "border-[var(--accent-primary)]" : "border-[var(--text-muted)] group-hover:border-[var(--accent-primary)]"}`}>
                                            {priceRange === range.id && <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-primary)]" />}
                                        </span>
                                        <span className={`text-sm font-medium ${priceRange === range.id ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>{range.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="min-w-0 flex-1">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-[var(--text-muted)]">
                            Tìm thấy <span className="text-lg font-bold text-[var(--accent-primary)]">{filteredTrips.length}</span> lộ trình
                        </p>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortId)}
                            className="cursor-pointer rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
                            aria-label="Sắp xếp"
                        >
                            {SORT_OPTIONS.map((option) => (
                                <option key={option.id} value={option.id}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-6">
                        {isLoading ? (
                            [1, 2, 3].map((n) => <div key={n} className="h-64 animate-pulse rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)]"></div>)
                        ) : filteredTrips.length === 0 ? (
                            <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] py-24 text-center">
                                <Compass className="mx-auto mb-4 h-16 w-16 text-[var(--text-muted)] opacity-30" />
                                <h3 className="mb-2 text-xl font-bold text-[var(--text-main)]">Không tìm thấy lộ trình</h3>
                                <p className="text-[var(--text-muted)]">Thử thay đổi từ khóa hoặc bộ lọc để xem thêm kết quả nhé.</p>
                            </div>
                        ) : (
                            <AnimatePresence initial={false}>
                                {filteredTrips.map((trip, index) => {
                                    const provinces = provinceNames(trip);
                                    const author = itineraryAuthor(trip);
                                    return (
                                        <motion.div
                                            key={trip.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.06 }}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => openTrip(trip.id)}
                                            onKeyDown={(event) => event.key === "Enter" && openTrip(trip.id)}
                                            className="group flex cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] transition-all duration-300 hover:shadow-xl md:flex-row"
                                        >
                                            <div className="relative h-64 shrink-0 overflow-hidden bg-gray-200 md:h-auto md:w-80">
                                                <SafeImage src={trip.image_url} alt={trip.title} className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent"></div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleClone(trip);
                                                    }}
                                                    className="absolute right-4 top-4 z-10 rounded-full bg-white/30 p-2.5 text-white backdrop-blur-md transition-colors hover:bg-[var(--accent-primary)]"
                                                    title="Lưu vào Lộ trình của tôi"
                                                    aria-label="Lưu vào Lộ trình của tôi"
                                                >
                                                    <BookmarkPlus className="h-5 w-5" />
                                                </button>
                                                {trip.theme && (
                                                    <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-bold text-gray-900 shadow-sm backdrop-blur-sm">
                                                        <Compass className="h-3.5 w-3.5 text-[var(--accent-primary)]" /> {trip.theme}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-1 flex-col p-6 md:p-7">
                                                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                                    <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="line-clamp-1">{provinces.length ? provinces.join(", ") : "Chưa xác định điểm đến"}</span>
                                                </div>
                                                <h3 className="mb-3 line-clamp-2 text-2xl font-bold text-[var(--text-main)] transition-colors group-hover:text-[var(--accent-primary)]">{trip.title}</h3>
                                                <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">{trip.summary || "Chưa có mô tả cho lộ trình này."}</p>

                                                <div className="mt-auto flex flex-col justify-between gap-4 border-t border-[var(--border-color)] pt-5 sm:flex-row sm:items-center">
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar src={author?.avatar} name={author?.name} className="h-8 w-8" textClassName="text-xs" />
                                                        <span className="text-sm font-bold text-[var(--text-main)]">{author?.name || "Thành viên Journify"}</span>
                                                    </div>
                                                    <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Thời gian</span>
                                                                <span className="text-sm font-bold text-[var(--text-main)]">{trip.days || 1} ngày</span>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Chi phí</span>
                                                                <span className="text-sm font-bold text-[var(--accent-primary)]">{formatCost(trip.estimated_cost)}</span>
                                                            </div>
                                                        </div>
                                                        <span className="ml-2 hidden h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-paper)] text-[var(--text-main)] transition-colors group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white sm:flex">
                                                            <ChevronRight className="h-5 w-5" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>
                </main>
            </div>
            <AnimatePresence>
                {activeTrip && <TripDetailModal2 currentUser={currentUser} itinerary={activeTrip} onClose={closeTrip} onClone={() => handleClone(activeTrip)} />}
            </AnimatePresence>
        </div>
    );
}
