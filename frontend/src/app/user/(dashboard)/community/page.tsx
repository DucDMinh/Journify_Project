"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Crown, Flame, Map, PenSquare, Route, Search, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";
import { CommunityOverview, Itinerary } from "@/interface";
import { useAuth } from "@/hooks/auth/AuthContext";
import { useBlogFeed } from "@/hooks/user/useBlogFeed";
import { PostCard } from "@/components/user/community/PostCard";
import { CreatePostModal } from "@/components/modals/user/CreatePostModal";
import { TripDetailModal2 } from "@/components/modals/user/TripDetailModal2";
import { removeAccents } from "@/utils/text";
import { timeAgo } from "@/utils/time";
import SafeImage from "@/components/common/SafeImage";
import UserAvatar from "@/components/common/UserAvatar";
import { cloneItinerary, provinceNames } from "@/lib/itinerary";
import { formatCost, shortPlaceName } from "@/lib/format";
import { useRouter } from "next/navigation";

const TOPICS = [
    { icon: "🌍", name: "Tất cả", match: () => true },
    { icon: "🤩", name: "Hào hứng", match: (e: string) => e.includes("hao hung") },
    { icon: "🥰", name: "Hạnh phúc", match: (e: string) => e.includes("hanh phuc") },
    { icon: "😌", name: "Thư giãn", match: (e: string) => e.includes("thu gian") },
    { icon: "🌟", name: "Tuyệt vời", match: (e: string) => e.includes("tuyet voi") },
    { icon: "✈️", name: "Cuồng chân", match: (e: string) => e.includes("cuong chan") },
];

type SortMode = "newest" | "popular";

