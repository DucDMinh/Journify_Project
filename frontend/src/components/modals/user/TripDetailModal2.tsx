/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { Itinerary, Itinerary_days, Itinerary_locations, User } from "@/interface";
import { BookmarkPlus, CheckCircle2, Circle, Compass, Luggage, MapPin, Share2, X, Navigation, Map } from "lucide-react";
import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { useDashboard } from "@/app/user/(dashboard)/layout";
import dynamic from "next/dynamic";

const RouteMapViewer = dynamic(() => import("@/components/admin/itineraries/builder/RouteMapViewer"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gray-900 text-sm text-gray-400">
            <Compass className="h-8 w-8 animate-spin text-brand-400 mb-3" />
            <span className="font-medium tracking-wider text-xs uppercase text-gray-400">Đang vẽ đường đi...</span>
        </div>
    ),
});

export const TripDetailModal2 = ({ itinerary, onClose, onClone, currentUser }: { itinerary: Itinerary; onClose: () => void; onClone: () => void, currentUser: User | null }) => {
    const [activeTab, setActiveTab] = useState<"itinerary" | "checklist" | "map">("itinerary");
    const destination = itinerary.itinerary_provinces?.map(ip => ip.provinces?.name).join(" - ") || "Việt Nam";

    const defaultChecklist = [
        { item: "Căn cước công dân / Hộ chiếu", checked: true },
        { item: "Quần áo phù hợp theo thời tiết", checked: false },
        { item: "Sạc dự phòng & dây cáp", checked: false },
        { item: "Đồ dùng cá nhân", checked: false }
    ];

    const { notify } = useDashboard();
    const [checklist, setChecklist] = useState(defaultChecklist);

    const toggleCheck = (idx: number) => {
        setChecklist((prev) => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
    };
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };
    const itemVariants: Variants = {
        hidden: { opacity: 0, x: -20 },
        show: {
            opacity: 1,
            x: 0,
            transition: { type: "spring", stiffness: 300, damping: 24 }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />

            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-5xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[32px] shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row max-h-[85vh]">
                <div className="md:w-5/12 bg-[var(--bg-bento)] p-6 sm:p-8 flex flex-col border-b md:border-b-0 md:border-r border-[var(--border-color)] relative overflow-hidden">
                    <div className="flex-1 overflow-y-auto pr-2 -mr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[var(--border-color)] hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full pb-2">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] font-display bg-[var(--bg-card)] px-3 py-1 rounded-full border border-[var(--border-color)] shadow-sm">
                                {itinerary.days || 1} Ngày Trải Nghiệm
                            </span>
                            <button onClick={onClose} className="md:hidden p-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden shadow-md mb-6 border border-[var(--border-color)] shrink-0">
                            <img src={itinerary.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800'} alt={itinerary.title} className="w-full h-full object-cover" />
                            <WashiTape color="var(--washi-coral)" className="top-3 left-3 w-24 -rotate-6" />
                        </div>
                        <h2
                            className="font-display text-2xl font-bold leading-snug line-clamp-3"
                            title={itinerary.title}
                        >
                            {itinerary.title}
                        </h2>

                        <p className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-1.5 mt-3">
                            <MapPin className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                            <span className="line-clamp-2">{destination}</span>
                        </p>

                        <div className="mt-6 space-y-3 pt-6 border-t border-[var(--border-color)] text-sm font-medium">
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-[var(--text-muted)] shrink-0">Ngân sách dự kiến:</span>
                                <span className="text-[var(--accent-gold)] font-bold bg-[var(--accent-gold)]/10 px-2.5 py-1 rounded-lg text-right">
                                    {itinerary.estimated_cost ? itinerary.estimated_cost.toLocaleString('vi-VN') + " đ" : "Tự túc"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-[var(--text-muted)] shrink-0">Tác giả lộ trình:</span>
                                <span className="font-semibold text-right truncate">
                                    {itinerary.user_id?.name || currentUser?.name || "Ẩn danh"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 flex gap-3 shrink-0 bg-[var(--bg-bento)]">
                        <button onClick={() => { onClone(); onClose(); }} className="flex-1 py-3.5 rounded-xl bg-[var(--accent-primary)] text-white font-bold text-sm shadow-[0_4px_12px_rgba(var(--accent-primary-rgb),0.3)] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                            <BookmarkPlus className="w-4 h-4" /> Lưu vào sổ tay
                        </button>
                        <button onClick={() => notify("Đã sao chép liên kết chia sẻ lộ trình!", "🔗")} className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-colors shadow-sm" title="Chia sẻ">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-paper)]">
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-color)] bg-[var(--bg-card)] z-10 shadow-sm">
                        <div className="flex gap-2">
                            <button onClick={() => setActiveTab("itinerary")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "itinerary" ? "bg-[var(--accent-primary)] text-white shadow-md" : "bg-[var(--bg-paper)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-bento)]"}`}>
                                <Map className="w-4 h-4" /> Lịch trình
                            </button>
                            <button onClick={() => setActiveTab("checklist")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "checklist" ? "bg-[var(--accent-primary)] text-white shadow-md" : "bg-[var(--bg-paper)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-bento)]"}`}>
                                <Luggage className="w-4 h-4" /> Hành trang
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === "checklist" ? "bg-white/20" : "bg-[var(--border-color)]"}`}>
                                    {checklist.filter((c) => c.checked).length}/{checklist.length}
                                </span>
                            </button>
                            <button onClick={() => setActiveTab("map")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "map" ? "bg-[var(--accent-primary)] text-white shadow-md" : "bg-[var(--bg-paper)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-bento)]"}`}>
                                <MapPin className="w-4 h-4" /> Xem lộ trình
                            </button>
                        </div>
                        <button onClick={onClose} className="hidden md:flex p-2.5 rounded-full hover:bg-[var(--bg-bento)] text-[var(--text-muted)] hover:text-red-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                        {activeTab === "itinerary" && (
                            itinerary.itinerary_days && itinerary.itinerary_days.length > 0 ? (
                                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10">
                                    {itinerary.itinerary_days.map((plan: Itinerary_days) => (
                                        <div key={plan.id} className="relative">
                                            <div className="flex items-center gap-3 mb-6 sticky top-0 bg-[var(--bg-paper)]/90 backdrop-blur-sm py-2 z-10 rounded-lg">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-gold)] text-white font-display font-bold text-sm flex items-center justify-center shadow-md">
                                                    D{plan.day_number}
                                                </div>
                                                <h4 className="font-display font-bold text-lg text-[var(--text-main)]">
                                                    {plan.title || `Ngày ${plan.day_number}`}
                                                </h4>
                                            </div>
                                            <div className="mt-2 space-y-0">
                                                {plan.itinerary_locations.length > 0 ? (
                                                    plan.itinerary_locations.map((loc: Itinerary_locations, index: number) => (
                                                        <motion.div variants={itemVariants} key={loc.id} className="flex gap-4 sm:gap-6 group">
                                                            <div className="flex flex-col items-center min-w-[24px]">
                                                                <div className="w-4 h-4 rounded-full bg-[var(--bg-card)] border-[3px] border-[var(--accent-primary)] z-10 group-hover:scale-125 group-hover:bg-[var(--accent-primary)] transition-all duration-300 shadow-sm mt-1" />
                                                                {index !== plan.itinerary_locations.length - 1 && (
                                                                    <div className="flex-1 w-0 border-l-[2.5px] border-dashed border-[var(--border-color)] group-hover:border-[var(--accent-primary)]/50 transition-colors my-2 min-h-[3rem]" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 pb-8">
                                                                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-[var(--accent-primary)]/40 transition-all">
                                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                                                        <h5 className="font-bold text-base flex items-center gap-2 group-hover:text-[var(--accent-primary)] transition-colors">
                                                                            <Navigation className="w-4 h-4 text-[var(--accent-gold)]" />
                                                                            {loc.location_name}
                                                                        </h5>
                                                                        <span className="inline-flex items-center text-xs font-bold bg-[var(--bg-bento)] text-[var(--text-muted)] px-2.5 py-1 rounded-md shrink-0 border border-[var(--border-color)]">
                                                                            {loc.start_time.slice(0, 5)} {loc.end_time ? ` - ${loc.end_time.slice(0, 5)}` : ''}
                                                                        </span>
                                                                    </div>
                                                                    {loc.activity_note && (
                                                                        <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-2.5 pl-6 border-l-2 border-[var(--border-color)]">
                                                                            {loc.activity_note}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                        </motion.div>
                                                    ))
                                                ) : (
                                                    <div className="pl-12 pb-4">
                                                        <p className="text-sm text-[var(--text-muted)] italic">Chưa thêm hoạt động nào cho ngày này.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-[var(--text-muted)]">
                                    <div className="w-16 h-16 rounded-full bg-[var(--bg-bento)] flex items-center justify-center mb-4">
                                        <Compass className="w-8 h-8 opacity-50 animate-spin-slow text-[var(--accent-primary)]" />
                                    </div>
                                    <h4 className="font-bold text-lg text-[var(--text-main)] mb-1">Đang xây dựng lộ trình</h4>
                                    <p className="text-sm">Chi tiết các địa điểm sẽ sớm được cập nhật...</p>
                                </div>
                            )
                        )}
                        {activeTab === "checklist" && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                <p className="font-medium text-sm text-[var(--text-muted)] mb-5 bg-[var(--bg-bento)] p-3 rounded-xl border border-[var(--border-color)] flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-[var(--accent-primary)]" />
                                    Chạm vào từng món đồ để đánh dấu đã chuẩn bị
                                </p>
                                {checklist.map((item, idx) => (
                                    <div key={idx} onClick={() => toggleCheck(idx)} className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between text-sm font-semibold shadow-sm hover:shadow-md ${item.checked ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 opacity-70" : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--accent-primary)]/50"}`}>
                                        <span className={`${item.checked ? "line-through decoration-emerald-500/50 decoration-2" : ""}`}>{item.item}</span>
                                        <motion.div whileTap={{ scale: 0.8 }}>
                                            {item.checked ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <Circle className="w-5 h-5 text-[var(--border-color)] shrink-0" />}
                                        </motion.div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                        {activeTab === "map" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative w-full h-[60vh] sm:h-[500px] md:h-full min-h-[400px] rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-sm bg-[var(--bg-card)]"
                            >
                                <RouteMapViewer days={itinerary.itinerary_days} />
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function WashiTape({
    color = "var(--washi-teal)",
    className = "",
    style = {},
}: {
    color?: string;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className={`washi-tape z-10 ${className}`}
            style={{
                ...style,
                ["--washi-color" as any]: color,
            }}
        />
    );
}