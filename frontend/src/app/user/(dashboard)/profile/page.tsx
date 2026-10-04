"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, Edit3, Map, Newspaper, Camera, Compass, UploadCloud, Save, X, Phone, Mail, User as UserIcon, Crown, Loader2, Plus } from "lucide-react";
import { toast } from 'sonner';
import { useAuth } from "@/hooks/auth/AuthContext";
import { useDashboard } from "@/app/user/(dashboard)/layout";
import { api } from "@/lib/apiClient";
import { Blog, User } from "@/interface";
import SafeImage from "@/components/common/SafeImage";
import UserAvatar from "@/components/common/UserAvatar";
import { PostCard } from "@/components/user/community/PostCard";
import { EMAIL_PATTERN, PHONE_PATTERN, formatCost, formatPhone } from "@/lib/format";

const COVER_FALLBACK = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000&auto=format&fit=crop";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type ProfileForm = { name: string; email: string; phone_number: string };

const toForm = (user?: User | null): ProfileForm => ({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone_number: formatPhone(user?.phone_number),
});

const usePreviewUrl = (file: File | null) => {
    const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => () => {
        if (url) URL.revokeObjectURL(url);
    }, [url]);
    return url;
};

const pickImage = (event: React.ChangeEvent<HTMLInputElement>, onPick: (file: File) => void) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh");
        return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
        toast.error("Ảnh không được vượt quá 5MB");
        return;
    }
    onPick(file);
};

