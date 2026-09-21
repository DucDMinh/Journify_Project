/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, MapPin, Wallet,
    SlidersHorizontal, ChevronRight, Heart,
    TrendingUp, Compass, UserCircle
} from "lucide-react";
import { Itinerary } from "@/interface";
import { toast } from 'sonner';
import { api } from "@/lib/apiClient"; // Nhớ import hàm api của bạn

const THEMES = ["Biển đảo", "Núi rừng", "Văn hóa", "Cắm trại", "Chữa lành"];
const PRICE_RANGES = [
    { id: "all", label: "Tất cả mức giá" },
    { id: "low", label: "Dưới 2 triệu" },
    { id: "mid", label: "2 - 5 triệu" },
    { id: "high", label: "Trên 5 triệu" }
];

export default function ExploreItinerariesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState("all");
    const [selectedProvince, setSelectedProvince] = useState("all"); // State mới cho tỉnh thành
    const [savedTrips, setSavedTrips] = useState<string[]>([]);
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const handleThemeToggle = (theme: string) => {
        setSelectedThemes(prev =>
            prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
        );
    };

    const fetchItineraries = async () => {
        setIsLoading(true);
        try {
            const { data, response } = await api.get('/itineraries');
            if (!response.ok) throw new Error(data.message || "Lỗi khi lấy thông tin lộ trình!");
            setItineraries(data?.data || data?.data?.data || []);
        } catch (error: any) {
            toast.error(`Không thể tải dữ liệu: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItineraries();
    }, []);

    const toggleSave = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSavedTrips(prev =>
            prev.includes(id) ? prev.filter(tripId => tripId !== id) : [...prev, id]
        );
    };
    const availableProvinces = useMemo(() => {
        const provs = new Set<string>();
        itineraries.forEach(trip => {
            trip.itinerary_provinces?.forEach(p => {
                if (p.provinces?.name) provs.add(p.provinces.name);
            });
        });
        return Array.from(provs).sort();
    }, [itineraries]);
    const filteredTrips = useMemo(() => {
        return itineraries.filter(trip => {
            const matchSearch = trip.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchTheme = selectedThemes.length === 0 || selectedThemes.includes(trip.theme);
            const matchProvince = selectedProvince === "all" ||
                trip.itinerary_provinces?.some(p => p.provinces?.name === selectedProvince);
            let matchPrice = true;
            const cost = Number(trip.estimated_cost) || 0;
            if (priceRange === "low") matchPrice = cost < 2000000;
            if (priceRange === "mid") matchPrice = cost >= 2000000 && cost <= 5000000;
            if (priceRange === "high") matchPrice = cost > 5000000;

            return matchSearch && matchTheme && matchPrice && matchProvince;
        });
    }, [searchQuery, selectedThemes, priceRange, selectedProvince, itineraries]);

    return (
        <div className="min-h-screen bg-[var(--bg-paper)] font-sans pb-20">
            <div className="relative h-[280px] flex items-center justify-center px-4 sm:px-6 lg:px-8 rounded-b-[32px] overflow-hidden shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)]"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute inset-0 bg-black/20"></div>

                <div className="relative z-10 w-full max-w-4xl text-center mt-[-20px]">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-3xl md:text-4xl font-display font-extrabold text-white mb-3 drop-shadow-md">
                            Bắt đầu hành trình của bạn
                        </h1>
                        <p className="text-white/90 text-base md:text-lg font-medium mb-6 drop-shadow">
                            Khám phá hàng ngàn lộ trình được chia sẻ từ cộng đồng đam mê xê dịch
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="absolute left-4 right-4 md:left-0 md:right-0 -bottom-12 bg-[var(--bg-card)] p-2 md:p-3 rounded-[1.5rem] shadow-xl border border-[var(--border-color)] flex flex-col md:flex-row gap-2.5 max-w-3xl mx-auto"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Bạn muốn đi đâu? (VD: Đà Lạt, Sapa...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-paper)] border border-transparent focus:border-[var(--accent-primary)] outline-none transition-all text-[var(--text-main)] font-medium text-base placeholder:text-[var(--text-muted)]"
                            />
                        </div>
                        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)] text-white font-bold hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2 text-base shrink-0">
                            <Compass className="w-4 h-4" /> Tìm kiếm
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* MAIN LAYOUT */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 flex flex-col lg:flex-row gap-8">

                {/* SIDEBAR FILTER */}
                <aside className="w-full lg:w-72 shrink-0">
                    <div className="sticky top-24 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-8">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-[var(--accent-primary)]" />
                                <h3 className="font-bold text-lg text-[var(--text-main)]">Bộ lọc</h3>
                            </div>

                            {/* NÚT XÓA LỌC */}
                            {(selectedThemes.length > 0 || priceRange !== 'all' || selectedProvince !== 'all') && (
                                <button
                                    onClick={() => { setSelectedThemes([]); setPriceRange('all'); setSelectedProvince('all') }}
                                    className="text-sm text-[var(--accent-primary)] font-medium hover:underline"
                                >
                                    Xóa lọc
                                </button>
                            )}
                        </div>

                        {/* 🌟 FILTER MỚI: TỈNH THÀNH */}
                        <div>
                            <h4 className="font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[var(--text-muted)]" /> Điểm đến
                            </h4>
                            <select
                                value={selectedProvince}
                                onChange={(e) => setSelectedProvince(e.target.value)}
                                className="w-full bg-[var(--bg-paper)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-bold py-3 px-4 rounded-xl outline-none cursor-pointer focus:border-[var(--accent-primary)] transition-colors appearance-none"
                            >
                                <option value="all">Tất cả điểm đến</option>
                                {availableProvinces.map(prov => (
                                    <option key={prov} value={prov}>{prov}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filter: Chủ đề */}
                        <div>
                            <h4 className="font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" /> Phong cách
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {THEMES.map(theme => (
                                    <button
                                        key={theme}
                                        onClick={() => handleThemeToggle(theme)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${selectedThemes.includes(theme)
                                            ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white shadow-md'
                                            : 'bg-[var(--bg-paper)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
                                            }`}
                                    >
                                        {theme}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filter: Mức giá */}
                        <div>
                            <h4 className="font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-[var(--text-muted)]" /> Ngân sách dự kiến
                            </h4>
                            <div className="space-y-3">
                                {PRICE_RANGES.map(range => (
                                    <label
                                        key={range.id}
                                        onClick={() => setPriceRange(range.id)} // 🌟 ĐÃ FIX LỖI THIẾU ONCLICK Ở ĐÂY
                                        className="flex items-center gap-3 cursor-pointer group"
                                    >
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${priceRange === range.id
                                            ? 'border-[var(--accent-primary)]'
                                            : 'border-[var(--text-muted)] group-hover:border-[var(--accent-primary)]'
                                            }`}>
                                            {priceRange === range.id && <div className="w-2.5 h-2.5 bg-[var(--accent-primary)] rounded-full" />}
                                        </div>
                                        <span className={`text-sm font-medium ${priceRange === range.id ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                                            {range.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* DANH SÁCH LỘ TRÌNH (HORIZONTAL CARDS) */}
                <main className="flex-1">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-[var(--text-muted)] font-medium">
                            Tìm thấy <span className="text-[var(--accent-primary)] font-bold text-lg">{filteredTrips.length}</span> lộ trình
                        </p>
                        <select className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-bold py-2.5 px-4 rounded-xl outline-none cursor-pointer focus:border-[var(--accent-primary)] appearance-none">
                            <option>Đề xuất cho bạn</option>
                            <option>Đánh giá cao nhất</option>
                            <option>Mới nhất</option>
                        </select>
                    </div>

                    <div className="space-y-6">
                        {isLoading ? (
                            // Loading Skeleton
                            [1, 2, 3].map(n => (
                                <div key={n} className="h-64 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] animate-pulse"></div>
                            ))
                        ) : (
                            <AnimatePresence>
                                {filteredTrips.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="text-center py-24 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]"
                                    >
                                        <Compass className="w-16 h-16 text-[var(--text-muted)] opacity-30 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">Không tìm thấy lộ trình</h3>
                                        <p className="text-[var(--text-muted)]">Thử thay đổi từ khóa hoặc bộ lọc để xem thêm kết quả nhé.</p>
                                    </motion.div>
                                ) : (
                                    filteredTrips.map((trip, index) => {
                                        // Bóc tách địa điểm
                                        const provincesText = trip.itinerary_provinces && trip.itinerary_provinces.length > 0
                                            ? trip.itinerary_provinces.map(p => p.provinces?.name).filter(Boolean).join(", ")
                                            : "Chưa xác định điểm đến";

                                        // Bóc tách tác giả
                                        const authorName = trip.user_id?.name || "Người dùng ẩn danh";

                                        return (
                                            <motion.div
                                                key={trip.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                                className="group flex flex-col md:flex-row bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                                            >
                                                {/* IMAGE SECTION */}
                                                <div className="md:w-80 h-64 md:h-auto relative overflow-hidden shrink-0 bg-gray-200">
                                                    <img
                                                        src={trip.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'}
                                                        alt={trip.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent"></div>

                                                    <button
                                                        onClick={(e) => toggleSave(trip.id, e)}
                                                        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/30 backdrop-blur-md hover:bg-[var(--accent-primary)] transition-colors z-10"
                                                    >
                                                        <Heart className={`w-5 h-5 ${savedTrips.includes(trip.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                                                    </button>

                                                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-sm text-xs font-bold text-gray-900 shadow-sm flex items-center gap-1.5">
                                                        <Compass className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> {trip.theme}
                                                    </div>
                                                </div>

                                                {/* CONTENT SECTION */}
                                                <div className="p-6 md:p-7 flex flex-col flex-1">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                                                <MapPin className="w-3.5 h-3.5" /> {provincesText}
                                                            </div>
                                                            <h3 className="text-2xl font-bold text-[var(--text-main)] line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
                                                                {trip.title}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    <p className="text-[var(--text-muted)] text-sm line-clamp-2 mb-4 leading-relaxed">
                                                        {trip.summary}
                                                    </p>

                                                    {/* Footer Card */}
                                                    <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between pt-5 border-t border-[var(--border-color)] gap-4">

                                                        {/* Author Info */}
                                                        <div className="flex items-center gap-3">
                                                            {trip.user_id?.avatar ? (
                                                                <img src={trip.user_id.avatar} alt="Author" className="w-8 h-8 rounded-full object-cover border border-[var(--border-color)]" />
                                                            ) : (
                                                                <UserCircle className="w-8 h-8 text-[var(--text-muted)]" />
                                                            )}
                                                            <span className="text-sm font-bold text-[var(--text-main)]">{authorName}</span>
                                                        </div>

                                                        {/* Stats & Button */}
                                                        <div className="flex items-center gap-4 justify-between sm:justify-end w-full sm:w-auto">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Thời gian</span>
                                                                    <span className="text-sm font-bold text-[var(--text-main)]">{trip.days || 0} Ngày</span>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Chi phí</span>
                                                                    <span className="text-sm font-bold text-[var(--accent-primary)]">
                                                                        ~{trip.estimated_cost?.toLocaleString('vi-VN')}đ
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <button className="hidden sm:flex items-center justify-center w-10 h-10 bg-[var(--bg-paper)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl group-hover:bg-[var(--accent-primary)] group-hover:text-white group-hover:border-[var(--accent-primary)] transition-colors ml-2">
                                                                <ChevronRight className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}