"use client";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Image as ImageIcon, MapPin, Search, Smile } from "lucide-react";
import { useAuth } from "@/hooks/auth/AuthContext";
import { useBlogFeed } from "@/hooks/user/useBlogFeed";
import { PostCard } from "@/components/user/community/PostCard";
import { CreatePostModal } from "@/components/modals/user/CreatePostModal";
import { removeAccents } from "@/utils/text";
import UserAvatar from "@/components/common/UserAvatar";

export default function BlogPage() {
    const { user: currentUser } = useAuth();
    const { posts, isLoading, reload, toggleLike, removePost, setCommentCount } = useBlogFeed();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [query, setQuery] = useState("");

    const visible = useMemo(() => {
        const q = removeAccents(query.trim());
        if (!q) return posts;
        return posts.filter((p) => removeAccents(`${p.content} ${p.location ?? ""} ${p.user_id?.name ?? ""}`).includes(q));
    }, [posts, query]);

    return (
        <div className="min-h-screen bg-[var(--bg-paper)] py-6 md:py-8">
            <div className="mx-auto max-w-2xl px-4 sm:px-6">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tìm kiếm bài viết, địa điểm, thành viên..."
                        className="w-full rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition-all focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                    />
                </div>

                {currentUser && (
                    <div className="mb-6 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <UserAvatar src={currentUser.avatar} name={currentUser.name} className="h-10 w-10 border border-[var(--border-color)]" />
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex-1 rounded-full bg-[var(--bg-paper)] px-5 py-3 text-left text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                                Bạn muốn chia sẻ hành trình gì hôm nay?
                            </button>
                        </div>
                        <div className="mt-4 flex items-center justify-around border-t border-[var(--border-color)] pt-3">
                            {[
                                { icon: ImageIcon, label: "Ảnh", color: "text-emerald-500" },
                                { icon: MapPin, label: "Check-in", color: "text-rose-500" },
                                { icon: Smile, label: "Cảm xúc", color: "text-amber-500" },
                            ].map(({ icon: Icon, label, color }) => (
                                <button key={label} onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-paper)]">
                                    <Icon className={`h-5 w-5 ${color}`} />
                                    <span className="hidden sm:inline">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="space-y-6">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-[var(--border-color)]" />)}</div>
                ) : visible.length === 0 ? (
                    <p className="py-16 text-center text-sm text-[var(--text-muted)]">{query.trim() ? "Không có bài viết phù hợp với từ khóa." : "Chưa có bài viết nào."}</p>
                ) : (
                    <div className="space-y-6">
                        {visible.map((post) => (
                            <PostCard key={post.id} post={post} currentUser={currentUser} onToggleLike={toggleLike} onDelete={removePost} onCommentCount={setCommentCount} />
                        ))}
                    </div>
                )}
            </div>
            <AnimatePresence>
                {isCreateModalOpen && <CreatePostModal onClose={() => setIsCreateModalOpen(false)} onSuccess={() => reload()} currentUser={currentUser} />}
            </AnimatePresence>
        </div>
    );
}
