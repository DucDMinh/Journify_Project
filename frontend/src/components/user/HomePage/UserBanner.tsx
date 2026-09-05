/* eslint-disable @next/next/no-img-element */
import { User } from "@/interface";
import { Compass, Link, Search, Sparkles } from "lucide-react"

interface UserBannerProps {
    currentUser: User | null;
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    setIsAiModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const UserBanner = ({ currentUser, searchQuery, setSearchQuery, setIsAiModalOpen }: UserBannerProps) => {
    return (
        <>
            {currentUser ? (
                <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[var(--accent-primary)]/10 via-[var(--bg-card)] to-[var(--accent-gold)]/10 p-8 md:p-12 shadow-xl border border-[var(--border-color)]">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--accent-primary)]/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[var(--accent-gold)]/20 rounded-full blur-3xl" />
                    <div className="relative flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 space-y-5">
                            <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight">
                                Chào {currentUser.name}, <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)]">
                                    sẵn sàng khám phá
                                </span>{" "}
                                chưa?
                            </h1>
                            <p className="text-sm md:text-base text-[var(--text-muted)] max-w-lg">
                                Khám phá Việt Nam theo cách riêng của bạn với những lộ trình cá nhân hóa, gợi ý từ AI và cộng đồng đam mê du lịch.
                            </p>
                            <div className="hidden md:flex flex-1 max-w-md relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm điểm đến, lộ trình..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-paper)] border border-[var(--border-color)] rounded-full text-sm outline-none focus:border-[var(--accent-primary)] transition-colors"
                                />
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--accent-primary)] text-white font-bold shadow-lg hover:bg-[var(--accent-primary)]/90 transition"
                                >
                                    <Compass className="w-5 h-5" /> Tìm kiếm
                                </button>
                                <button
                                    onClick={() => setIsAiModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] font-bold hover:bg-[var(--bg-paper)] transition"
                                >
                                    <Sparkles className="w-5 h-5 text-[var(--accent-gold)]" /> Tạo với AI
                                </button>
                            </div>
                        </div>
                        <div className="w-full md:w-2/5 h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                            <img
                                src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop"
                                alt="Vietnam travel"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </section>) : (
                <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[var(--accent-primary)]/10 via-[var(--bg-card)] to-[var(--accent-gold)]/10 p-8 md:p-12 shadow-xl border border-[var(--border-color)]">
                    {/* Background Glow Effects */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--accent-primary)]/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[var(--accent-gold)]/20 rounded-full blur-3xl" />

                    <div className="relative flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 space-y-5">
                            {/* 1. Tiêu đề vẫy gọi thay vì gọi tên user */}
                            <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight">
                                Lên kế hoạch cho <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)]">
                                    chuyến đi trong mơ
                                </span>{" "}
                                của bạn
                            </h1>

                            {/* 2. Text mô tả thu hút hơn */}
                            <p className="text-sm md:text-base text-[var(--text-muted)] max-w-lg">
                                Khám phá hàng ngàn lộ trình du lịch trải dài khắp Việt Nam. Tự động hóa lịch trình bằng AI, tính toán chi phí và sẵn sàng xách ba lô lên và đi!
                            </p>

                            <div className="hidden md:flex flex-1 max-w-md relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Bạn muốn đi đâu (VD: Đà Lạt, Sapa)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-paper)] border border-[var(--border-color)] rounded-full text-sm outline-none focus:border-[var(--accent-primary)] transition-colors"
                                />
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--accent-primary)] text-white font-bold shadow-lg hover:bg-[var(--accent-primary)]/90 transition"
                                >
                                    <Compass className="w-5 h-5" /> Khám phá ngay
                                </button>

                                {/* 3. Nút phụ chuyển thành Đăng nhập / Tham gia hoặc mở Modal báo yêu cầu đăng nhập */}
                                <Link
                                    href="/signin" // Đổi thành link trang đăng nhập của bạn (hoặc onClick mở Modal Login)
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] font-bold hover:bg-[var(--bg-paper)] transition"
                                >
                                    <Sparkles className="w-5 h-5 text-[var(--accent-gold)]" /> Đăng nhập để tạo AI
                                </Link>
                            </div>
                        </div>

                        <div className="w-full md:w-2/5 h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                            <img
                                src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop"
                                alt="Vietnam travel landscape"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </section>
            )}
        </>
    )
}   