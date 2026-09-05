/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image as ImageIcon, MapPin, Smile, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";
import { User } from "@/interface";

const EMOTIONS = [
    { id: 'excited', icon: '🤩', label: 'Hào hứng' },
    { id: 'happy', icon: '🥰', label: 'Hạnh phúc' },
    { id: 'relaxed', icon: '😌', label: 'Thư giãn' },
    { id: 'wonderful', icon: '🌟', label: 'Tuyệt vời' },
    { id: 'wanderlust', icon: '✈️', label: 'Cuồng chân' },
];

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
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [image, setImage] = useState<File | null>(null)
    const [selectedEmotion, setSelectedEmotion] = useState<{ id: string, icon: string, label: string } | null>(null);

    const handleCreateBlog = async () => {
        try {
            const submitData = new FormData();
            submitData.append('content', content);
            if (image) submitData.append('blog_image', image);
            submitData.append('location', location);
            if (selectedEmotion) submitData.append('emotion', selectedEmotion?.label)
            if (currentUser) submitData.append('user_id', currentUser.id)

            const { data, response } = await api.post('/blogs', submitData);
            if (!response.ok) throw new Error(data.message);
            onSuccess();
            onClose();
            toast.success("Đã đăng bài");
        } catch (error) {
            toast.error(`${error}`)
        }
    }
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };
    const toggleLocation = () => {
        setShowLocationInput(!showLocationInput);
        setShowEmotionPicker(false);
    };
    const toggleEmotion = () => {
        setShowEmotionPicker(!showEmotionPicker);
        setShowLocationInput(false);
    };
    const isValidToPost = content.trim().length > 0 || imagePreview !== null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-[var(--bg-card)] rounded-[24px] shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
                    <h2 className="text-xl font-bold text-[var(--text-main)] font-display mx-auto">
                        Tạo bài viết mới
                    </h2>
                    <button
                        onClick={onClose}
                        className="absolute right-4 p-2 bg-[var(--bg-paper)] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-[var(--text-muted)] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto hide-scrollbar flex-1">
                    <div className="flex items-start gap-3 mb-4">
                        <img
                            src={currentUser?.avatar || "https://i.pravatar.cc/150"}
                            alt="avatar"
                            className="w-12 h-12 rounded-full object-cover border border-[var(--border-color)] mt-1"
                        />
                        <div>
                            <h3 className="font-bold text-[16px] text-[var(--text-main)] leading-snug">
                                {currentUser?.name || "Người dùng"}
                                {selectedEmotion && (
                                    <span className="font-normal text-[var(--text-muted)]">
                                        {" "}đang cảm thấy <span className="font-bold text-[var(--text-main)]">{selectedEmotion.icon} {selectedEmotion.label}</span>
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                <span className="text-[12px] font-semibold bg-[var(--bg-paper)] text-[var(--text-muted)] px-2 py-0.5 rounded-md">
                                    Công khai
                                </span>
                                {location && (
                                    <span className="text-[12px] font-semibold bg-rose-50 text-rose-500 dark:bg-rose-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {location}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <textarea
                        placeholder="Bạn muốn chia sẻ hành trình gì hôm nay?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-transparent text-[var(--text-main)] text-[16px] placeholder-[var(--text-muted)] resize-none outline-none min-h-[50px]"
                    />
                    {imagePreview && (
                        <div className="relative mt-2 rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-paper)]">
                            <img src={imagePreview} alt="Preview" className="w-full max-h-[300px] object-cover" />
                            <button
                                onClick={() => setImagePreview(null)}
                                className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white text-rose-500 rounded-full shadow-md backdrop-blur-md transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {showLocationInput && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-[var(--bg-paper)] rounded-xl border border-[var(--border-color)]"
                            >
                                <MapPin className="w-5 h-5 text-rose-500" />
                                <input
                                    type="text"
                                    placeholder="Bạn đang ở đâu?"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="flex-1 bg-transparent text-sm outline-none text-[var(--text-main)]"
                                    autoFocus
                                />
                                <button onClick={() => setShowLocationInput(false)} className="text-[var(--text-muted)]">
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                        {showEmotionPicker && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 overflow-hidden"
                            >
                                <div className="flex flex-wrap items-center gap-2 p-1">
                                    {EMOTIONS.map((emo) => (
                                        <button
                                            key={emo.id}
                                            onClick={() => {
                                                setSelectedEmotion(selectedEmotion?.id === emo.id ? null : emo);
                                                setShowEmotionPicker(false);
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all border ${selectedEmotion?.id === emo.id
                                                ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30 shadow-sm'
                                                : 'bg-[var(--bg-paper)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-amber-300 hover:text-[var(--text-main)]'
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
                <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
                    <div className="flex items-center justify-between p-3 mb-4 rounded-xl border border-[var(--border-color)] shadow-sm bg-[var(--bg-paper)]">
                        <span className="text-sm font-semibold text-[var(--text-main)] px-2">Thêm vào bài viết</span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <ImageIcon className="w-6 h-6 text-emerald-500" />
                            </button>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                            />
                            <button
                                onClick={toggleLocation}
                                className={`p-2 rounded-full transition-colors ${showLocationInput || location ? 'bg-rose-50 dark:bg-rose-500/20' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                            >
                                <MapPin className="w-6 h-6 text-rose-500" />
                            </button>
                            <button
                                onClick={toggleEmotion}
                                className={`p-2 rounded-full transition-colors ${showEmotionPicker || selectedEmotion ? 'bg-amber-50 dark:bg-amber-500/20' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                            >
                                <Smile className="w-6 h-6 text-amber-500" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => { handleCreateBlog() }}
                        disabled={!isValidToPost}
                        className={`w-full py-3.5 rounded-xl font-bold text-[15px] transition-all ${isValidToPost
                            ? "bg-[var(--accent-primary)] text-white shadow-lg hover:shadow-[var(--accent-primary)]/25 hover:-translate-y-0.5"
                            : "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed"
                            }`}
                    >
                        Đăng bài
                    </button>
                </div>
            </motion.div>
        </div>
    );
}