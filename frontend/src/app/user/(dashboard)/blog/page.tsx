/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart,
    MessageCircle,
    Send,
    Bookmark,
    MoreHorizontal,
    MapPin,
    Image as ImageIcon,
    Smile,
    Search
} from "lucide-react";
import { Blog } from '@/interface'
import { toast } from "sonner";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/hooks/auth/AuthContext";
import { CreatePostModal } from "@/components/modals/user/CreatePostModal";


export default function BlogPage() {
    const [posts, setPosts] = useState<Blog[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { user: currentUser } = useAuth();
    const fetchBlog = async () => {
        try {
            const { data, response } = await api.get<Blog[]>('/blogs');
            if (!response.ok) {
                toast.error(`${data.message}`)
                return;
            }
            setPosts(data.data ?? [])
        } catch (error) {
            toast.error(`Co loi xay ra: ${error}`)
        }
    }
    useEffect(() => {
        fetchBlog();
    }, [])
    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return "Vừa xong";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} phút trước`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} ngày trước`;
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(date);
    };
    const handleLikeBlog = async (blog_id: string) => {
        try {
            const { data, response } = await api.post(`/blogs/${blog_id}/like`);
            if (!response.ok) throw new Error(data.message);
            handleToggleHeart(blog_id, 'like')
        } catch (error) {
            toast.error(`${error}`)
        }
    }
    const handleUnLikeBlog = async (blog_id: string) => {
        try {
            const { data, response } = await api.post(`/blogs/${blog_id}/unlike`);
            if (!response.ok) throw new Error(data.message);
            handleToggleHeart(blog_id, 'unlike')
        } catch (error) {
            toast.error(`${error}`)
        }
    }
    const handleToggleHeart = (blog_id: string, method: string) => {
        if (method == "like") {
            setPosts(prevPosts =>
                prevPosts.map(post => {
                    if (post.id === blog_id) {
                        return {
                            ...post,
                            is_liked: true,
                            likes: post.likes + 1
                        };
                    }
                    return post;
                })
            );
        } else {
            setPosts(prevPosts =>
                prevPosts.map(post => {
                    if (post.id === blog_id) {
                        return {
                            ...post,
                            is_liked: false,
                            likes: post.likes - 1
                        };
                    }
                    return post;
                })
            );
        }
    }
    return (
        <div className="min-h-screen bg-[var(--bg-paper)] py-6 md:py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài viết, địa điểm, chuyến đi..."
                            className="w-full pl-11 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all shadow-sm"
                        />
                    </div>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] p-4 mb-6 shadow-sm">
                    <div className="flex gap-3 items-center">
                        <img
                            src={currentUser?.avatar}
                            alt="Your avatar"
                            className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)]"
                        />
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex-1 bg-[var(--bg-paper)] hover:bg-gray-100 dark:hover:bg-slate-800 text-left px-5 py-3 rounded-full text-[var(--text-muted)] text-sm font-medium transition-colors"
                        >
                            Bạn muốn chia sẻ hành trình gì hôm nay?
                        </button>
                    </div>
                    <div className="border-t border-[var(--border-color)] mt-4 pt-3 flex items-center justify-around">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-paper)] rounded-xl transition-colors text-[var(--text-muted)] hover:text-emerald-500 font-semibold text-sm"
                        >
                            <ImageIcon className="w-5 h-5 text-emerald-500" />
                            <span className="hidden sm:inline">Ảnh/Video</span>
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-paper)] rounded-xl transition-colors text-[var(--text-muted)] hover:text-rose-500 font-semibold text-sm"
                        >
                            <MapPin className="w-5 h-5 text-rose-500" />
                            <span className="hidden sm:inline">Check-in</span>
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-paper)] rounded-xl transition-colors text-[var(--text-muted)] hover:text-amber-500 font-semibold text-sm"
                        >
                            <Smile className="w-5 h-5 text-amber-500" />
                            <span className="hidden sm:inline">Cảm xúc</span>
                        </button>
                    </div>
                </div>
                <div className="space-y-6">
                    <AnimatePresence>
                        {posts.map((post) => (
                            <motion.article
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={post.id}
                                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] shadow-sm overflow-hidden"
                            >
                                <div className="p-4 flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={post.user_id.avatar} alt={post.user_id.name} className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)]" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-bold text-[15px] text-[var(--text-main)] cursor-pointer hover:underline">
                                                    {post.user_id.name}
                                                    {post.emotion && (
                                                        <span className="font-normal text-[var(--text-muted)]">
                                                            {" "}đang cảm thấy <span className="font-bold text-[var(--text-main)]">{post.emotion}</span>
                                                        </span>
                                                    )}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-1 text-[13px] text-[var(--text-muted)] font-medium mt-0.5">
                                                <span>{timeAgo(post.created_at)}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1 hover:text-[var(--text-main)] cursor-pointer">
                                                    <MapPin className="w-3 h-3" />
                                                    {post.location}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-paper)] rounded-full transition-colors">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="px-4 pb-3">
                                    <p className="text-[15px] text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">
                                        {post.content}
                                    </p>
                                </div>
                                {post.blog_image && <div className="relative w-full max-h-[600px] bg-black">
                                    <img
                                        src={post.blog_image}
                                        alt="Post content"
                                        className="w-full h-full object-cover max-h-[600px]"
                                        loading="lazy"
                                    />
                                </div>}

                                <div className="p-2 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => {
                                                if (!post.is_liked) {
                                                    handleLikeBlog(post.id)
                                                } else {
                                                    handleUnLikeBlog(post.id)
                                                }
                                            }}
                                            className="p-2 hover:opacity-70 transition-opacity"
                                        >
                                            <Heart
                                                className={`w-7 h-7 transition-colors ${post.is_liked
                                                    ? 'fill-rose-500 text-rose-500'
                                                    : 'text-[var(--text-main)]'
                                                    }`}
                                            />
                                        </button>
                                        <button className="p-2 hover:opacity-70 transition-opacity">
                                            <MessageCircle className="w-7 h-7 text-[var(--text-main)]" />
                                        </button>
                                        <button className="p-2 hover:opacity-70 transition-opacity">
                                            <Send className="w-7 h-7 text-[var(--text-main)]" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => { }}
                                        className="p-2 hover:opacity-70 transition-opacity"
                                    >
                                        <Bookmark className={`w-7 h-7 transition-colors text-[var(--text-main)]`} />
                                    </button>
                                </div>
                                <div className="px-4 pb-4">
                                    <p className="text-[14px] font-bold text-[var(--text-main)] mb-1 cursor-pointer">
                                        {post.likes.toLocaleString('vi-VN')} lượt thích
                                    </p>
                                    <p className="text-[14px] text-[var(--text-muted)] font-medium cursor-pointer hover:underline mb-2">
                                        Xem tất cả {post.comments} bình luận
                                    </p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <img src={currentUser?.avatar} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                                        <input
                                            type="text"
                                            placeholder="Thêm bình luận..."
                                            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-main)] placeholder-[var(--text-muted)]"
                                        />
                                        <button className="text-sm font-bold text-[var(--accent-primary)] opacity-50 cursor-default">
                                            Đăng
                                        </button>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreatePostModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onSuccess={() => fetchBlog()}
                        currentUser={currentUser}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}