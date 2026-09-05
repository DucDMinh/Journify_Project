/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @next/next/no-img-element */
import { Itinerary } from "@/interface";
import { motion } from "framer-motion";
import {
    Calendar,
    MapPin,
    Clock,
    PlaneTakeoff,
    Archive,
    Pencil,
    Trash2,
    Share2,
    Lock
} from "lucide-react";
import { toast } from 'sonner';
function WashiTape({ color = "var(--washi-teal)", className = "" }: { color?: string; className?: string }) {
    return (
        <div className={`washi-tape z-10 ${className}`} style={{ ["--washi-color" as any]: color }} />
    );
}
export function MyItineraryCard({
    itinerary,
    index,
    onDelete,
    onOpen
}: {
    itinerary: Itinerary;
    index: number;
    onDelete: () => void;
    onOpen: () => void;
}) {
    const tilts = [-2, 1.5, -1, 2, -1.5, 1];
    const defaultRotate = tilts[index % tilts.length];
    const washiColors = ["var(--washi-teal)", "var(--washi-coral)", "var(--washi-yellow)"];
    const washiColor = washiColors[index % washiColors.length];

    const isUpcoming = new Date(itinerary.start_date) >= new Date();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, rotate: defaultRotate }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{
                rotate: 0,
                y: -8,
                scale: 1.02,
                transition: { type: "spring", stiffness: 300, damping: 20 },
            }}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-[24px] shadow-sm hover:shadow-[var(--shadow-float)] transition-all flex flex-col justify-between relative group"
        >
            <WashiTape color={washiColor} className="top-[-8px] left-1/2 -translate-x-1/2 w-28 -rotate-2" />
            <div className="absolute -top-3 -left-3 z-20 w-9 h-9 rounded-2xl flex items-center justify-center shadow-md rotate-[-10deg] border border-[var(--border-color)] bg-[var(--bg-card)]">
                {itinerary.share ? (
                    <Share2 className="w-4 h-4 text-[var(--accent-primary)]" aria-label="Đã Public" />
                ) : (
                    <Lock className="w-4 h-4 text-[var(--text-muted)]" aria-label="Riêng tư" />
                )}
            </div>
            <div onClick={onOpen}>
                <div className="relative h-48 w-full rounded-[16px] overflow-hidden bg-slate-100 cursor-pointer">
                    <img
                        src={itinerary.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800'}
                        alt={itinerary.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                    <div className="absolute top-3 right-3 z-10">
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full border backdrop-blur-md flex items-center gap-1.5 ${isUpcoming
                            ? "bg-blue-500/20 text-blue-100 border-blue-400/30"
                            : "bg-emerald-500/20 text-emerald-100 border-emerald-400/30"
                            }`}>
                            {isUpcoming ? <PlaneTakeoff className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                            {isUpcoming ? "Sắp tới" : "Đã qua"}
                        </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white z-10">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md flex items-center gap-1 border border-white/10">
                            <Clock className="w-3 h-3 text-[var(--accent-gold)]" />
                            {itinerary.days} Ngày {itinerary.nights} Đêm
                        </span>
                    </div>
                </div>
                <div className="pt-4 cursor-pointer">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)] mb-1.5">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(itinerary.start_date).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="text-[var(--accent-gold)] font-bold">
                            {itinerary.estimated_cost?.toLocaleString('vi-VN')} đ
                        </span>
                    </div>

                    <h3 className="font-display font-bold text-lg leading-tight group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2 mt-1">
                        {itinerary.title}
                    </h3>

                    <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                        {itinerary.itinerary_provinces?.map(p => p.provinces?.name).join(', ') || 'Chưa cập nhật'}
                    </p>
                </div>
            </div>
            <div className="mt-5 pt-3.5 border-t border-[var(--border-color)] flex items-center justify-between relative">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-paper)] px-2 py-0.5 rounded-md">
                    {itinerary.theme}
                </span>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => toast("Tính năng chỉnh sửa", { icon: "✍️" })}
                        className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-paper)] transition-colors"
                        title="Chỉnh sửa lộ trình"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Xóa lộ trình"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}