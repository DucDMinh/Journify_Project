import { useEffect, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";
import { Blog, BlogComment, User } from "@/interface";
import { timeAgo } from "@/utils/time";
import UserAvatar from "@/components/common/UserAvatar";

interface CommentSectionProps {
    post: Blog;
    currentUser: User | null;
    onCountChange: (count: number) => void;
}

const Avatar = ({ src, name }: { src?: string | null; name?: string }) => <UserAvatar src={src} name={name} className="h-8 w-8" textClassName="text-xs" />;

export function CommentSection({ post, currentUser, onCountChange }: CommentSectionProps) {
    const [comments, setComments] = useState<BlogComment[] | null>(null);
    const [draft, setDraft] = useState("");
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        let ignore = false;
        api.get<BlogComment[]>(`/blogs/${post.id}/comments`).then(({ response, data }) => {
            if (!ignore) setComments(response.ok ? (data.data ?? []) : []);
        });
        return () => {
            ignore = true;
        };
    }, [post.id]);

    const submit = async () => {
        const content = draft.trim();
        if (!content || isSending) return;
        if (!currentUser) {
            toast.error("Đăng nhập để bình luận");
            return;
        }
        setIsSending(true);
        const { response, data } = await api.post<BlogComment>(`/blogs/${post.id}/comments`, { content });
        setIsSending(false);
        if (!response.ok || !data.data) {
            toast.error(data.message || "Không gửi được bình luận");
            return;
        }
        const next = [...(comments ?? []), data.data];
        setComments(next);
        setDraft("");
        onCountChange(next.length);
    };

    const remove = async (comment: BlogComment) => {
        const { response, data } = await api.delete(`/blogs/${post.id}/comments/${comment.id}`);
        if (!response.ok) {
            toast.error(data.message || "Không xóa được bình luận");
            return;
        }
        const next = (comments ?? []).filter((c) => c.id !== comment.id);
        setComments(next);
        onCountChange(next.length);
    };

    const canDelete = (comment: BlogComment) =>
        Boolean(currentUser) && (currentUser?.role === "ADMIN" || comment.user_id?.id === currentUser?.id);

    return (
        <div className="border-t border-[var(--border-color)] px-4 pb-4 pt-3">
            {comments === null ? (
                <p className="py-2 text-xs text-[var(--text-muted)]">Đang tải bình luận...</p>
            ) : comments.length === 0 ? (
                <p className="py-2 text-xs text-[var(--text-muted)]">Chưa có bình luận. Hãy là người đầu tiên!</p>
            ) : (
                <ul className="mb-3 max-h-72 space-y-3 overflow-y-auto pr-1">
                    {comments.map((c) => (
                        <li key={c.id} className="flex items-start gap-2.5">
                            <Avatar src={c.user_id?.avatar} name={c.user_id?.name} />
                            <div className="min-w-0 flex-1 rounded-2xl bg-[var(--bg-paper)] px-3 py-2">
                                <p className="text-xs">
                                    <span className="font-bold text-[var(--text-main)]">{c.user_id?.name ?? "Thành viên"}</span>
                                    <span className="ml-2 text-[var(--text-muted)]">{timeAgo(c.created_at)}</span>
                                </p>
                                <p className="mt-0.5 whitespace-pre-wrap text-sm text-[var(--text-main)]">{c.content}</p>
                            </div>
                            {canDelete(c) && (
                                <button onClick={() => remove(c)} className="p-1 text-[var(--text-muted)] hover:text-red-500" title="Xóa bình luận">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <div className="flex items-center gap-2">
                <Avatar src={currentUser?.avatar} name={currentUser?.name} />
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), submit())}
                    placeholder={currentUser ? "Viết bình luận..." : "Đăng nhập để bình luận"}
                    disabled={!currentUser || isSending}
                    maxLength={1000}
                    className="flex-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-paper)] px-4 py-2 text-sm outline-none focus:border-[var(--accent-primary)] disabled:opacity-60"
                />
                <button
                    onClick={submit}
                    disabled={!draft.trim() || !currentUser || isSending}
                    className="rounded-full bg-[var(--accent-primary)] p-2 text-white transition hover:opacity-90 disabled:opacity-40"
                    title="Gửi"
                >
                    <Send className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
