/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lock, Bell, Palette, Globe,
    Shield, Trash2, LogOut, ChevronRight,
    Smartphone, Mail
} from "lucide-react";
import { toast } from 'sonner';
import { useAuth } from "@/hooks/auth/AuthContext";
import { api } from "@/lib/apiClient";
import { useRouter } from "next/navigation";

const Toggle = ({ enabled, setEnabled }: { enabled: boolean, setEnabled: (val: boolean) => void }) => (
    <div
        onClick={() => setEnabled(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-[var(--accent-primary)]' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
);

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("account");
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [notiEmail, setNotiEmail] = useState(true);
    const [notiPush, setNotiPush] = useState(true);
    const [notiMarketing, setNotiMarketing] = useState(false);
    const [theme, setTheme] = useState("system");
    const [language, setLanguage] = useState("vi");
    const { user: currentUser, logout } = useAuth();
    const router = useRouter();

    const handleChangePassword = async (passwords: any) => {
        const toastId = toast.loading("Changing...");
        try {
            if (passwords.new != passwords.confirm) {
                toast.error("Mật khẩu phải trùng nhau", { id: toastId });
                return;
            }
            const { data, response } = await api.patch(`/users/${currentUser?.id}`, { password: passwords.new, oldPassword: passwords.current })
            if (!response.ok) throw new Error(data.message || `loi cmnr`);
            toast.success("Đổi mật khẩu thành công", { id: toastId })
            setPasswords({ current: "", new: "", confirm: "" })
        } catch (error: any) {
            toast.error(`${error}`, { id: toastId })
        }
    }

    const TABS = [
        { id: "account", label: "Tài khoản & Bảo mật", icon: Shield },
        { id: "preferences", label: "Giao diện & Ngôn ngữ", icon: Palette },
        { id: "notifications", label: "Thông báo", icon: Bell },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-paper)] pt-5 pb-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 md:mb-12">
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-[var(--text-main)] mb-2">
                        Cài đặt
                    </h1>
                    <p className="text-[var(--text-muted)] font-medium">
                        Quản lý tùy chọn, bảo mật và trải nghiệm cá nhân của bạn.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                    <aside className="w-full md:w-72 shrink-0">
                        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible [&::-webkit-scrollbar]:hidden pb-4 md:pb-0 sticky top-24">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all whitespace-nowrap md:whitespace-normal text-left ${activeTab === tab.id
                                        ? "bg-[var(--accent-primary)] text-white shadow-md"
                                        : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
                                        }`}
                                >
                                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-white" : ""}`} />
                                    <span className="flex-1">{tab.label}</span>
                                    {activeTab === tab.id && <ChevronRight className="w-4 h-4 hidden md:block opacity-50" />}
                                </button>
                            ))}

                            <div className="hidden md:block w-full h-px bg-[var(--border-color)] my-4"></div>

                            <button onClick={() => {
                                logout()
                                router.push("/")
                            }
                            } className="hidden md:flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-left">
                                <LogOut className="w-5 h-5" />
                                Đăng xuất
                            </button>
                        </div>
                    </aside>
                    <main className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8"
                            >
                                {activeTab === "account" && (
                                    <>
                                        <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-sm">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-2.5 bg-[var(--bg-paper)] rounded-xl border border-[var(--border-color)]">
                                                    <Lock className="w-5 h-5 text-[var(--accent-primary)]" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-[var(--text-main)]">Đổi mật khẩu</h2>
                                                    <p className="text-sm text-[var(--text-muted)] mt-1">Đảm bảo tài khoản của bạn đang sử dụng mật khẩu mạnh.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4 max-w-lg">
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Mật khẩu hiện tại</label>
                                                    <input
                                                        required
                                                        type="password"
                                                        value={passwords.current}
                                                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                                        placeholder="Nhập mật khẩu hiện tại"
                                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-medium outline-none focus:border-[var(--accent-primary)] transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Mật khẩu mới</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        value={passwords.new}
                                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                        placeholder="Nhập mật khẩu mới"
                                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-medium outline-none focus:border-[var(--accent-primary)] transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Xác nhận mật khẩu mới</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        value={passwords.confirm}
                                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                        placeholder="Nhập lại mật khẩu mới"
                                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-medium outline-none focus:border-[var(--accent-primary)] transition-colors"
                                                    />
                                                </div>

                                                <div className="pt-2">
                                                    <button onClick={() => handleChangePassword(passwords)} className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-md">
                                                        Cập nhật mật khẩu
                                                    </button>
                                                </div>
                                            </div>
                                        </section>
                                        <section className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-3xl p-6 md:p-8">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2.5 bg-red-100 dark:bg-red-900/50 rounded-xl">
                                                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                </div>
                                                <h2 className="text-xl font-bold text-red-700 dark:text-red-400">Vùng nguy hiểm</h2>
                                            </div>

                                            <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-6 max-w-2xl leading-relaxed">
                                                Xóa tài khoản là hành động không thể hoàn tác. Toàn bộ dữ liệu về lộ trình, bài viết, đánh giá và thông tin cá nhân của bạn sẽ bị xóa vĩnh viễn khỏi hệ thống.
                                            </p>

                                            <button className="px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors shadow-sm">
                                                Xóa tài khoản của tôi
                                            </button>
                                        </section>
                                    </>
                                )}
                                {activeTab === "preferences" && (
                                    <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-sm">
                                        <h2 className="text-xl font-bold text-[var(--text-main)] mb-6">Tùy chỉnh giao diện</h2>

                                        <div className="space-y-6 max-w-lg">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                                    <Palette className="w-4 h-4" /> Chủ đề (Theme)
                                                </label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {["light", "dark", "system"].map(t => (
                                                        <button
                                                            key={t}
                                                            onClick={() => setTheme(t)}
                                                            className={`py-2.5 text-sm font-bold rounded-xl border ${theme === t ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white shadow-md' : 'bg-[var(--bg-paper)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent-primary)]'}`}
                                                        >
                                                            {t === 'light' ? 'Sáng' : t === 'dark' ? 'Tối' : 'Hệ thống'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-[var(--border-color)]">
                                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                                    <Globe className="w-4 h-4" /> Ngôn ngữ
                                                </label>
                                                <select
                                                    value={language}
                                                    onChange={(e) => setLanguage(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-bold outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer appearance-none"
                                                >
                                                    <option value="vi">Tiếng Việt</option>
                                                    <option value="en">English</option>
                                                </select>
                                            </div>
                                        </div>
                                    </section>
                                )}
                                {activeTab === "notifications" && (
                                    <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-sm">
                                        <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">Tùy chọn thông báo</h2>
                                        <p className="text-sm text-[var(--text-muted)] mb-8">Chọn cách chúng tôi liên lạc và những thông tin bạn muốn nhận.</p>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between pb-6 border-b border-[var(--border-color)]">
                                                <div className="flex gap-4 pr-4">
                                                    <div className="p-2 bg-[var(--bg-paper)] rounded-xl h-fit border border-[var(--border-color)]">
                                                        <Mail className="w-5 h-5 text-[var(--accent-primary)]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[var(--text-main)]">Cập nhật qua Email</p>
                                                        <p className="text-sm text-[var(--text-muted)] mt-1">Nhận email về lộ trình, đánh giá và hoạt động tài khoản.</p>
                                                    </div>
                                                </div>
                                                <Toggle enabled={notiEmail} setEnabled={setNotiEmail} />
                                            </div>
                                            <div className="flex items-center justify-between pb-6 border-b border-[var(--border-color)]">
                                                <div className="flex gap-4 pr-4">
                                                    <div className="p-2 bg-[var(--bg-paper)] rounded-xl h-fit border border-[var(--border-color)]">
                                                        <Smartphone className="w-5 h-5 text-[var(--accent-primary)]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[var(--text-main)]">Thông báo đẩy (Push)</p>
                                                        <p className="text-sm text-[var(--text-muted)] mt-1">Thông báo trực tiếp trên trình duyệt khi có người tương tác.</p>
                                                    </div>
                                                </div>
                                                <Toggle enabled={notiPush} setEnabled={setNotiPush} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-4 pr-4">
                                                    <div className="p-2 bg-[var(--bg-paper)] rounded-xl h-fit border border-[var(--border-color)]">
                                                        <Bell className="w-5 h-5 text-[var(--accent-primary)]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[var(--text-main)]">Khuyến mãi & Tin tức</p>
                                                        <p className="text-sm text-[var(--text-muted)] mt-1">Nhận thông tin về các ưu đãi du lịch và cập nhật tính năng mới.</p>
                                                    </div>
                                                </div>
                                                <Toggle enabled={notiMarketing} setEnabled={setNotiMarketing} />
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </div>
    );
}