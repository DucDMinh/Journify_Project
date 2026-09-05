/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    ChevronRight,
    Clock,
    X,
    Award,
    Edit3,
} from "lucide-react";
import { Toaster, toast } from 'sonner';
import confetti from "canvas-confetti";
import { Itinerary, Location, User } from "@/interface";
import { api } from "@/lib/apiClient";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "@/hooks/auth/AuthContext";
import { UserBanner } from "@/components/user/HomePage/UserBanner";
import { TrendingItinerary } from "@/components/user/HomePage/TrendingItinerary";
import { TripDetailModal2 } from "@/components/modals/user/TripDetailModal2";
import { RegionExplore } from "@/components/user/HomePage/RegionExplore";
import { WishlistPreview } from "@/components/user/HomePage/WishlistPreview";
import { useDashboard } from "@/app/user/(dashboard)/layout";
import { useRouter } from "next/navigation";
import { PremiumModal } from "@/components/payment/PremiumModal";
import { AiPlannerModal } from "@/components/modals/user/AiPlannerModal";

interface BlogTip {
    title: string;
    image: string;
    tag: string;
    readTime: string;
}

const BLOG_TIPS: BlogTip[] = [
    {
        title: "Cẩm nang du lịch Phú Quốc tự túc 2026",
        image: "https://th.bing.com/th/id/OIP.MjQAAJKlLLdOlutUnQ2-3gHaDX?w=340&h=158&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
        tag: "Biển đảo",
        readTime: "5 phút",
    },
    {
        title: "8 quán cà phê check-in đẹp nhất Đà Lạt",
        image: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600&auto=format&fit=crop",
        tag: "Sống ảo",
        readTime: "4 phút",
    },
    {
        title: "Kinh nghiệm trekking Tà Xùa mùa lúa chín",
        image: "https://th.bing.com/th/id/OIP.wM-U8STHJsovy78owSGWXwHaD4?w=344&h=181&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
        tag: "Trekking",
        readTime: "7 phút",
    },
];
function triggerConfetti() {
    confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#FF5A36", "#0EA5E9", "#10B981", "#F59E0B"],
    });
}

