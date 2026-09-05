/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useDashboard } from "@/app/user/(dashboard)/layout";
import LocationDetailModal from "@/components/modals/user/LocationDetailModal";
import { api } from "@/lib/apiClient";
import { AnimatePresence } from "framer-motion";
import { ChevronRight, Heart, MapPin, Sparkles } from "lucide-react";
import { useState } from "react";

interface WishlistPreviewProps {
    wishlist: any[];
    setIsAiModalOpen: (isOpen: boolean) => void;
}
interface StarRatingProps {
    rating: number;
    maxStars?: number;
    size?: string;
}
const StarIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <svg
        className={className}
        style={style}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);
function StarRating({ rating, maxStars = 5, size = "w-5 h-5" }: StarRatingProps) {
    return (
        <div className="flex items-center gap-1">
            {[...Array(maxStars)].map((_, index) => {
                const fillPercentage = Math.max(0, Math.min(100, (rating - index) * 100));

                return (
                    <div key={index} className={`relative ${size}`}>
                        <StarIcon className={`${size} text-gray-300 absolute top-0 left-0`} />
                        <StarIcon
                            className={`${size} text-yellow-400 absolute top-0 left-0`}
                            style={{
                                clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`,
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
}

export const WishlistPreview = ({ wishlist, setIsAiModalOpen }: WishlistPreviewProps) => {
    const [selectedLocation, setSelectedLocation] = useState<any | null>(null)
    const { notify } = useDashboard();
    const fetchDetailLocation = async (id: string) => {
        try {
            const { data, response } = await api.get(`/locations/${id}`)
            if (!response.ok) throw new Error(data.message || "Lỗi khi lấy dữ liệu lộ trình");
            setSelectedLocation(data.data)
        } catch (error: any) {
            notify(error.message || "Không thể tải dữ liệu", "⚠️");
        }
    }
    return (
        <>
            <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-bold flex items-center gap-2">
                        <Heart className="w-5 h-5 text-rose-500" /> Các điểm đến được yêu thích
                    </h3>
                    <button
                        className="text-sm font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                    >
                        Xem tất cả <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                {wishlist.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {wishlist.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => fetchDetailLocation(item.id)}
                                className="flex gap-3 p-2 rounded-xl hover:bg-[var(--bg-paper)] transition cursor-pointer"
                            >
                                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold truncate">{item.name}</h4>
                                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3" /> {item.provinces?.name}
                                    </p>

                                    <div className="flex items-center gap-2 mt-2">
                                        <StarRating rating={item.rating || 0} size="w-4 h-4" />
                                        <span className="text-sm text-gray-500 font-medium">{item.rating} / 5.0</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-[var(--text-muted)]">
                        <Heart className="w-8 h-8 mx-auto opacity-30 mb-2" />
                        <p className="text-sm">Chưa có điểm yêu thích. Hãy thêm ngay!</p>
                    </div>
                )}
                <button
                    onClick={() => setIsAiModalOpen(true)}
                    className="mt-4 w-full py-2.5 rounded-xl bg-rose-500/10 text-rose-500 text-sm font-bold hover:bg-rose-500 hover:text-white transition flex items-center justify-center gap-2"
                >
                    <Sparkles className="w-4 h-4" /> Gợi ý điểm đến bằng AI
                </button>
            </div>
            <AnimatePresence>
                {selectedLocation && (
                    <LocationDetailModal
                        location={selectedLocation}
                        onClose={() => setSelectedLocation(null)}
                        onSave={() => {
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    )
}