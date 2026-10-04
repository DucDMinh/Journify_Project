import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Search, Sparkles } from "lucide-react";
import { User } from "@/interface";
import SafeImage from "@/components/common/SafeImage";

interface UserBannerProps {
    currentUser: User | null;
    onOpenAiPlanner: () => void;
}

const HERO_IMAGE = "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop";

export const UserBanner = ({ currentUser, onOpenAiPlanner }: UserBannerProps) => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    const submitSearch = (event?: React.FormEvent) => {
        event?.preventDefault();
        const query = searchQuery.trim();
        router.push(query ? `/itineraries?q=${encodeURIComponent(query)}` : "/explore");
    };

    return (
        <section className="relative overflow-hidden rounded-3xl border border-[var(--border-color)] bg-gradient-to-br from-[var(--accent-primary)]/10 via-[var(--bg-card)] to-[var(--accent-gold)]/10 p-6 shadow-xl sm:p-8 md:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--accent-primary)]/20 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--accent-gold)]/20 blur-3xl" />

            <div className="relative flex flex-col items-center gap-8 md:flex-row">
                <div className="w-full flex-1 space-y-5">
                    <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
                        {currentUser ? (
                            <>
                                Chào {currentUser.name}, <br />
                                <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)] bg-clip-text text-transparent">sẵn sàng khám phá</span>{" "}
                                chưa?
                            </>
                        ) : (
                            <>
                                Lên kế hoạch cho <br />
                                <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)] bg-clip-text text-transparent">chuyến đi trong mơ</span>{" "}
                                của bạn
                            </>
                        )}
                    </h1>
                    <p className="max-w-lg text-sm text-[var(--text-muted)] md:text-base">
                        {currentUser
                            ? "Khám phá Việt Nam theo cách riêng của bạn với những lộ trình cá nhân hóa, gợi ý từ AI và cộng đồng đam mê du lịch."
                            : "Khám phá hàng ngàn lộ trình du lịch trải dài khắp Việt Nam. Tự động hóa lịch trình bằng AI, tính toán chi phí và sẵn sàng xách ba lô lên và đi!"}
                    </p>

                    <form onSubmit={submitSearch} className="relative flex max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            type="search"
                            placeholder={currentUser ? "Tìm điểm đến, lộ trình..." : "Bạn muốn đi đâu (VD: Đà Lạt, Sa Pa)..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-full border border-[var(--border-color)] bg-[var(--bg-paper)] py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--accent-primary)]"
                            aria-label="Tìm lộ trình"
                        />
                    </form>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => submitSearch()}
                            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-primary)] px-6 py-3 font-bold text-white shadow-lg transition hover:bg-[var(--accent-primary)]/90"
                        >
                            <Compass className="h-5 w-5" /> {searchQuery.trim() ? "Tìm kiếm" : "Khám phá ngay"}
                        </button>
                        {currentUser ? (
                            <button
                                onClick={onOpenAiPlanner}
                                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] px-6 py-3 font-bold text-[var(--text-main)] transition hover:bg-[var(--bg-paper)]"
                            >
                                <Sparkles className="h-5 w-5 text-[var(--accent-gold)]" /> Tạo với AI
                            </button>
                        ) : (
                            <Link
                                href="/auth/signin"
                                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] px-6 py-3 font-bold text-[var(--text-main)] transition hover:bg-[var(--bg-paper)]"
                            >
                                <Sparkles className="h-5 w-5 text-[var(--accent-gold)]" /> Đăng nhập để tạo bằng AI
                            </Link>
                        )}
                    </div>
                </div>

                <div className="h-64 w-full rotate-1 overflow-hidden rounded-2xl shadow-2xl transition-transform duration-500 hover:rotate-0 md:h-80 md:w-2/5">
                    <SafeImage src={HERO_IMAGE} alt="Vịnh Hạ Long, Việt Nam" className="h-full w-full object-cover" />
                </div>
            </div>
        </section>
    );
};