export default function JournifyUserDashboard() {
    const [theme, setTheme] = useState<"day" | "night">("day");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeNav, setActiveNav] = useState("dashboard");
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [trendingItineraries, setTrendingItineraries] = useState<Itinerary[]>([]);
    const [wishlist, setWishlist] = useState<Location[]>([]);
    const [activeTripDetail, setActiveTripDetail] = useState<Itinerary | null>(null);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [isCreatingTrip, setIsCreatingTrip] = useState(false);
    const router = useRouter();
    const { notify } = useDashboard();
    const { user: currentUser } = useAuth();
    useEffect(() => {
        let currentToastId: string | undefined;

        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return null;
        };

        const errorCookie = getCookie('toast_error');
        const clearStorageCookie = getCookie('clear_storage');

        if (clearStorageCookie || errorCookie) {
            localStorage.removeItem('userData');
            document.cookie = "clear_storage=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }

        if (errorCookie) {
            toast.error(
                errorCookie === "TOKEN_EXPIRED"
                    ? "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!"
                    : "Vui lòng đăng nhập để tiếp tục."
            );
            document.cookie = "toast_error=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }

        return;
    }, []);
    const fetchItineraries = async () => {
        try {
            const { data, response } = await api.get('/itineraries?trending=weekly');
            if (!response.ok) throw new Error(data.message || "Lỗi khi lấy dữ liệu");
            const itineraries_data: Itinerary[] = data?.data?.data || data?.data || data || [];
            setItineraries(itineraries_data);
            const trending = itineraries_data.filter(i => i.share).slice(0, 3);
            setTrendingItineraries(trending.length > 0 ? trending : itineraries_data.slice(0, 5));
        } catch (error: any) {
            notify(error.message || "Không thể tải dữ liệu", "⚠️");
        }
    };
    const fetchFavLocations = async () => {
        try {
            const { data, response } = await api.get('/locations?trending=true&limit=4');
            if (!response.ok) throw new Error(data.message || "Lỗi khi lấy dữ liệu");
            const favor_locations: Location[] = data?.data?.data || data?.data || data || [];
            setWishlist(favor_locations);
        } catch (error: any) {
            notify(error.message || "Không thể tải dữ liệu", "⚠️");
        }
    }

    useEffect(() => {
        fetchItineraries();
        fetchFavLocations()
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle("theme-night", theme === "night");
    }, [theme]);

    const handleCloneTrip = async (iti: Itinerary) => {
        const toastId = toast.loading("Đang clone...");
        try {
            const { data: responseData, response: full_response } = await api.get(`/itineraries/${iti.id}`);
            if (!full_response.ok) throw new Error(responseData.message || "Lỗi khi lấy dữ liệu lộ trình");
            const full_iti = responseData.data.data || responseData;
            const {
                id,
                created_at,
                user_id,
                ...restItinerary
            } = full_iti;
            const cleanDays = restItinerary.itinerary_days?.map((day: any) => {
                const { id, itinerary_id, ...restDay } = day;
                const cleanLocations = restDay.itinerary_locations?.map((loc: any) => {
                    const { id, itinerary_day_id, ...restLoc } = loc;
                    return restLoc;
                });
                return { ...restDay, itinerary_locations: cleanLocations };
            });
            const payload = {
                ...restItinerary,
                itinerary_days: cleanDays,
                title: `Bản sao - ${full_iti.title}`,
                share: false,
                user_id: currentUser?.id || "",
                cloned_from_id: full_iti.id
            };
            const { data, response } = await api.post(`/itineraries`, payload);
            if (!response.ok) throw new Error(data.message || "Lỗi khi clone lộ trình");
            toast.success(`Đã lưu "${full_iti.title}" vào sổ tay!`, { id: toastId });
            triggerConfetti();
        } catch (err: any) {
            console.error("Lỗi clone:", err);
            toast.error(err.message || "Có lỗi xảy ra khi clone lộ trình", { id: toastId });
        }
    };

    const handleViewDetailItinerary = async (id: string) => {
        const toastId = toast.loading("...");
        try {
            const { data, response } = await api.get(`/itineraries/${id}`)
            if (!response.ok) throw new Error(data.message || "Lỗi khi lấy dữ liệu lộ trình");
            setActiveTripDetail(data.data.data)
            toast.success("ok", { id: toastId })
        } catch (err: any) {
            console.error("Lỗi clone:", err);
            toast.error(err.message || "Có lỗi xảy ra khi clone lộ trình", { id: toastId });
        }
    }
    const personalStats = useMemo(() => {
        return {
            totalTrips: itineraries.length,
            totalWishlist: wishlist.length,
            totalCloned: itineraries.filter(i => i.title.includes("Bản sao")).length,
            totalPlaces: itineraries.reduce((acc, i) => acc + (i.itinerary_days?.reduce((a, d) => a + d.itinerary_locations.length, 0) || 0), 0),
        };
    }, [itineraries, wishlist]);

    return (
        <div className="min-h-screen bg-[var(--bg-paper)] text-[var(--text-main)] transition-colors selection:bg-[var(--accent-primary)] selection:text-white">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-20 md:pb-10">
                {activeNav === "dashboard" && (
                    <div className="space-y-12 md:space-y-16">
                        <UserBanner
                            currentUser={currentUser}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            setIsAiModalOpen={setIsAiModalOpen}
                        />
                        <div>
                            <TrendingItinerary
                                trendingItineraries={trendingItineraries}
                                setActiveTripDetail={setActiveTripDetail}
                                handleViewDetailItinerary={handleViewDetailItinerary}
                                handleCloneTrip={handleCloneTrip}
                                setActiveNav={setActiveNav}
                            />
                        </div>
                        <RegionExplore />
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                                        <Edit3 className="w-6 h-6 text-purple-500" /> Bài viết & Mẹo du lịch
                                    </h2>
                                    <p className="text-sm text-[var(--text-muted)] mt-1">Cẩm nang bỏ túi cho chuyến đi của bạn</p>
                                </div>
                                <button
                                    onClick={() => notify("Chuyên mục Blog đang được xây dựng", "📝")}
                                    className="text-sm font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                                >
                                    Xem thêm <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {BLOG_TIPS.map((blog, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                                        onClick={() => notify(`Đọc bài: ${blog.title}`, "📖")}
                                    >
                                        <div className="relative h-44 overflow-hidden">
                                            <img src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
                                                {blog.tag}
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-bold text-base leading-snug line-clamp-2">{blog.title}</h4>
                                            <div className="flex items-center justify-between mt-3">
                                                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" /> {blog.readTime} đọc
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-[var(--accent-primary)]" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Thống kê cá nhân & Wishlist nhỏ */}
                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Thống kê nhẹ nhàng */}
                            <div className="lg:col-span-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
                                <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-[var(--accent-gold)]" /> Hành trình của bạn
                                </h3>
                                {currentUser ? (
                                    <>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-[var(--text-muted)]">Lộ trình đã lưu</span>
                                                <span className="font-bold text-lg">{personalStats.totalTrips}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-[var(--text-muted)]">Điểm yêu thích</span>
                                                <span className="font-bold text-lg">{personalStats.totalWishlist}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-[var(--text-muted)]">Đã clone</span>
                                                <span className="font-bold text-lg">{personalStats.totalCloned}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-[var(--text-muted)]">Địa điểm đã thêm</span>
                                                <span className="font-bold text-lg">{personalStats.totalPlaces}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => router.push('/MyItinerary')}
                                            className="mt-6 w-full py-2.5 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-sm font-bold hover:bg-[var(--accent-primary)] hover:text-white transition"
                                        >
                                            Quản lý lộ trình
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center py-6 text-[var(--text-muted)]">
                                        <Award className="w-8 h-8 mx-auto opacity-30 mb-2" />
                                        <p className="text-sm">Đăng nhập để xem thống kê cá nhân.</p>
                                    </div>
                                )}
                            </div>
                            <WishlistPreview wishlist={wishlist} setIsAiModalOpen={setIsAiModalOpen} />
                        </section>
                        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-gold)]/10 p-8 md:p-10 border border-[var(--border-color)] shadow-sm">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex-1">
                                    <h2 className="font-display text-2xl font-bold flex items-center gap-2 mb-2">
                                        <Sparkles className="w-6 h-6 text-[var(--accent-gold)]" /> Bạn chưa có ý tưởng?
                                    </h2>
                                    <p className="text-sm text-[var(--text-muted)] max-w-md">
                                        Hãy để AI tạo lộ trình cá nhân hóa dựa trên sở thích, ngân sách và thời gian của bạn chỉ trong vài giây.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsAiModalOpen(true)}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)] text-white font-bold shadow-lg hover:opacity-90 transition whitespace-nowrap"
                                >
                                    Tạo lộ trình với AI
                                </button>
                            </div>
                        </section>
                    </div>
                )}
            </main>
            <AnimatePresence>
                {isAiModalOpen && (
                    <AiPlannerModal
                        onClose={() => setIsAiModalOpen(false)}
                        onSuccess={(newTrip) => {
                        }}
                        onOpenPremium={() => setIsPaymentModalOpen(true)}
                        notify={notify}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isPaymentModalOpen && (
                    <PremiumModal
                        onClose={() => setIsPaymentModalOpen(false)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {activeTripDetail && (
                    <TripDetailModal2 currentUser={currentUser} itinerary={activeTripDetail} onClose={() => setActiveTripDetail(null)} onClone={() => handleCloneTrip(activeTripDetail)} />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isCreatingTrip && (
                    <CreateTripModal notify={notify} currentUser={currentUser} onClose={() => setIsCreatingTrip(false)} onSuccess={(trip) => { setItineraries([trip, ...itineraries]); setIsCreatingTrip(false); notify("Đã tạo lộ trình mới thành công!", "success"); }} />
                )}
            </AnimatePresence>
        </div>
    );
}

function CreateTripModal({ onClose, onSuccess, currentUser, notify }: { onClose: () => void; onSuccess: (trip: Itinerary) => void; currentUser: User | null; notify: (message: string, type: string) => void }) {
    const [title, setTitle] = useState("");
    const [destination, setDestination] = useState("");
    const [days, setDays] = useState(3);
    const [budget, setBudget] = useState(3000000);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [theme, setTheme] = useState("Khám phá");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !destination.trim()) { notify("Vui lòng điền đầy đủ thông tin", "⚠️"); return; }
        const newTrip: Itinerary = {
            id: `manual-${Date.now()}`, title, summary: `Lộ trình ${days} ngày tại ${destination}`, start_date: startDate?.toISOString() || new Date().toISOString(), end_date: startDate ? new Date(startDate.getTime() + days * 86400000).toISOString() : new Date(Date.now() + days * 86400000).toISOString(), theme: theme, days: days, nights: days - 1, estimated_cost: budget, image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop", share: false, user_id: {
                name: currentUser?.name ?? "", avatar: currentUser?.avatar ?? "", id: "", email: "", role: "USER", status: "active", created_at: "", itineraries: [], phone_number: 0,
                background_image: "",
                is_premium: false
            }, itinerary_provinces: [{ provinces: { name: destination, id: "" } }], itinerary_days: []
        };
        onSuccess(newTrip);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl z-10">
                <div className="flex items-center justify-between mb-5"><h3 className="font-display text-xl font-bold">Tạo lộ trình mới</h3><button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--bg-paper)] text-[var(--text-muted)]"><X className="w-5 h-5" /></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Tên lộ trình *</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-sm outline-none focus:border-[var(--accent-primary)]" required /></div>
                    <div><label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Điểm đến *</label><input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full p-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-sm outline-none focus:border-[var(--accent-primary)]" required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Số ngày</label><input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full p-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-sm outline-none focus:border-[var(--accent-primary)]" /></div>
                        <div><label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Ngân sách (VNĐ)</label><input type="number" min={0} step={100000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full p-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-sm outline-none focus:border-[var(--accent-primary)]" /></div>
                    </div>
                    <div><label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Ngày bắt đầu</label><DatePicker selected={startDate} onChange={(date: React.SetStateAction<Date | null>) => setStartDate(date)} className="w-full p-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-sm outline-none focus:border-[var(--accent-primary)]" dateFormat="dd/MM/yyyy" /></div>
                    <div><label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Chủ đề</label><select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full p-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-sm outline-none focus:border-[var(--accent-primary)]"><option value="Khám phá">🏔️ Khám phá</option><option value="Nghỉ dưỡng">🏖️ Nghỉ dưỡng</option><option value="Ẩm thực">🍴 Ẩm thực</option><option value="Văn hóa">🏛️ Văn hóa</option></select></div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]"><button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-paper)] transition">Hủy</button><button type="submit" className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-bold shadow-md hover:opacity-90 transition">Tạo lộ trình</button></div>
                </form>
            </motion.div>
        </div>
    );
}