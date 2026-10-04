import Link from "next/link";
import { ChevronRight, Edit3 } from "lucide-react";
import { TRAVEL_TIPS } from "@/data/travelTips";
import { TipCard } from "@/components/user/TipCard";

export const TravelTips = () => (
    <section>
        <div className="mb-6 flex items-center justify-between gap-4">
            <div>
                <h2 className="font-display flex items-center gap-2 text-2xl font-bold">
                    <Edit3 className="h-6 w-6 text-purple-500" /> Bài viết & Mẹo du lịch
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Cẩm nang bỏ túi cho chuyến đi của bạn</p>
            </div>
            <Link href="/tips" className="flex shrink-0 items-center gap-1 text-sm font-bold text-[var(--accent-primary)] hover:underline">
                Xem tất cả <ChevronRight className="h-4 w-4" />
            </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TRAVEL_TIPS.slice(0, 3).map((tip) => (
                <TipCard key={tip.slug} tip={tip} />
            ))}
        </div>
    </section>
);