export default function UserProfilePage() {
    const [activeTab, setActiveTab] = useState<"trips" | "blog">("trips");
    const [user, setUser] = useState<User | null>(null);
    const [posts, setPosts] = useState<Blog[] | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState<ProfileForm>(toForm(null));
    const { user: currentUser, refreshSession } = useAuth();
    const { openCreateTrip } = useDashboard();
    const avatarPreview = usePreviewUrl(avatarFile);
    const bgPreview = usePreviewUrl(bgFile);
    const userId = currentUser?.id;

    const loadProfile = useCallback(async (id: string) => {
        const [profile, blogs] = await Promise.all([api.get<User>(`/users/${id}`), api.get<Blog[]>("/blogs")]);
        if (!profile.response.ok || !profile.data.data) {
            toast.error(profile.data.message || "Không tải được hồ sơ");
            return;
        }
        setUser(profile.data.data);
        setFormData(toForm(profile.data.data));
        setPosts(blogs.response.ok ? (blogs.data.data ?? []).filter((post) => post.user_id?.id === id) : []);
    }, []);

    useEffect(() => {
        if (!userId) return;
        let ignore = false;
        Promise.all([api.get<User>(`/users/${userId}`), api.get<Blog[]>("/blogs")]).then(([profile, blogs]) => {
            if (ignore) return;
            if (!profile.response.ok || !profile.data.data) {
                toast.error(profile.data.message || "Không tải được hồ sơ");
                return;
            }
            setUser(profile.data.data);
            setFormData(toForm(profile.data.data));
            setPosts(blogs.response.ok ? (blogs.data.data ?? []).filter((post) => post.user_id?.id === userId) : []);
        });
        return () => {
            ignore = true;
        };
    }, [userId]);

    const initialForm = toForm(user);
    const changedFields = (Object.keys(formData) as (keyof ProfileForm)[]).filter((key) => formData[key].trim() !== initialForm[key]);
    const hasChanges = changedFields.length > 0 || avatarFile !== null || bgFile !== null;

    const validate = () => {
        if (!formData.name.trim()) return "Họ tên không được để trống";
        if (!EMAIL_PATTERN.test(formData.email.trim())) return "Email không hợp lệ";
        if (changedFields.includes("phone_number") && formData.phone_number.trim() && !PHONE_PATTERN.test(formData.phone_number.replace(/[\s.-]/g, ""))) {
            return "Số điện thoại không hợp lệ (VD: 0912345678)";
        }
        return null;
    };

    const handleSaveAll = async () => {
        if (!user) return;
        const error = validate();
        if (error) {
            toast.error(error);
            return;
        }
        setIsSaving(true);
        const toastId = toast.loading("Đang lưu thay đổi...");
        const body = new FormData();
        changedFields.forEach((key) => body.append(key, formData[key].trim()));
        if (avatarFile) body.append("avatar", avatarFile);
        if (bgFile) body.append("background_image", bgFile);

        const { response, data } = await api.patch(`/users/${user.id}`, body);
        if (!response.ok) {
            setIsSaving(false);
            toast.error(data.message || "Cập nhật thất bại!", { id: toastId });
            return;
        }
        setAvatarFile(null);
        setBgFile(null);
        setIsEditModalOpen(false);
        await Promise.all([refreshSession(), loadProfile(user.id)]);
        setIsSaving(false);
        toast.success("Cập nhật thông tin thành công!", { id: toastId });
    };

    const cancelEdit = () => {
        setFormData(toForm(user));
        setIsEditModalOpen(false);
    };

    if (!user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-paper)] text-[var(--accent-primary)]">
                <Compass className="mb-4 h-10 w-10 animate-spin" />
                <p className="font-bold">Đang tải hồ sơ...</p>
            </div>
        );
    }

    const trips = user.itineraries ?? [];
    const joinDate = user.created_at ? `tháng ${new Date(user.created_at).getMonth() + 1}/${new Date(user.created_at).getFullYear()}` : "chưa rõ";
    const stats = [
        { label: "Lộ trình", value: trips.length },
        { label: "Công khai", value: trips.filter((trip) => trip.share).length },
        { label: "Bài viết", value: posts?.length ?? 0 },
        { label: "Lượt thích", value: (posts ?? []).reduce((sum, post) => sum + (post.likes ?? 0), 0) },
    ];

    return (
        <div className="relative min-h-screen bg-[var(--bg-paper)] pb-20">
            <div className="group relative h-64 w-full overflow-hidden bg-gray-200 md:h-80">
                <SafeImage src={bgPreview ?? user.background_image} fallback={COVER_FALLBACK} alt="Ảnh bìa" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-xs transition-all duration-300 group-hover:opacity-100">
                    <label className="flex cursor-pointer items-center justify-center rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-gray-800 shadow-lg transition-all hover:bg-gray-100">
                        <UploadCloud className="mr-2 h-4 w-4 text-[var(--accent-primary)]" /> Thay ảnh bìa
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => pickImage(e, setBgFile)} />
                    </label>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-16 mb-8 sm:-mt-24">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
                            <div className="group relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-[var(--bg-paper)] bg-[var(--bg-card)] shadow-md sm:h-40 sm:w-40">
                                <UserAvatar src={avatarPreview ?? user.avatar} name={user.name} className="h-full w-full" textClassName="text-5xl" />
                                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" title="Đổi ảnh đại diện">
                                    <Camera className="h-6 w-6 text-white" />
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => pickImage(e, setAvatarFile)} />
                                </label>
                            </div>
                            <div className="pb-2">
                                <h1 className="font-display flex items-center gap-2 text-3xl font-bold text-[var(--text-main)]">
                                    {user.name}
                                    {user.is_premium && <Crown className="h-6 w-6 text-amber-500" aria-label="Hội viên Premium" />}
                                </h1>
                                <p className="text-sm font-medium text-[var(--text-muted)]">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 pb-2">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-5 py-2.5 font-bold text-[var(--text-main)] shadow-sm transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white sm:flex-none"
                            >
                                <Edit3 className="h-4 w-4" /> Chỉnh sửa
                            </button>
                            {(avatarFile || bgFile) && (
                                <>
                                    <button
                                        onClick={() => {
                                            setAvatarFile(null);
                                            setBgFile(null);
                                        }}
                                        disabled={isSaving}
                                        className="rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
                                    >
                                        Hủy ảnh mới
                                    </button>
                                    <button
                                        onClick={handleSaveAll}
                                        disabled={isSaving}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white shadow-md ring-4 ring-emerald-500/20 transition-all hover:bg-emerald-700 disabled:opacity-60 sm:flex-none"
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu ảnh
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-[var(--text-muted)]">
                            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Việt Nam</span>
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Tham gia {joinDate}</span>
                            {user.phone_number && <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {formatPhone(user.phone_number)}</span>}
                        </div>
                        <div className="mt-6 flex flex-wrap items-center gap-6">
                            {stats.map((stat) => (
                                <div key={stat.label} className="flex flex-col">
                                    <span className="text-xl font-bold text-[var(--text-main)]">{stat.value}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mb-8 flex items-center gap-8 overflow-x-auto border-b border-[var(--border-color)] [&::-webkit-scrollbar]:hidden">
                    {[
                        { id: "trips" as const, label: "Lộ trình của tôi", icon: Map },
                        { id: "blog" as const, label: "Bài viết của tôi", icon: Newspaper },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 whitespace-nowrap border-b-2 pb-4 text-sm font-bold transition-colors ${
                                activeTab === tab.id ? "border-[var(--accent-primary)] text-[var(--accent-primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            }`}
                        >
                            <tab.icon className="h-4 w-4" /> {tab.label}
                        </button>
                    ))}
                </div>
                {activeTab === "trips" && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {trips.map((trip) => (
                            <Link
                                key={trip.id}
                                href={`/my-itinerary/${trip.id}/builder`}
                                className="group flex flex-col overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm transition-all hover:shadow-lg"
                            >
                                <div className="relative h-48 overflow-hidden bg-gray-200">
                                    <SafeImage src={trip.image_url} alt={trip.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    {trip.share && (
                                        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                                            <Compass className="h-3 w-3 text-[var(--accent-gold)]" /> Công khai
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col justify-between p-4">
                                    <h3 className="mb-2 line-clamp-2 text-lg font-bold transition-colors group-hover:text-[var(--accent-primary)]">{trip.title}</h3>
                                    <div className="mt-2 flex items-center justify-between text-sm font-medium text-[var(--text-muted)]">
                                        <span>{trip.days || 1} ngày · {formatCost(trip.estimated_cost)}</span>
                                        <Edit3 className="h-4 w-4 group-hover:text-[var(--accent-primary)]" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                        <button
                            onClick={() => openCreateTrip()}
                            className="flex h-[280px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[var(--border-color)] text-[var(--text-muted)] transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 hover:text-[var(--accent-primary)]"
                        >
                            <Plus className="mb-3 h-10 w-10" />
                            <span className="font-bold">Tạo lộ trình mới</span>
                        </button>
                    </div>
                )}

                {activeTab === "blog" &&
                    (posts === null ? (
                        <div className="h-40 animate-pulse rounded-3xl bg-[var(--border-color)]" />
                    ) : posts.length === 0 ? (
                        <div className="py-20 text-center">
                            <Newspaper className="mx-auto mb-4 h-16 w-16 text-[var(--text-muted)] opacity-30" />
                            <h3 className="mb-2 text-lg font-bold">Chưa có bài viết nào</h3>
                            <p className="mb-6 text-[var(--text-muted)]">Hãy chia sẻ những câu chuyện du lịch của bạn.</p>
                            <Link href="/blog" className="rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90">
                                Viết bài đầu tiên
                            </Link>
                        </div>
                    ) : (
                        <div className="mx-auto max-w-2xl space-y-6">
                            {posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    currentUser={currentUser}
                                    compact
                                    onToggleLike={() => toast.info("Hãy thả tim bài viết của người khác trong mục Cộng đồng nhé!")}
                                    onDelete={async (target) => {
                                        const { response, data } = await api.delete(`/blogs/${target.id}`);
                                        if (!response.ok) {
                                            toast.error(data.message || "Không xóa được bài viết");
                                            return;
                                        }
                                        setPosts((prev) => (prev ?? []).filter((p) => p.id !== target.id));
                                        toast.success("Đã xóa bài viết");
                                    }}
                                    onCommentCount={(id, comments) => setPosts((prev) => (prev ?? []).map((p) => (p.id === id ? { ...p, comments } : p)))}
                                />
                            ))}
                        </div>
                    ))}
            </div>
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSaveAll();
                        }}
                        className="relative w-full max-w-lg rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-2xl"
                    >
                        <div className="mb-5 flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                            <h3 className="flex items-center gap-2 text-xl font-bold text-[var(--text-main)]">
                                <Edit3 className="h-5 w-5 text-[var(--accent-primary)]" /> Chỉnh sửa thông tin
                            </h3>
                            <button type="button" onClick={cancelEdit} className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-paper)] hover:text-[var(--text-main)]" aria-label="Đóng">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {[
                                { key: "name" as const, label: "Họ và tên", icon: UserIcon, type: "text", placeholder: "Nhập tên của bạn", maxLength: 100 },
                                { key: "email" as const, label: "Email", icon: Mail, type: "email", placeholder: "Nhập địa chỉ email", maxLength: 254 },
                                { key: "phone_number" as const, label: "Số điện thoại", icon: Phone, type: "tel", placeholder: "VD: 0912345678", maxLength: 15 },
                            ].map((field) => (
                                <div key={field.key}>
                                    <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                        <field.icon className="h-4 w-4" /> {field.label}
                                    </label>
                                    <input
                                        type={field.type}
                                        value={formData[field.key]}
                                        maxLength={field.maxLength}
                                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-paper)] px-4 py-3 text-sm font-medium text-[var(--text-main)] outline-none transition-colors focus:border-[var(--accent-primary)]"
                                        placeholder={field.placeholder}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[var(--border-color)] pt-6">
                            <button type="button" onClick={cancelEdit} className="rounded-xl px-5 py-2.5 text-sm font-bold text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-paper)]">
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || !hasChanges}
                                className="flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Lưu thay đổi
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
