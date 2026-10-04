import Link from "next/link";
import { BookmarkPlus, ChevronRight, Compass, TrendingUp, UserRound } from "lucide-react";
import { Itinerary } from "@/interface";
import SafeImage from "@/components/common/SafeImage";
import { formatCost } from "@/lib/format";
import { itineraryAuthor, provinceNames } from "@/lib/itinerary";

interface TrendingItineraryProps {
    trendingItineraries: Itinerary[];
    isLoading: boolean;
    handleCloneTrip: (trip: Itinerary) => void;
    handleViewDetailItinerary: (id: string) => void;
}

function TrendingCard({ trip, rank, onOpen, onClone }: { trip: Itinerary; rank: number; onOpen: () => void; onClone: () => void }) {
    const provinces = provinceNames(trip);
    const author = itineraryAuthor(trip);
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(event) => event.key === "Enter" && onOpen()}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm transition-all hover:shadow-lg"
        >
            <div className="relative h-44 overflow-hidden">
                <SafeImage src={trip.image_url} alt={trip.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    <TrendingUp className="h-3 w-3 text-[var(--accent-gold)]" /> #{rank}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClone();
                    }}
                    className="absolute bottom-2 right-2 rounded-full bg-white/90 p-2 text-slate-800 shadow-md transition hover:bg-[var(--accent-primary)] hover:text-white"
                    title="Lưu vào Lộ trình của tôi"
                    aria-label="Lưu vào Lộ trình của tôi"
                >
                    <BookmarkPlus className="h-4 w-4" />
                </button>
            </div>
            <div className="p-4">
                <h4 className="font-display line-clamp-1 text-sm font-bold">{trip.title}</h4>
                <p className="mt-1 line-clamp-1 text-xs text-[var(--text-muted)]">{provinces.length ? provinces.join(" - ") : "Việt Nam"}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--accent-gold)]">{formatCost(trip.estimated_cost, "Tự túc")}</span>
                    <span className="text-xs text-[var(--text-muted)]">{trip.days || 1} ngày</span>
                </div>
                {author?.name && (
                    <p className="mt-2 flex items-center gap-1 truncate text-[11px] text-[var(--text-muted)]">
                        <UserRound className="h-3 w-3" /> {author.name}
                    </p>
                )}
            </div>
        </div>
    );
}

export const TrendingItinerary = ({ trendingItineraries, isLoading, handleCloneTrip, handleViewDetailItinerary }: TrendingItineraryProps) => (
    <section className="w-full min-w-0">
        <div className="mb-6 flex items-center justify-between gap-4">
            <div>
                <h2 className="font-display flex items-center gap-2 text-2xl font-bold">
                    <TrendingUp className="h-6 w-6 text-[var(--accent-primary)]" /> Lộ trình nổi bật
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Được cộng đồng lưu nhiều nhất tuần này</p>
            </div>
            <Link href="/itineraries" className="flex shrink-0 items-center gap-1 text-sm font-bold text-[var(--accent-primary)] hover:underline">
                Xem tất cả <ChevronRight className="h-4 w-4" />
            </Link>
        </div>
        <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-6 sm:gap-6 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border-color)] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-2">
            {isLoading &&
                Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-72 w-[85vw] shrink-0 animate-pulse rounded-2xl bg-[var(--border-color)] sm:w-[350px]" />
                ))}
            {!isLoading &&
                trendingItineraries.map((trip, idx) => (
                    <div key={trip.id} className="w-[85vw] shrink-0 snap-start sm:w-[350px]">
                        <TrendingCard trip={trip} rank={idx + 1} onOpen={() => handleViewDetailItinerary(trip.id)} onClone={() => handleCloneTrip(trip)} />
                    </div>
                ))}
            {!isLoading && trendingItineraries.length === 0 && (
                <div className="flex w-full flex-col items-center justify-center py-10 text-center text-[var(--text-muted)]">
                    <Compass className="mx-auto mb-2 h-10 w-10 opacity-30" />
                    <p>Chưa có lộ trình nổi bật. Hãy là người đầu tiên chia sẻ!</p>
                </div>
            )}
        </div>
    </section>
);
