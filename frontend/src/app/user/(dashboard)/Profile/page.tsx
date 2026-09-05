/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
    MapPin, Calendar, Edit3, Map, Heart,
    Star, Camera, Compass,
    UploadCloud, Save, X, Phone, Mail, User as UserIcon
} from "lucide-react";
import { useAuth } from "@/hooks/auth/AuthContext";
import { api } from "@/lib/apiClient";
import { User, Itinerary } from "@/interface";
import { toast } from 'sonner';

export default function UserProfilePage() {
    const [activeTab, setActiveTab] = useState("trips");
    const [user, setUser] = useState<User | undefined>();
    const [isLoading, setIsLoading] = useState(true);
    const { user: currentUser, login } = useAuth();
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone_number: ""
    });

    const userCoverDefault = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000&auto=format&fit=crop";
    const userAvatarDefault = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop";
    const displayAvatar = avatarFile ? URL.createObjectURL(avatarFile) : (user?.avatar || userAvatarDefault);
    const displayBg = bgFile ? URL.createObjectURL(bgFile) : ((user as any)?.background_image || userCoverDefault);

    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            if (!currentUser?.id) return;
            const { data, response } = await api.get(`/users/${currentUser?.id}`);
            if (!response.ok) throw new Error(data.message || `Lỗi khi lấy dữ liệu người dùng`);
            const userData = data?.data || data?.data?.data;
            setUser(userData);
            setFormData({
                name: userData?.name || "",
                email: userData?.email || "",
                phone_number: userData?.phone_number ? String(userData.phone_number) : ""
            });
        } catch (error: any) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [currentUser]);

    const hasChanges = useMemo(() => {
        if (!user) return false;
        if (avatarFile !== null || bgFile !== null) return true;
        if (formData.name !== (user.name || "")) return true;
        if (formData.email !== (user.email || "")) return true;
        if (formData.phone_number !== (user.phone_number ? String(user.phone_number) : "")) return true;
        return false;
    }, [user, avatarFile, bgFile, formData]);

    const handleSaveAll = async () => {
        if (!user?.id) return;
        const toastId = toast.loading("Đang lưu tất cả thay đổi...");

        try {
            const body = new FormData();
            body.append("name", formData.name);
            body.append("email", formData.email);
            if (formData.phone_number) {
                body.append("phone_number", formData.phone_number);
            }
            if (avatarFile) {
                body.append("avatar", avatarFile);
            }
            if (bgFile) {
                body.append("background_image", bgFile);
            }

            const { response, data } = await api.patch(`/users/${user.id}`, body);
            if (!response.ok) throw new Error(data?.error_detail || "Cập nhật thất bại!");
            toast.success("Cập nhật thông tin thành công!", { id: toastId });
            setAvatarFile(null);
            setBgFile(null);
            const { data: data1, response: response1 } = await api.get('/auth/refresh-token');
            if (!response1.ok) throw new Error(data1?.error_detail || "Cập nhật thất bại!");
            login(data1.token, data1.user)

        } catch (error: any) {
            console.error("Lỗi cập nhật:", error);
            toast.error(error.message || "Cập nhật thất bại!", { id: toastId });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-paper)] flex flex-col items-center justify-center text-[var(--accent-primary)]">
                <Compass className="w-10 h-10 animate-spin-slow mb-4" />
                <p className="font-bold">Đang tải hồ sơ...</p>
            </div>
        );
    }

    const userName = formData.name || user?.name || "Người dùng ẩn danh";
    const userHandle = formData.email || user?.email || "@traveler";
    const userBio = "Thành viên của cộng đồng đam mê xê dịch.";
    const userLocation = "Việt Nam";

    let joinDate = "Chưa rõ";
    if (user?.created_at) {
        const d = new Date(user.created_at);
        joinDate = `Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
    }

    const totalTrips = user?.itineraries?.length || 0;
    const myTrips = user?.itineraries || [];

    return (
        <div className="min-h-screen bg-[var(--bg-paper)] pb-20 relative">
            <div className="relative w-full h-64 md:h-80 bg-gray-200 group overflow-hidden">
                <img
                    src={displayBg}
                    alt="Cover"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 backdrop-blur-xs transition-all duration-300">
                    <label className="flex cursor-pointer items-center justify-center rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-gray-800 shadow-lg hover:bg-gray-100 transition-all">
                        <UploadCloud className="mr-2 h-4 w-4 text-[var(--accent-primary)]" /> Thay ảnh bìa
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files ? e.target.files[0] : null;
                                if (file) setBgFile(file);
                            }}
                        />
                    </label>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-16 sm:-mt-24 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[var(--bg-paper)] overflow-hidden shadow-md bg-[var(--bg-card)] shrink-0 group">
                                <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Camera className="w-6 h-6 text-white" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files ? e.target.files[0] : null;
                                            if (file) setAvatarFile(file);
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="pb-2">
                                <h1 className="text-3xl font-display font-bold text-[var(--text-main)]">{userName}</h1>
                                <p className="text-sm font-medium text-[var(--text-muted)]">{userHandle}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pb-2 flex-wrap">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] font-bold hover:bg-[var(--accent-primary)] hover:text-white hover:border-[var(--accent-primary)] transition-colors shadow-sm"
                            >
                                <Edit3 className="w-4 h-4" /> Chỉnh sửa
                            </button>
                            {hasChanges && (
                                <button
                                    onClick={handleSaveAll}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-md animate-bounce"
                                >
                                    <Save className="w-4 h-4" /> Lưu thay đổi
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 max-w-2xl">
                        <p className="text-[var(--text-main)] leading-relaxed">{userBio}</p>

                        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm font-medium text-[var(--text-muted)]">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {userLocation}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Tham gia {joinDate}</span>
                            {formData.phone_number && (
                                <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {formData.phone_number}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-6 mt-6">
                            <div className="flex flex-col"><span className="text-xl font-bold text-[var(--text-main)]">{totalTrips}</span><span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">Lộ trình</span></div>
                            <div className="flex flex-col"><span className="text-xl font-bold text-[var(--text-main)]">0</span><span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">Đã lưu</span></div>
                            <div className="flex flex-col cursor-pointer hover:opacity-80"><span className="text-xl font-bold text-[var(--text-main)]">0</span><span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">Người theo dõi</span></div>
                            <div className="flex flex-col cursor-pointer hover:opacity-80"><span className="text-xl font-bold text-[var(--text-main)]">0</span><span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">Đang theo dõi</span></div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-8 border-b border-[var(--border-color)] mb-8 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                    {[
                        { id: "trips", label: "Lộ trình của tôi", icon: Map },
                        { id: "blog", label: "Blog cá nhân", icon: Heart },
                        { id: "reviews", label: "Đánh giá", icon: Star }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>
                {activeTab === "trips" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myTrips.map((trip: Itinerary) => (
                            <div key={trip.id} className="group bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col">
                                <div className="h-48 relative overflow-hidden bg-gray-200">
                                    <img
                                        src={trip.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'}
                                        alt={trip.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {trip.share && (
                                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                            <Compass className="w-3 h-3 text-[var(--accent-gold)]" /> Công khai
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex flex-col flex-1 justify-between">
                                    <h3 className="font-bold text-lg line-clamp-2 mb-2 group-hover:text-[var(--accent-primary)] transition-colors">{trip.title}</h3>
                                    <div className="flex justify-between items-center text-sm font-medium text-[var(--text-muted)] mt-2">
                                        <span>{trip.days || 0} ngày</span>
                                        <Edit3 className="w-4 h-4 hover:text-[var(--accent-primary)]" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="h-[280px] rounded-3xl border-2 border-dashed border-[var(--border-color)] flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-colors cursor-pointer">
                            <Compass className="w-10 h-10 mb-3" />
                            <span className="font-bold">Tạo lộ trình mới</span>
                        </div>
                    </div>
                )}

                {activeTab === "blog" && (
                    <div className="text-center py-20">
                        <Heart className="w-16 h-16 mx-auto text-[var(--text-muted)] opacity-30 mb-4" />
                        <h3 className="text-lg font-bold mb-2">Chưa có bài viết nào</h3>
                        <p className="text-[var(--text-muted)]">Hãy chia sẻ những câu chuyện du lịch của bạn.</p>
                    </div>
                )}

                {activeTab === "reviews" && (
                    <div className="text-center py-20">
                        <Star className="w-16 h-16 mx-auto text-[var(--text-muted)] opacity-30 mb-4" />
                        <h3 className="text-lg font-bold mb-2">Chưa có đánh giá nào</h3>
                        <p className="text-[var(--text-muted)]">Những đánh giá của bạn về các địa điểm sẽ xuất hiện tại đây.</p>
                    </div>
                )}
            </div>
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-lg rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)] mb-5">
                            <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                                <Edit3 className="w-5 h-5 text-[var(--accent-primary)]" /> Chỉnh sửa thông tin
                            </h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full hover:bg-[var(--bg-paper)] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                                    <UserIcon className="w-4 h-4" /> Họ và tên
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-medium outline-none focus:border-[var(--accent-primary)] transition-colors"
                                    placeholder="Nhập tên của bạn"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                                    <Mail className="w-4 h-4" /> Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-medium outline-none focus:border-[var(--accent-primary)] transition-colors"
                                    placeholder="Nhập địa chỉ email"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                                    <Phone className="w-4 h-4" /> Số điện thoại
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-medium outline-none focus:border-[var(--accent-primary)] transition-colors"
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-[var(--border-color)]">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--bg-paper)] transition-colors"
                            >
                                Đóng (Giữ thay đổi)
                            </button>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-md"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}