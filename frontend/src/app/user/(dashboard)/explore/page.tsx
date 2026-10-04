"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Compass, MapPin, Mountain, Route, Sparkles, X } from "lucide-react";
import { api } from "@/lib/apiClient";
import { Location, Province, Region, RegionProvince } from "@/interface";
import { REGION_GRADIENTS, regionCover, useRegions } from "@/hooks/user/useRegions";
import { useDashboard } from "@/app/user/(dashboard)/layout";
import SafeImage from "@/components/common/SafeImage";
import { shortPlaceName } from "@/lib/format";

export default function ExplorePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--bg-paper)]" />}>
            <ExploreContent />
        </Suspense>
    );
}

function ExploreContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { regions, isLoading, error } = useRegions();
    const { openCreateTrip } = useDashboard();
    const requestedKey = searchParams.get("region");
    const [selectedProvince, setSelectedProvince] = useState<RegionProvince | null>(null);

    const activeRegion: Region | undefined = regions?.find((r) => r.key === requestedKey) ?? regions?.[0];

    const selectRegion = (key: string) => {
        setSelectedProvince(null);
        router.replace(`/explore?region=${key}`, { scroll: false });
    };

    return (
        <div className="min-h-screen bg-[var(--bg-paper)] pb-20">
            <div className="relative h-[300px] overflow-hidden md:h-[360px]">
                {activeRegion && (
                    <SafeImage key={activeRegion.key} src={regionCover(activeRegion)} alt="" className="h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-paper)] via-black/50 to-black/20" />
                <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/85">
                        <Compass className="h-4 w-4" /> Khám phá theo vùng miền
                    </p>
                    <h1 className="font-display text-3xl font-bold text-white drop-shadow md:text-5xl">{activeRegion?.name ?? "Việt Nam"}</h1>
                    {activeRegion && (
                        <p className="mt-2 max-w-xl text-sm text-white/85 md:text-base">
                            {activeRegion.tagline} · {activeRegion.provinces.length} tỉnh thành, {activeRegion.locations} địa điểm, {activeRegion.itineraries} lộ trình công khai
                        </p>
                    )}
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="-mt-6 mb-8 flex gap-2 overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-2 shadow-lg [scrollbar-width:none]">
                    {(regions ?? []).map((region) => (
                        <button
                            key={region.key}
                            onClick={() => selectRegion(region.key)}
                            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                                activeRegion?.key === region.key
                                    ? `bg-gradient-to-r ${REGION_GRADIENTS[region.key]} text-white shadow-md`
                                    : "text-[var(--text-muted)] hover:bg-[var(--bg-paper)] hover:text-[var(--text-main)]"
                            }`}
                        >
                            {region.name}
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeRegion?.key === region.key ? "bg-white/25" : "bg-[var(--bg-paper)]"}`}>
                                {region.provinces.length}
                            </span>
                        </button>
                    ))}
                </div>

                {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

                {isLoading ? (
                    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-56 animate-pulse rounded-2xl bg-[var(--border-color)]" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                        {activeRegion?.provinces.map((province) => (
                            <motion.button
                                key={province.id}
                                whileHover={{ y: -4 }}
                                onClick={() => setSelectedProvince(province)}
                                className="group relative h-56 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-left shadow-sm"
                            >
                                <SafeImage src={province.image_url} fallback={regionCover(activeRegion)} alt={province.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                                    <h3 className="text-lg font-bold leading-tight">{province.name}</h3>
                                    <p className="mt-1 flex flex-wrap gap-x-3 text-xs opacity-90">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> {province.locations} địa điểm
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Route className="h-3 w-3" /> {province.itineraries} lộ trình
                                        </span>
                                    </p>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedProvince && (
                    <ProvinceDrawer
                        province={selectedProvince}
                        onClose={() => setSelectedProvince(null)}
                        onCreateTrip={() => {
                            const provinceId = selectedProvince.id;
                            setSelectedProvince(null);
                            openCreateTrip(provinceId);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function ProvinceDrawer({ province, onClose, onCreateTrip }: { province: RegionProvince; onClose: () => void; onCreateTrip: () => void }) {
    const [locations, setLocations] = useState<Location[] | null>(null);

    useEffect(() => {
        let ignore = false;
        api.get<Province & { locations?: Location[] }>(`/provinces/${province.id}`).then(({ response, data }) => {
            if (ignore) return;
            setLocations(response.ok ? (data.data?.locations ?? []) : []);
        });
        return () => {
            ignore = true;
        };
    }, [province.id]);

    const sorted = [...(locations ?? [])].sort((a, b) => (b.saved_count ?? 0) - (a.saved_count ?? 0));

    return (
        <div className="fixed inset-0 z-[90] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative flex h-full w-full max-w-lg flex-col bg-[var(--bg-card)] shadow-2xl"
            >
                <div className="relative h-48 shrink-0">
                    <SafeImage src={province.image_url} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />
                    <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white hover:bg-black/60" aria-label="Đóng">
                        <X className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-5">
                        <h2 className="font-display text-2xl font-bold text-[var(--text-main)]">{province.name}</h2>
                        <p className="text-xs text-[var(--text-muted)]">
                            {province.locations} địa điểm · {province.itineraries} lộ trình công khai
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-6">
                    {province.description && <p className="text-sm leading-relaxed text-[var(--text-main)]/90">{province.description}</p>}
                    {province.best_time_to_visit && (
                        <p className="mt-3 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                            <CalendarDays className="h-4 w-4 text-[var(--accent-primary)]" /> Thời điểm đẹp: <span className="font-semibold text-[var(--text-main)]">{province.best_time_to_visit}</span>
                        </p>
                    )}

                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <Link
                            href={`/itineraries?province=${encodeURIComponent(province.name)}`}
                            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] py-2.5 text-sm font-bold text-[var(--text-main)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                        >
                            <Route className="h-4 w-4" /> Lộ trình gợi ý
                        </Link>
                        <button
                            onClick={onCreateTrip}
                            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90"
                        >
                            <Sparkles className="h-4 w-4" /> Tạo lộ trình
                        </button>
                    </div>

                    <h3 className="mt-6 mb-3 flex items-center gap-2 font-bold text-[var(--text-main)]">
                        <Mountain className="h-4 w-4 text-[var(--accent-primary)]" /> Địa điểm nổi bật
                    </h3>
                    {locations === null ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--border-color)]" />
                            ))}
                        </div>
                    ) : sorted.length === 0 ? (
                        <p className="py-6 text-center text-sm text-[var(--text-muted)]">Chưa có địa điểm nào được thêm cho tỉnh này.</p>
                    ) : (
                        <ul className="space-y-3">
                            {sorted.map((loc) => (
                                <li key={loc.id} className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-paper)] p-2.5">
                                    <SafeImage src={loc.img} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-[var(--text-main)]" title={loc.name}>{shortPlaceName(loc.name)}</p>
                                        <p className="truncate text-xs text-[var(--text-muted)]">
                                            {loc.difficulty_level ? `Độ khó: ${loc.difficulty_level} · ` : ""}
                                            {loc.saved_count ?? 0} lượt lưu
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </motion.aside>
        </div>
    );
}
