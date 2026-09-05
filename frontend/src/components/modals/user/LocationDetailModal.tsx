/* eslint-disable @next/next/no-img-element */
import React from "react";
import { motion, Variants } from "framer-motion";
import {
    X,
    MapPin,
    Star,
    BookmarkPlus,
    Mountain,
    Info,
    Map,
    Navigation2,
    Compass,
    ExternalLink,
    CalendarCheck
} from "lucide-react";
import { Location } from "@/interface";

interface LocationDetailModalProps {
    location: Location;
    onClose: () => void;
    onSave?: (id: string) => void;
}

export default function LocationDetailModal({ location, onClose }: LocationDetailModalProps) {
    const fallbackImg = "https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=800&auto=format&fit=crop";
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-5xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[32px] shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row max-h-[85vh]"
            >
                <div className="md:w-5/12 relative h-72 md:h-auto shrink-0 group">
                    <img
                        src={location.img || fallbackImg}
                        alt={location.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                    <button
                        onClick={onClose}
                        className="md:hidden absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-rose-500 transition-colors border border-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-4">
                        <div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {location.rating && (
                                    <span className="bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                        {location.rating} / 5.0
                                    </span>
                                )}
                                <span className="bg-[var(--accent-primary)]/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {location.provinces?.name || "Việt Nam"}
                                </span>
                            </div>
                            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white drop-shadow-lg leading-tight line-clamp-3">
                                {location.name}
                            </h2>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-paper)]">
                    <div className="hidden md:flex items-center justify-between p-4 px-6 border-b border-[var(--border-color)] bg-[var(--bg-card)] shrink-0 z-10 shadow-sm">
                        <span className="text-sm font-bold text-[var(--text-muted)] flex items-center gap-2">
                            <Compass className="w-4 h-4 text-[var(--accent-primary)]" /> Khám phá địa điểm
                        </span>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-[var(--bg-bento)] text-[var(--text-muted)] hover:text-red-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 sm:p-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[var(--border-color)] hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                            <motion.div variants={itemVariants} className="flex gap-4">
                                <div className="flex-1 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                        <BookmarkPlus className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Lượt lưu</p>
                                        <p className="font-display font-bold text-lg text-[var(--text-main)]">{location.saved_count || 0}</p>
                                    </div>
                                </div>
                                {location.difficulty_level && (
                                    <div className="flex-1 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                                            <Mountain className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Độ khó</p>
                                            <p className="font-display font-bold text-lg text-[var(--text-main)] truncate" title={location.difficulty_level}>
                                                {location.difficulty_level}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                            <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-[var(--accent-primary)]" /> Giới thiệu
                                </h3>
                                <p className="text-sm text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">
                                    {location.description || "Chưa có thông tin mô tả chi tiết cho địa điểm này."}
                                </p>
                            </motion.div>
                            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(location.lat && location.lng) ? (
                                    <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:border-[var(--accent-primary)]/50 transition-colors group flex flex-col justify-between">
                                        <div>
                                            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center mb-3">
                                                <Navigation2 className="w-4 h-4" />
                                            </div>
                                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Tọa độ GPS</p>
                                            <p className="text-sm font-mono font-medium mt-1 text-[var(--text-main)]">
                                                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                            </p>
                                        </div>
                                        <a
                                            href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-4 pt-3 border-t border-[var(--border-color)] text-xs font-bold text-[var(--accent-primary)] flex items-center gap-1.5 group-hover:underline"
                                        >
                                            Mở Google Maps <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                ) : (
                                    <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] shadow-sm flex flex-col justify-center items-center text-center opacity-70">
                                        <div className="w-10 h-10 rounded-full bg-[var(--bg-bento)] text-[var(--text-muted)] flex items-center justify-center mb-2">
                                            <Map className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Bản đồ</p>
                                        <p className="text-sm mt-1 text-[var(--text-muted)]">Chưa có tọa độ chính xác</p>
                                    </div>
                                )}

                                {/* 2. Ô Đặt phòng (TÍCH HỢP MỚI) */}
                                <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:border-indigo-500/50 transition-colors group flex flex-col justify-between">
                                    <div>
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                                            <CalendarCheck className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Lưu trú & Dịch vụ</p>
                                        <p className="text-sm font-medium mt-1 text-[var(--text-main)]">
                                            Tìm khách sạn hoặc vé tham quan gần khu vực này.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center gap-4">
                                        <a
                                            href={`https://www.traveloka.com/vi-vn/search?q=${encodeURIComponent(location.name)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 group-hover:underline"
                                        >
                                            Traveloka <ExternalLink className="w-3 h-3" />
                                        </a>
                                        <a
                                            href={`https://www.booking.com/searchresults.vi.html?ss=${encodeURIComponent(location.name)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline"
                                        >
                                            Booking.com <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                                {location.note && (
                                    <div className="sm:col-span-2 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 shadow-sm flex flex-col">
                                        <div className="w-8 h-8 rounded-lg bg-amber-200 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-3">
                                            <Info className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs font-bold text-amber-800/60 dark:text-amber-500/60 uppercase tracking-wider">Lưu ý thêm</p>
                                        <p className="text-sm font-medium mt-1 leading-relaxed text-amber-900 dark:text-amber-200">
                                            {location.note}
                                        </p>
                                    </div>
                                )}
                            </motion.div>

                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}