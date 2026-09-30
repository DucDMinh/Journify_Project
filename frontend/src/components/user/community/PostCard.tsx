/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MapPin, MessageCircle, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Blog, User } from "@/interface";
import { timeAgo } from "@/utils/time";
import { CommentSection } from "./CommentSection";

interface PostCardProps {
    post: Blog;
    currentUser: User | null;
    onToggleLike: (post: Blog) => void;
    onDelete: (post: Blog) => void;
    onCommentCount: (id: string, count: number) => void;
    compact?: boolean;
}

export function PostCard({ post, currentUser, onToggleLike, onDelete, onCommentCount, compact = false }: PostCardProps) {
    const [showComments, setShowComments] = useState(false);
    const author = post.user_id;
    const canDelete = Boolean(currentUser) && (currentUser?.role === "ADMIN" || author?.id === currentUser?.id);

    const share = async () => {
        const url = `${window.location.origin}/community#post-${post.id}`;
        try {
            if (navigator.share) await navigator.share({ title: "Journify", text: post.content.slice(0, 120), url });
            else {
                await navigator.clipboard.writeText(url);
                toast.success("Đã sao chép liên kết bài viết");
            }
        } catch {
            // người dùng hủy chia sẻ
        }
    };

    return (
        <motion.article
            id={`post-${post.id}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm"
        >
            <div className="flex items-start justify-between p-4">
                <div className="flex items-center gap-3">
                    {author?.avatar ? (
                        <img src={author.avatar} alt="" className="h-10 w-10 rounded-full border border-[var(--border-color)] object-cover" />
                    ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-primary)]/15 font-bold text-[var(--accent-primary)]">
                            {author?.name?.charAt(0).toUpperCase() ?? "?"}
                        </span>
                    )}
                    <div>
                        <h3 className="text-[15px] font-bold text-[var(--text-main)]">
                            {author?.name ?? "Thành viên"}
                            {post.emotion && (
                                <span className="font-normal text-[var(--text-muted)]">
                                    {" "}
                                    đang cảm thấy <span className="font-bold text-[var(--text-main)]">{post.emotion}</span>
                                </span>
                            )}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1 text-[13px] font-medium text-[var(--text-muted)]">
                            <span>{timeAgo(post.created_at)}</span>
                            {post.location && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {post.location}
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                </div>
                {canDelete && (
                    <button onClick={() => onDelete(post)} className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-500" title="Xóa bài viết">
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="px-4 pb-3">
                <p className={`whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--text-main)] ${compact ? "line-clamp-4" : ""}`}>{post.content}</p>
            </div>

            {post.blog_image && (
                <div className="w-full bg-black">
                    <img src={post.blog_image} alt="" className={`w-full object-cover ${compact ? "max-h-80" : "max-h-[600px]"}`} loading="lazy" />
                </div>
            )}

            <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => (currentUser ? onToggleLike(post) : toast.error("Đăng nhập để thích bài viết"))}
                        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:bg-[var(--bg-paper)]"
                    >
                        <Heart className={`h-5 w-5 transition-colors ${post.is_liked ? "fill-rose-500 text-rose-500" : "text-[var(--text-main)]"}`} />
                        {post.likes.toLocaleString("vi-VN")}
                    </button>
                    <button
                        onClick={() => setShowComments((v) => !v)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:bg-[var(--bg-paper)] ${showComments ? "text-[var(--accent-primary)]" : ""}`}
                    >
                        <MessageCircle className="h-5 w-5" />
                        {post.comments}
                    </button>
                </div>
                <button onClick={share} className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-paper)] hover:text-[var(--text-main)]" title="Chia sẻ">
                    <Share2 className="h-5 w-5" />
                </button>
            </div>

            {showComments && <CommentSection post={post} currentUser={currentUser} onCountChange={(count) => onCommentCount(post.id, count)} />}
        </motion.article>
    );
}
