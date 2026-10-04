"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Palette, Globe, Shield, LogOut, ChevronRight, Eye, EyeOff, Loader2, Info, Monitor, Moon, Sun } from "lucide-react";
import { toast } from 'sonner';
import { useAuth } from "@/hooks/auth/AuthContext";
import { useTheme, type ThemePreference } from "@/context/ThemeContext";
import { api } from "@/lib/apiClient";

const MIN_PASSWORD_LENGTH = 6;

const TABS = [
    { id: "account", label: "Tài khoản & Bảo mật", icon: Shield },
    { id: "preferences", label: "Giao diện & Ngôn ngữ", icon: Palette },
] as const;

const THEME_OPTIONS: { id: ThemePreference; label: string; icon: typeof Sun }[] = [
    { id: "light", label: "Sáng", icon: Sun },
    { id: "dark", label: "Tối", icon: Moon },
    { id: "system", label: "Theo hệ thống", icon: Monitor },
];

const inputClass =
    "w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-paper)] px-4 py-3 pr-11 text-sm font-medium text-[var(--text-main)] outline-none transition-colors focus:border-[var(--accent-primary)]";

function PasswordField({ label, value, onChange, placeholder, autoComplete }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; autoComplete: string }) {
    const [visible, setVisible] = useState(false);
    return (
        <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</label>
            <div className="relative">
                <input type={visible ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} className={inputClass} />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("account");
    const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
    const [isSaving, setIsSaving] = useState(false);
    const { user: currentUser, logout } = useAuth();
    const { preference, setPreference } = useTheme();

    const passwordError = (() => {
        if (!passwords.current || !passwords.next || !passwords.confirm) return "Vui lòng nhập đầy đủ ba ô mật khẩu";
        if (passwords.next.length < MIN_PASSWORD_LENGTH) return `Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`;
        if (passwords.next === passwords.current) return "Mật khẩu mới phải khác mật khẩu hiện tại";
        if (passwords.next !== passwords.confirm) return "Mật khẩu xác nhận không khớp";
        return null;
    })();

    const handleChangePassword = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!currentUser) return;
        if (passwordError) {
            toast.error(passwordError);
            return;
        }
        setIsSaving(true);
        const toastId = toast.loading("Đang đổi mật khẩu...");
        const { data, response } = await api.patch(`/users/${currentUser.id}`, { password: passwords.next, oldPassword: passwords.current });
        setIsSaving(false);
        if (!response.ok) {
            toast.error(data.message || "Không đổi được mật khẩu, vui lòng thử lại", { id: toastId });
            return;
        }
        toast.success("Đổi mật khẩu thành công", { id: toastId });
        setPasswords({ current: "", next: "", confirm: "" });
    };

    return (
        <div className="min-h-screen bg-[var(--bg-paper)] pb-20 pt-5">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8 md:mb-12">
                    <h1 className="font-display mb-2 text-3xl font-bold text-[var(--text-main)] md:text-4xl">Cài đặt</h1>
                    <p className="font-medium text-[var(--text-muted)]">Quản lý bảo mật và trải nghiệm cá nhân của bạn.</p>
                </div>

                <div className="flex flex-col gap-8 md:flex-row lg:gap-12">
                    <aside className="w-full shrink-0 md:w-72">
                        <div className="sticky top-24 flex gap-2 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden md:flex-col md:overflow-visible md:pb-0">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-3.5 text-left font-bold transition-all md:whitespace-normal ${
                                        activeTab === tab.id
                                            ? "bg-[var(--accent-primary)] text-white shadow-md"
                                            : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
                                    }`}
                                >
                                    <tab.icon className="h-5 w-5" />
                                    <span className="flex-1">{tab.label}</span>
                                    {activeTab === tab.id && <ChevronRight className="hidden h-4 w-4 opacity-50 md:block" />}
                                </button>
                            ))}
                            <div className="my-4 hidden h-px w-full bg-[var(--border-color)] md:block"></div>
                            <button onClick={logout} className="hidden items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-bold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 md:flex">
                                <LogOut className="h-5 w-5" />
                                Đăng xuất
                            </button>
                        </div>
                    </aside>
                    <main className="min-w-0 flex-1">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-8">
                                {activeTab === "account" && (
                                    <>
                                        <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm md:p-8">
                                            <div className="mb-6 flex items-center gap-3">
                                                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-paper)] p-2.5">
                                                    <Lock className="h-5 w-5 text-[var(--accent-primary)]" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-[var(--text-main)]">Đổi mật khẩu</h2>
                                                    <p className="mt-1 text-sm text-[var(--text-muted)]">Mật khẩu mới cần ít nhất {MIN_PASSWORD_LENGTH} ký tự và khác mật khẩu hiện tại.</p>
                                                </div>
                                            </div>

                                            <form onSubmit={handleChangePassword} className="max-w-lg space-y-4">
                                                <input type="email" value={currentUser?.email ?? ""} autoComplete="username" readOnly hidden />
                                                <PasswordField label="Mật khẩu hiện tại" value={passwords.current} onChange={(current) => setPasswords({ ...passwords, current })} placeholder="Nhập mật khẩu hiện tại" autoComplete="current-password" />
                                                <PasswordField label="Mật khẩu mới" value={passwords.next} onChange={(next) => setPasswords({ ...passwords, next })} placeholder="Nhập mật khẩu mới" autoComplete="new-password" />
                                                <PasswordField label="Xác nhận mật khẩu mới" value={passwords.confirm} onChange={(confirm) => setPasswords({ ...passwords, confirm })} placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" />
                                                {passwords.confirm && passwords.next !== passwords.confirm && <p className="text-xs font-medium text-red-500">Mật khẩu xác nhận không khớp</p>}
                                                <div className="pt-2">
                                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-60">
                                                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Cập nhật mật khẩu
                                                    </button>
                                                </div>
                                            </form>
                                        </section>
                                        <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 md:p-8">
                                            <div className="flex items-start gap-3">
                                                <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-secondary)]" />
                                                <div>
                                                    <h2 className="text-base font-bold text-[var(--text-main)]">Xóa tài khoản</h2>
                                                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                                                        Việc xóa tài khoản sẽ xóa vĩnh viễn lộ trình, bài viết và lịch sử giao dịch của bạn. Để bảo vệ dữ liệu, yêu cầu xóa tài khoản được xử lý bởi quản trị viên Journify.
                                                    </p>
                                                </div>
                                            </div>
                                        </section>
                                    </>
                                )}
                                {activeTab === "preferences" && (
                                    <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm md:p-8">
                                        <h2 className="mb-6 text-xl font-bold text-[var(--text-main)]">Tùy chỉnh giao diện</h2>
                                        <div className="max-w-lg space-y-6">
                                            <div>
                                                <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                                    <Palette className="h-4 w-4" /> Chủ đề màu
                                                </label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {THEME_OPTIONS.map((option) => (
                                                        <button
                                                            key={option.id}
                                                            onClick={() => setPreference(option.id)}
                                                            aria-pressed={preference === option.id}
                                                            className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-sm font-bold transition-all ${
                                                                preference === option.id
                                                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white shadow-md'
                                                                    : 'border-[var(--border-color)] bg-[var(--bg-paper)] text-[var(--text-muted)] hover:border-[var(--accent-primary)]'
                                                            }`}
                                                        >
                                                            <option.icon className="h-4 w-4" />
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="mt-2 text-xs text-[var(--text-muted)]">Lựa chọn được ghi nhớ trên trình duyệt này.</p>
                                            </div>
                                            <div className="border-t border-[var(--border-color)] pt-4">
                                                <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                                    <Globe className="h-4 w-4" /> Ngôn ngữ
                                                </label>
                                                <p className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-paper)] px-4 py-3 text-sm font-bold text-[var(--text-main)]">Tiếng Việt</p>
                                                <p className="mt-2 text-xs text-[var(--text-muted)]">Phiên bản hiện tại hỗ trợ tiếng Việt.</p>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </motion.div>
                        </AnimatePresence>
                        <button onClick={logout} className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-3 font-bold text-red-500 transition-all hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-500/10 md:hidden">
                            <LogOut className="h-5 w-5" /> Đăng xuất
                        </button>
                    </main>
                </div>
            </div>
        </div>
    );
}