export default function CommunityPage() {
    const { user: currentUser } = useAuth();
    const { posts, isLoading, reload, toggleLike, removePost, setCommentCount } = useBlogFeed();
    const [overview, setOverview] = useState<CommunityOverview | null>(null);
    const [activeTopic, setActiveTopic] = useState("Tất cả");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortMode>("newest");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [activeTrip, setActiveTrip] = useState<Itinerary | null>(null);
    const router = useRouter();

    useEffect(() => {
        let ignore = false;
        api.get<CommunityOverview>("/stats/community").then(({ response, data }) => {
            if (!ignore && response.ok && data.data) setOverview(data.data);
        });
        return () => {
            ignore = true;
        };
    }, []);

    const visiblePosts = useMemo(() => {
        const topic = TOPICS.find((t) => t.name === activeTopic) ?? TOPICS[0];
        const q = removeAccents(query.trim());
        const filtered = posts.filter((p) => {
            const matchesTopic = topic.match(removeAccents(p.emotion ?? ""));
            const haystack = removeAccents(`${p.content} ${p.location ?? ""} ${p.user_id?.name ?? ""}`);
            return matchesTopic && (!q || haystack.includes(q));
        });
        return sort === "popular" ? [...filtered].sort((a, b) => b.likes + b.comments - (a.likes + a.comments)) : filtered;
    }, [posts, activeTopic, query, sort]);

    const openTripDetail = async (trip: Itinerary) => {
        const { response, data } = await api.get<Itinerary>(`/itineraries/${trip.id}`);
        if (!response.ok || !data.data) {
            toast.error(data.message || "Không tải được lộ trình");
            return;
        }
        setActiveTrip(data.data);
    };

    const cloneTrip = async (trip: Itinerary) => {
        if (!currentUser) {
            toast.error("Đăng nhập để lưu lộ trình");
            return;
        }
        const toastId = toast.loading("Đang lưu lộ trình vào sổ tay...");
        const result = await cloneItinerary(trip.id);
        if (!result.ok) {
            toast.error(result.message, { id: toastId });
            return;
        }
        toast.success(`Đã lưu "${trip.title}" vào Lộ trình của tôi`, {
            id: toastId,
            action: { label: "Xem", onClick: () => router.push("/my-itinerary") },
        });
    };

    return (
        <div className="min-h-screen bg-[var(--bg-paper)] pb-20">
            <div className="relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0">
                    <SafeImage src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000" alt="" className="h-full w-full object-cover opacity-40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-paper)] via-slate-900/60 to-transparent" />
                </div>
                <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-16 text-center sm:px-6 lg:px-8">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display mb-3 text-4xl font-bold text-white drop-shadow-md md:text-5xl">
                        Khám phá thế giới cùng nhau
                    </motion.h1>
                    <p className="mx-auto mb-6 max-w-2xl text-sm text-gray-300 md:text-base">
                        {overview
                            ? `${overview.totals.members} thành viên · ${overview.totals.posts} bài chia sẻ · ${overview.totals.publicItineraries} lộ trình công khai`
                            : "Nơi chia sẻ lịch trình, kinh nghiệm và kết bạn đồng hành."}
                    </p>
                    <div className="relative mx-auto mb-8 max-w-2xl">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="block w-full rounded-2xl border border-white/20 bg-white/10 py-4 pl-12 pr-4 text-white placeholder-gray-400 shadow-lg backdrop-blur-md transition-all focus:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                            placeholder="Tìm bài viết theo nội dung, địa điểm hoặc tên thành viên..."
                        />
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        <button
                            onClick={() => (currentUser ? setIsCreateOpen(true) : toast.error("Đăng nhập để đăng bài"))}
                            className="flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <PenSquare className="h-4 w-4" /> Đăng bài chia sẻ
                        </button>
                        <Link href="/itineraries" className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-bold text-white backdrop-blur-md transition-all hover:bg-white/20">
                            <Map className="h-4 w-4" /> Lộ trình cộng đồng
                        </Link>
                        <Link href="/tips" className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-bold text-white backdrop-blur-md transition-all hover:bg-white/20">
                            <Bookmark className="h-4 w-4" /> Cẩm nang
                        </Link>
                    </div>
                </div>
            </div>

            <div className="border-b border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
                <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6 lg:px-8">
                    {TOPICS.map((topic) => (
                        <button
                            key={topic.name}
                            onClick={() => setActiveTopic(topic.name)}
                            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                                activeTopic === topic.name
                                    ? "bg-[var(--text-main)] text-[var(--bg-paper)]"
                                    : "border border-[var(--border-color)] bg-[var(--bg-paper)] text-[var(--text-muted)] hover:border-[var(--text-main)]"
                            }`}
                        >
                            <span>{topic.icon}</span> {topic.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
                <div className="lg:col-span-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="font-display text-2xl font-bold">Bảng tin</h2>
                        <div className="flex rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] p-1 text-xs font-bold">
                            {(["newest", "popular"] as SortMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setSort(mode)}
                                    className={`rounded-full px-3 py-1.5 transition-colors ${sort === mode ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-muted)]"}`}
                                >
                                    {mode === "newest" ? "Mới nhất" : "Phổ biến"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-6">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-64 animate-pulse rounded-3xl bg-[var(--border-color)]" />
                            ))}
                        </div>
                    ) : visiblePosts.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] p-12 text-center">
                            <PenSquare className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
                            <p className="font-semibold text-[var(--text-main)]">Chưa có bài viết phù hợp</p>
                            <p className="mt-1 text-sm text-[var(--text-muted)]">Hãy là người đầu tiên chia sẻ hành trình của bạn.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {visiblePosts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    currentUser={currentUser}
                                    onToggleLike={toggleLike}
                                    onDelete={removePost}
                                    onCommentCount={setCommentCount}
                                    compact
                                />
                            ))}
                        </div>
                    )}
                </div>

                <aside className="lg:col-span-4">
                    <div className="sticky top-24 space-y-6">
                        <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm">
                            <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-bold">
                                <Route className="h-5 w-5 text-[var(--accent-primary)]" /> Lộ trình mới chia sẻ
                            </h3>
                            {!overview ? (
                                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--border-color)]" />)}</div>
                            ) : overview.latestItineraries.length === 0 ? (
                                <p className="text-sm text-[var(--text-muted)]">Chưa có lộ trình công khai.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {overview.latestItineraries.map((trip) => (
                                        <li key={trip.id} className="flex gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-paper)] p-2.5">
                                            <button onClick={() => openTripDetail(trip)} className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--border-color)]">
                                                <SafeImage src={trip.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                                            </button>
                                            <div className="min-w-0 flex-1">
                                                <button onClick={() => openTripDetail(trip)} className="block w-full truncate text-left text-sm font-bold text-[var(--text-main)] hover:underline">
                                                    {trip.title}
                                                </button>
                                                <p className="truncate text-xs text-[var(--text-muted)]">
                                                    {provinceNames(trip).join(", ") || "Việt Nam"} · {trip.days ?? 1} ngày · {formatCost(trip.estimated_cost, "Tự túc")}
                                                </p>
                                                <div className="mt-1.5 flex items-center justify-between">
                                                    <span className="text-[11px] text-[var(--text-muted)]">{timeAgo(trip.created_at ?? new Date().toISOString())}</span>
                                                    <button onClick={() => cloneTrip(trip)} className="text-xs font-bold text-[var(--accent-primary)] hover:underline">
                                                        Lưu về
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm">
                            <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-bold">
                                <Trophy className="h-5 w-5 text-yellow-500" /> Bảng vinh danh
                            </h3>
                            {!overview ? (
                                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--border-color)]" />)}</div>
                            ) : (
                                <ul className="space-y-2">
                                    {overview.leaderboard.map((row, index) => (
                                        <li key={row.user.id} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--bg-paper)]">
                                            <span className={`font-display w-6 text-center text-lg font-bold ${index === 0 ? "text-yellow-500" : index === 1 ? "text-slate-400" : index === 2 ? "text-amber-700" : "text-[var(--text-muted)]"}`}>
                                                #{index + 1}
                                            </span>
                                            <UserAvatar src={row.user.avatar} name={row.user.name} className="h-10 w-10 border border-[var(--border-color)]" />
                                            <div className="min-w-0 flex-1">
                                                <p className="flex items-center gap-1 truncate text-sm font-bold text-[var(--text-main)]">
                                                    {row.user.name}
                                                    {row.user.is_premium && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                                                </p>
                                                <p className="truncate text-xs text-[var(--text-muted)]">
                                                    {row.blogs} bài · {row.itineraries} lộ trình · {row.likes} thích
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-[var(--accent-primary)]">{row.points}</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">điểm</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <p className="mt-3 text-[11px] text-[var(--text-muted)]">Điểm = 10/bài viết + 20/lộ trình công khai + 2/lượt thích.</p>
                        </section>

                        <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm">
                            <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-bold">
                                <Flame className="h-5 w-5 text-orange-500" /> Địa điểm được lưu nhiều
                            </h3>
                            {!overview ? (
                                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--border-color)]" />)}</div>
                            ) : (
                                <ul className="space-y-2.5">
                                    {overview.hotLocations.map((loc) => (
                                        <li key={loc.id} className="flex items-center gap-3">
                                            <SafeImage src={loc.img} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" loading="lazy" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-[var(--text-main)]" title={loc.name}>{shortPlaceName(loc.name)}</p>
                                                <p className="truncate text-xs text-[var(--text-muted)]">
                                                    {loc.province ?? "Việt Nam"} · {loc.saved_count} lượt lưu
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <Link href="/explore" className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-color)] py-2.5 text-sm font-bold text-[var(--text-muted)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]">
                                <Users className="h-4 w-4" /> Khám phá theo vùng miền
                            </Link>
                        </section>
                    </div>
                </aside>
            </div>

            <AnimatePresence>
                {isCreateOpen && <CreatePostModal onClose={() => setIsCreateOpen(false)} onSuccess={() => reload()} currentUser={currentUser} />}
            </AnimatePresence>
            <AnimatePresence>
                {activeTrip && <TripDetailModal2 currentUser={currentUser} itinerary={activeTrip} onClose={() => setActiveTrip(null)} onClone={() => cloneTrip(activeTrip)} />}
            </AnimatePresence>
        </div>
    );
}
