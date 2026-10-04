"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image as ImageIcon, MapPin, Smile, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";
import { User } from "@/interface";
import UserAvatar from "@/components/common/UserAvatar";
import SafeImage from "@/components/common/SafeImage";

const EMOTIONS = [
    { id: 'excited', icon: '🤩', label: 'Hào hứng' },
    { id: 'happy', icon: '🥰', label: 'Hạnh phúc' },
    { id: 'relaxed', icon: '😌', label: 'Thư giãn' },
    { id: 'wonderful', icon: '🌟', label: 'Tuyệt vời' },
    { id: 'wanderlust', icon: '✈️', label: 'Cuồng chân' },
];

const MAX_CONTENT_LENGTH = 5000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp,image/gif";

interface CreatePostModalProps {
    onClose: () => void;
    currentUser: User | null;
    onSuccess: () => void;
}

export function CreatePostModal({ onClose, currentUser, onSuccess }: CreatePostModalProps) {
    const [content, setContent] = useState("");
    const [location, setLocation] = useState("");
    const [showLocationInput, setShowLocationInput] = useState(false);
    const [showEmotionPicker, setShowEmotionPicker] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [selectedEmotion, setSelectedEmotion] = useState<(typeof EMOTIONS)[number] | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const imagePreview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);

    useEffect(() => () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
    }, [imagePreview]);

    const removeImage = () => {
        setImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!ACCEPTED_IMAGES.split(",").includes(file.type)) {
            toast.error("Chỉ chấp nhận ảnh JPEG, PNG, WEBP hoặc GIF");
            e.target.value = "";
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            toast.error("Ảnh không được vượt quá 5MB");
            e.target.value = "";
            return;
        }
        setImage(file);
    };

    const trimmedContent = content.trim();
    const isValidToPost = trimmedContent.length > 0 && content.length <= MAX_CONTENT_LENGTH && !isSubmitting;

    const handleCreateBlog = async () => {
        if (!isValidToPost) return;
        setIsSubmitting(true);
        const submitData = new FormData();
        submitData.append('content', trimmedContent);
        if (image) submitData.append('blog_image', image);
        if (location.trim()) submitData.append('location', location.trim());
        if (selectedEmotion) submitData.append('emotion', selectedEmotion.label);

        const { data, response } = await api.post('/blogs', submitData);
        setIsSubmitting(false);
        if (!response.ok) {
            toast.error(data.message || "Không đăng được bài viết, vui lòng thử lại");
            return;
        }
        onSuccess();
        onClose();
        toast.success("Đã đăng bài");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSubmitting && onClose()} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl"
            >
                <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
                    <h2 className="font-display mx-auto text-xl font-bold text-[var(--text-main)]">Tạo bài viết mới</h2>
                    <button onClick={onClose} disabled={isSubmitting} className="absolute right-4 rounded-full bg-[var(--bg-paper)] p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-bento)]" aria-label="Đóng">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-4 flex items-start gap-3">
                        <UserAvatar src={currentUser?.avatar} name={currentUser?.name} className="mt-1 h-12 w-12 border border-[var(--border-color)]" />
                        <div>
                            <h3 className="text-[16px] font-bold leading-snug text-[var(--text-main)]">
                                {currentUser?.name || "Người dùng"}
                                {selectedEmotion && (
                                    <span className="font-normal text-[var(--text-muted)]">
                                        {" "}đang cảm thấy <span className="font-bold text-[var(--text-main)]">{selectedEmotion.icon} {selectedEmotion.label}</span>
                                    </span>
                                )}
                            </h3>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                <span className="rounded-md bg-[var(--bg-paper)] px-2 py-0.5 text-[12px] font-semibold text-[var(--text-muted)]">Công khai</span>
                                {location.trim() && (
                                    <span className="flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[12px] font-semibold text-rose-500 dark:bg-rose-500/20">
                                        <MapPin className="h-3 w-3" /> {location}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <textarea
                        placeholder="Bạn muốn chia sẻ hành trình gì hôm nay?"
                        value={content}
                        maxLength={MAX_CONTENT_LENGTH}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[90px] w-full resize-none bg-transparent text-[16px] text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
                        autoFocus
                    />
                    <p className="text-right text-[11px] text-[var(--text-muted)]">{content.length}/{MAX_CONTENT_LENGTH}</p>
                    {imagePreview && (
                        <div className="relative mt-2 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-paper)]">
                            <SafeImage src={imagePreview} alt="Ảnh xem trước" className="max-h-[300px] w-full object-cover" />
                            <button onClick={removeImage} className="absolute right-2 top-2 rounded-full bg-white/80 p-2 text-rose-500 shadow-md backdrop-blur-md transition-colors hover:bg-white" aria-label="Gỡ ảnh">
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {showLocationInput && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-paper)] px-4 py-2"
                            >
                                <MapPin className="h-5 w-5 text-rose-500" />
                                <input
                                    type="text"
                                    placeholder="Bạn đang ở đâu?"
                                    value={location}
                                    maxLength={120}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="flex-1 bg-transparent text-sm text-[var(--text-main)] outline-none"
                                    autoFocus
                                />
                                <button onClick={() => setShowLocationInput(false)} className="text-[var(--text-muted)]" aria-label="Ẩn ô vị trí">
                                    <X className="h-4 w-4" />
                                </button>
                            </motion.div>
                        )}
                        {showEmotionPicker && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                                <div className="flex flex-wrap items-center gap-2 p-1">
                                    {EMOTIONS.map((emo) => (
                                        <button
                                            key={emo.id}
                                            onClick={() => {
                                                setSelectedEmotion(selectedEmotion?.id === emo.id ? null : emo);
                                                setShowEmotionPicker(false);
                                            }}
                                            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-all ${
                                                selectedEmotion?.id === emo.id
                                                    ? 'border-amber-200 bg-amber-100 text-amber-700 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400'
                                                    : 'border-[var(--border-color)] bg-[var(--bg-paper)] text-[var(--text-muted)] hover:border-amber-300 hover:text-[var(--text-main)]'
                                            }`}
                                        >
                                            {emo.icon} {emo.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="border-t border-[var(--border-color)] bg-[var(--bg-card)] p-4">
                    <div className="mb-4 flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-paper)] p-3 shadow-sm">
                        <span className="px-2 text-sm font-semibold text-[var(--text-main)]">Thêm vào bài viết</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => fileInputRef.current?.click()} className="rounded-full p-2 transition-colors hover:bg-[var(--bg-bento)]" title="Thêm ảnh" aria-label="Thêm ảnh">
                                <ImageIcon className="h-6 w-6 text-emerald-500" />
                            </button>
                            <input type="file" accept={ACCEPTED_IMAGES} className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                            <button
                                onClick={() => {
                                    setShowLocationInput(!showLocationInput);
                                    setShowEmotionPicker(false);
                                }}
                                className={`rounded-full p-2 transition-colors ${showLocationInput || location ? 'bg-rose-50 dark:bg-rose-500/20' : 'hover:bg-[var(--bg-bento)]'}`}
                                title="Thêm vị trí"
                                aria-label="Thêm vị trí"
                            >
                                <MapPin className="h-6 w-6 text-rose-500" />
                            </button>
                            <button
                                onClick={() => {
                                    setShowEmotionPicker(!showEmotionPicker);
                                    setShowLocationInput(false);
                                }}
                                className={`rounded-full p-2 transition-colors ${showEmotionPicker || selectedEmotion ? 'bg-amber-50 dark:bg-amber-500/20' : 'hover:bg-[var(--bg-bento)]'}`}
                                title="Cảm xúc"
                                aria-label="Cảm xúc"
                            >
                                <Smile className="h-6 w-6 text-amber-500" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleCreateBlog}
                        disabled={!isValidToPost}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-bold transition-all ${
                            isValidToPost
                                ? "bg-[var(--accent-primary)] text-white shadow-lg hover:-translate-y-0.5"
                                : "cursor-not-allowed bg-[var(--bg-bento)] text-[var(--text-muted)]"
                        }`}
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isSubmitting ? "Đang đăng..." : "Đăng bài"}
                    </button>
                    {!trimmedContent && image && <p className="mt-2 text-center text-xs text-[var(--text-muted)]">Hãy viết vài dòng mô tả cho bức ảnh của bạn.</p>}
                </div>
            </motion.div>
        </div>
    );
}
