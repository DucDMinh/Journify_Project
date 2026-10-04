import { Itinerary } from "@/interface";
import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, MapPin, Clock, PlaneTakeoff, Archive, Pencil, Trash2, Share2, Lock, CalendarOff } from "lucide-react";
import SafeImage from "@/components/common/SafeImage";
import { formatCost, formatDate } from "@/lib/format";
import { provinceNames } from "@/lib/itinerary";

type TripStatus = "upcoming" | "past" | "undated";

const STATUS_BADGE: Record<TripStatus, { label: string; className: string; icon: typeof PlaneTakeoff }> = {
    upcoming: { label: "Sắp tới", className: "bg-blue-500/20 text-blue-100 border-blue-400/30", icon: PlaneTakeoff },
    past: { label: "Đã qua", className: "bg-emerald-500/20 text-emerald-100 border-emerald-400/30", icon: Archive },
    undated: { label: "Chưa chọn ngày", className: "bg-amber-500/25 text-amber-50 border-amber-400/30", icon: CalendarOff },
};

function WashiTape({ color = "var(--washi-teal)", className = "" }: { color?: string; className?: string }) {
    return <div className={`washi-tape z-10 ${className}`} style={{ ["--washi-color" as string]: color }} />;
}

export function MyItineraryCard({
    itinerary,
    index,
    status,
    onDelete,
    onOpen,
}: {
    itinerary: Itinerary;
    index: number;
    status: TripStatus;
    onDelete: () => void;
    onOpen: () => void;
}) {
    const tilts = [-2, 1.5, -1, 2, -1.5, 1];
    const washiColors = ["var(--washi-teal)", "var(--washi-coral)", "var(--washi-yellow)"];
    const badge = STATUS_BADGE[status];
    const provinces = provinceNames(itinerary);
    const startDate = formatDate(itinerary.start_date);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, rotate: tilts[index % tilts.length] }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ rotate: 0, y: -8, scale: 1.02, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            className="group relative flex flex-col justify-between rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-sm transition-all hover:shadow-[var(--shadow-float)]"
        >
            <WashiTape color={washiColors[index % washiColors.length]} className="left-1/2 top-[-8px] w-28 -translate-x-1/2 -rotate-2" />
            <div
                className="absolute -left-3 -top-3 z-20 flex h-9 w-9 rotate-[-10deg] items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-md"
                title={itinerary.share ? "Đang chia sẻ công khai" : "Riêng tư"}
            >
                {itinerary.share ? <Share2 className="h-4 w-4 text-[var(--accent-primary)]" /> : <Lock className="h-4 w-4 text-[var(--text-muted)]" />}
            </div>
            <button type="button" onClick={onOpen} className="text-left">
                <div className="relative h-48 w-full cursor-pointer overflow-hidden rounded-[16px] bg-slate-100">
                    <SafeImage src={itinerary.image_url} alt={itinerary.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                    <div className="absolute right-3 top-3 z-10">
                        <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold backdrop-blur-md ${badge.className}`}>
                            <badge.icon className="h-3 w-3" />
                            {badge.label}
                        </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-white">
                        <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-bold backdrop-blur-md">
                            <Clock className="h-3 w-3 text-[var(--accent-gold)]" />
                            {itinerary.days || 1} ngày {itinerary.nights ?? 0} đêm
                        </span>
                    </div>
                </div>
                <div className="cursor-pointer pt-4">
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {startDate ?? "Chưa chọn ngày đi"}
                        </span>
                        <span className="font-bold text-[var(--accent-gold)]">{formatCost(itinerary.estimated_cost)}</span>
                    </div>
                    <h3 className="font-display mt-1 line-clamp-2 text-lg font-bold leading-tight transition-colors group-hover:text-[var(--accent-primary)]">{itinerary.title}</h3>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--accent-primary)]" />
                        <span className="line-clamp-1">{provinces.length ? provinces.join(", ") : "Chưa chọn điểm đến"}</span>
                    </p>
                </div>
            </button>
            <div className="relative mt-5 flex items-center justify-between gap-2 border-t border-[var(--border-color)] pt-3.5">
                <span className="truncate rounded-md bg-[var(--bg-paper)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {itinerary.theme || "Chưa có chủ đề"}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                    <Link
                        href={`/my-itinerary/${itinerary.id}/builder`}
                        className="rounded-xl p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-paper)] hover:text-[var(--accent-primary)]"
                        title="Sửa lịch trình"
                        aria-label="Sửa lịch trình"
                    >
                        <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                        onClick={onDelete}
                        className="rounded-xl p-2 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                        title="Xóa lộ trình"
                        aria-label="Xóa lộ trình"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
