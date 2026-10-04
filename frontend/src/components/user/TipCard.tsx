import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import type { TravelTip } from "@/data/travelTips";
import SafeImage from "@/components/common/SafeImage";

export function TipCard({ tip }: { tip: TravelTip }) {
    return (
        <Link
            href={`/tips/${tip.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
            <div className="relative h-44 overflow-hidden">
                <SafeImage src={tip.cover} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">{tip.tag}</span>
            </div>
            <div className="flex flex-1 flex-col p-4">
                <h4 className="line-clamp-2 text-base font-bold leading-snug text-[var(--text-main)]">{tip.title}</h4>
                <p className="mt-1.5 line-clamp-2 text-sm text-[var(--text-muted)]">{tip.excerpt}</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <Clock className="h-3.5 w-3.5" /> {tip.readMinutes} phút đọc
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--accent-primary)]" />
                </div>
            </div>
        </Link>
    );
}
