/* eslint-disable @next/next/no-img-element */
import { Itinerary } from "@/interface";
import { BookmarkPlus, ChevronRight, Compass, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface TrendingItineraryProps {
    trendingItineraries: Itinerary[];
    setActiveTripDetail: (trip: Itinerary) => void;
    handleCloneTrip: (trip: Itinerary) => void;
    setActiveNav: (nav: string) => void;
    handleViewDetailItinerary: (id: string) => void;
}

function TrendingCard({ trip, rank, onOpen, onClone }: { trip: Itinerary; rank: number; onOpen: () => void; onClone: () => void }) {
    return (
        <div onClick={onOpen} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group">
            <div className="relative h-44 overflow-hidden">
                <img src={trip.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800'} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><TrendingUp className="w-3 h-3 text-[var(--accent-gold)]" /> #{rank}</div>
                <button onClick={(e) => { e.stopPropagation(); onClone(); }} className="absolute bottom-2 right-2 p-2 rounded-full bg-white/90 text-[var(--text-main)] hover:bg-[var(--accent-primary)] hover:text-white transition shadow-md" title="Lưu lộ trình"><BookmarkPlus className="w-4 h-4" /></button>
            </div>
            <div className="p-4">
                <h4 className="font-display font-bold text-sm line-clamp-1">{trip.title}</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1">{trip.itinerary_provinces?.map(p => p.provinces?.name).join(" - ") || "Việt Nam"}</p>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-semibold text-[var(--accent-gold)]">{trip.estimated_cost ? `${trip.estimated_cost.toLocaleString('vi-VN')}đ` : "Tự túc"}</span>
                    <span className="text-xs text-[var(--text-muted)]">{trip.days || 1} ngày</span>
                </div>
            </div>
        </div>
    );
}

export const TrendingItinerary = ({ trendingItineraries, handleCloneTrip, handleViewDetailItinerary }: TrendingItineraryProps) => {
    const router = useRouter();
    return (
        <section className="w-full min-w-0"> {/* 🌟 Khóa chiều rộng, chống vỡ layout */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-[var(--accent-primary)]" /> Lộ trình nổi bật
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Được cộng đồng yêu thích nhất tuần này</p>
                </div>
                <button
                    onClick={() => router.push('/Itineraries')}
                    className="text-sm font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                >
                    Xem tất cả <ChevronRight className="w-4 h-4" />
                </button>
            </div>
            <div
                className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 snap-x snap-mandatory w-full 
                [&::-webkit-scrollbar]:h-2 
                [&::-webkit-scrollbar-track]:bg-transparent 
                [&::-webkit-scrollbar-thumb]:bg-[var(--border-color)] 
                hover:[&::-webkit-scrollbar-thumb]:bg-[var(--text-muted)] 
                [&::-webkit-scrollbar-thumb]:rounded-full 
                transition-colors"
            >
                {trendingItineraries.map((trip, idx) => (
                    <div
                        key={trip.id}
                        className="snap-start shrink-0 w-[85vw] sm:w-[350px]"
                    >
                        <TrendingCard
                            trip={trip}
                            rank={idx + 1}
                            onOpen={() => handleViewDetailItinerary(trip.id)}
                            onClone={() => handleCloneTrip(trip)}
                        />
                    </div>
                ))}

                {trendingItineraries.length === 0 && (
                    <div className="w-full flex flex-col items-center justify-center text-center py-10 text-[var(--text-muted)]">
                        <Compass className="w-10 h-10 mx-auto opacity-30 mb-2" />
                        <p>Chưa có lộ trình nổi bật. Hãy là người đầu tiên chia sẻ!</p>
                    </div>
                )}
            </div>
        </section>
    )
}