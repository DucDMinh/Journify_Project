"use client";
import { useDashboard } from "@/app/user/(dashboard)/layout";
import LocationDetailModal from "@/components/modals/user/LocationDetailModal";
import SafeImage from "@/components/common/SafeImage";
import { api } from "@/lib/apiClient";
import { Location } from "@/interface";
import { shortPlaceName } from "@/lib/format";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Heart, MapPin, Sparkles } from "lucide-react";
import { useState } from "react";

interface WishlistPreviewProps {
    wishlist: Location[];
    onOpenAiPlanner: () => void;
}

const StarIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5" aria-label={`${rating} trên 5 sao`}>
            {Array.from({ length: 5 }).map((_, index) => {
                const fill = Math.max(0, Math.min(100, (rating - index) * 100));
                return (
                    <div key={index} className="relative h-3.5 w-3.5">
                        <StarIcon className="absolute left-0 top-0 h-3.5 w-3.5 text-gray-300" />
                        <StarIcon className="absolute left-0 top-0 h-3.5 w-3.5 text-yellow-400" style={{ clipPath: `inset(0 ${100 - fill}% 0 0)` }} />
                    </div>
                );
            })}
        </div>
    );
}

export const WishlistPreview = ({ wishlist, onOpenAiPlanner }: WishlistPreviewProps) => {
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const { notify } = useDashboard();

    const fetchDetailLocation = async (id: string) => {
        const { data, response } = await api.get<Location>(`/locations/${id}`);
        if (!response.ok || !data.data) {
            notify(data.message || "Không tải được thông tin địa điểm", "⚠️");
            return;
        }
        setSelectedLocation(data.data);
    };

    return (
        <>
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm lg:col-span-2">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-display flex items-center gap-2 text-lg font-bold">
                        <Heart className="h-5 w-5 shrink-0 text-rose-500" /> Điểm đến được lưu nhiều
                    </h3>
                    <Link href="/explore" className="flex shrink-0 items-center gap-1 text-sm font-bold text-[var(--accent-primary)] hover:underline">
                        Xem tất cả <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
                {wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {wishlist.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => fetchDetailLocation(item.id)}
                                className="flex min-w-0 gap-3 rounded-xl p-2 text-left transition hover:bg-[var(--bg-paper)]"
                            >
                                <SafeImage src={item.img} alt={shortPlaceName(item.name)} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                                <div className="min-w-0 flex-1">
                                    <h4 className="truncate text-sm font-bold" title={item.name}>{shortPlaceName(item.name)}</h4>
                                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-[var(--text-muted)]">
                                        <MapPin className="h-3 w-3 shrink-0" /> {item.provinces?.name ?? "Việt Nam"}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        {item.rating ? (
                                            <>
                                                <StarRating rating={Number(item.rating)} />
                                                <span className="text-xs font-medium text-[var(--text-muted)]">{Number(item.rating).toFixed(1)}</span>
                                            </>
                                        ) : (
                                            <span className="text-xs text-[var(--text-muted)]">{item.saved_count ?? 0} lượt lưu</span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="py-6 text-center text-[var(--text-muted)]">
                        <Heart className="mx-auto mb-2 h-8 w-8 opacity-30" />
                        <p className="text-sm">Chưa có điểm đến nào được lưu.</p>
                    </div>
                )}
                <button
                    onClick={onOpenAiPlanner}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 py-2.5 text-sm font-bold text-rose-500 transition hover:bg-rose-500 hover:text-white"
                >
                    <Sparkles className="h-4 w-4" /> Gợi ý điểm đến bằng AI
                </button>
            </div>
            <AnimatePresence>
                {selectedLocation && <LocationDetailModal location={selectedLocation} onClose={() => setSelectedLocation(null)} />}
            </AnimatePresence>
        </>
    );
};
