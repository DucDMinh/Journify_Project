import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";
import { Blog } from "@/interface";

export const useBlogFeed = () => {
    const [posts, setPosts] = useState<Blog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(
        () =>
            api
                .get<Blog[]>("/blogs")
                .then(({ response, data }) => {
                    if (!response.ok) throw new Error(data.message || "Không tải được bài viết");
                    setPosts(data.data ?? []);
                })
                .catch((err: unknown) => toast.error(err instanceof Error ? err.message : "Không tải được bài viết"))
                .finally(() => setIsLoading(false)),
        [],
    );

    useEffect(() => {
        load();
    }, [load]);

    const patchPost = (id: string, patch: Partial<Blog> | ((post: Blog) => Partial<Blog>)) =>
        setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...(typeof patch === "function" ? patch(p) : patch) } : p)));

    const toggleLike = async (post: Blog) => {
        const liking = !post.is_liked;
        patchPost(post.id, (p) => ({ is_liked: liking, likes: Math.max(0, p.likes + (liking ? 1 : -1)) }));
        const { response, data } = await api.post(`/blogs/${post.id}/${liking ? "like" : "unlike"}`);
        if (!response.ok) {
            patchPost(post.id, (p) => ({ is_liked: !liking, likes: Math.max(0, p.likes + (liking ? -1 : 1)) }));
            toast.error(data.message || "Không thể cập nhật lượt thích");
        }
    };

    const removePost = async (post: Blog) => {
        const { response, data } = await api.delete(`/blogs/${post.id}`);
        if (!response.ok) {
            toast.error(data.message || "Không xóa được bài viết");
            return;
        }
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
        toast.success("Đã xóa bài viết");
    };

    const setCommentCount = (id: string, comments: number) => patchPost(id, { comments });

    return { posts, isLoading, reload: load, toggleLike, removePost, setCommentCount };
};
