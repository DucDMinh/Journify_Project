/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { User } from "@/interface";
import { Compass, CompassIcon, Crown, FolderKanban, LogIn, LogOut, Moon, Newspaper, PlusCircle, Settings, Sparkles, Sun, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { useAuth } from "@/hooks/auth/AuthContext";
import { PremiumModal } from "@/components/payment/PremiumModal";

interface AppHeaderProp {
    setActiveNav: React.Dispatch<React.SetStateAction<string>>;
    setIsAiModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setIsCreatingTrip: React.Dispatch<React.SetStateAction<boolean>>,
    setTheme: React.Dispatch<React.SetStateAction<"day" | "night">>,
    currentUser: User | null,
    theme: "day" | "night",
    activeNav: string
}

const NavItems = [
    { id: "dashboard", label: "Khám phá", icon: Compass, path: '/' },
    { id: "trips", label: "Lộ trình của tôi", icon: FolderKanban, path: '/MyItinerary' },
    { id: "wishlist", label: "Blog", icon: Newspaper, path: '/Blog' },
    { id: "community", label: "Cộng đồng", icon: UserIcon, path: '/Community' },
    { id: "ai-planner", label: "AI Planner", icon: Sparkles },
];

export const AppHeader = ({
    setActiveNav,
    setIsAiModalOpen,
    setIsCreatingTrip,
    setTheme,
    currentUser,
    theme,
    activeNav
}: AppHeaderProp) => {
    const [isMounted, setIsMounted] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const { logout } = useAuth();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };

        if (isProfileOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isProfileOpen]);
    useEffect(() => {
        setIsMounted(true);
    }, []);
    const router = useRouter();
    const handleNavItemClick = (item: any) => {
        setActiveNav(item.id);
        if (item.path) {
            router.push(item.path);
        }
        else if (item.id === "ai-planner") {
            setIsAiModalOpen(true);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-40 bg-[var(--bg-card)]/80 backdrop-blur-xl border-b border-[var(--border-color)] shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
                    <div
                        className="flex items-center gap-3 shrink-0 cursor-pointer"
                        onClick={() => { setActiveNav("dashboard"); router.push('/'); }}
                    >
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-gold)] flex items-center justify-center text-white shadow-md">
                            <CompassIcon className="w-5 h-5" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight hidden sm:inline">Journify</span>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        {NavItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavItemClick(item)}
                                className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${activeNav === item.id
                                    ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-paper)]"
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}

                        <button
                            onClick={() => {
                                setIsCreatingTrip(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--accent-primary)] text-white text-sm font-bold shadow-md hover:opacity-90 transition"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Tạo lộ trình</span>
                        </button>

                        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[var(--border-color)]">
                            <button
                                onClick={() => setTheme((t) => (t === "day" ? "night" : "day"))}
                                className="p-2 rounded-full hover:bg-[var(--bg-paper)] text-[var(--text-muted)] transition"
                            >
                                {theme === "day" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[var(--accent-gold)]" />}
                            </button>
                            {!isMounted ? (
                                <div className="w-24 h-9 bg-gray-200 rounded-full animate-pulse"></div>
                            ) : currentUser ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="block focus:outline-none"
                                    >
                                        <img
                                            src={currentUser.avatar || "/images/user/owner.jpg"}
                                            alt="avatar"
                                            className="w-8 h-8 rounded-full border-2 border-[var(--accent-gold)] object-cover hover:scale-105 transition"
                                        />
                                    </button>
                                    {isProfileOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 z-50 transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2">
                                            <div className="px-4 py-3 border-b border-[var(--border-color)]">
                                                <p className="text-sm font-bold text-[var(--text-main)] truncate">
                                                    {currentUser.name}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                                                    {currentUser.email || "Thành viên Journify"}
                                                </p>
                                            </div>
                                            <div className="py-1">
                                                <NextLink
                                                    href="/Profile"
                                                    onClick={() => setIsProfileOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:bg-[var(--bg-paper)] transition-colors"
                                                >
                                                    <UserIcon className="w-4 h-4 text-[var(--text-muted)]" />
                                                    Hồ sơ cá nhân
                                                </NextLink>

                                                <NextLink
                                                    href="/settings"
                                                    onClick={() => setIsProfileOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:bg-[var(--bg-paper)] transition-colors"
                                                >
                                                    <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                                                    Cài đặt
                                                </NextLink>
                                                {currentUser.is_premium ? (<>
                                                    <button
                                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-[var(--accent-gold)] hover:bg-[var(--bg-paper)] transition-colors"
                                                    >
                                                        <Crown className="w-4 h-4" />
                                                        Bạn là hội viên Premium
                                                    </button>
                                                </>) : (<>
                                                    <button
                                                        onClick={() => {
                                                            setIsProfileOpen(false);
                                                            setIsPaymentModalOpen(true);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-[var(--accent-gold)] hover:bg-[var(--bg-paper)] transition-colors"
                                                    >
                                                        <Crown className="w-4 h-4" />
                                                        Nâng cấp Premium
                                                    </button></>)}

                                            </div>
                                            <div className="border-t border-[var(--border-color)] py-1">
                                                <button
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        logout();
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Đăng xuất
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <NextLink
                                    href="/auth/signin"
                                    className="flex items-center justify-center px-6 py-2 text-sm font-semibold text-orange-500 border border-orange-500 rounded-full hover:bg-orange-500 hover:text-white transition-all duration-300 shadow-sm whitespace-nowrap"
                                >
                                    <LogIn className="w-4 h-4 mr-1" />
                                    Đăng nhập
                                </NextLink>
                            )}
                        </div>
                    </div>
                </div>
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-color)] z-50 flex justify-around items-center py-2 px-2 shadow-lg">
                    {NavItems.slice(0, 4).map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavItemClick(item)}
                            className={`flex flex-col items-center gap-0.5 text-xs font-medium ${activeNav === item.id ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                    <button
                        onClick={() => setIsAiModalOpen(true)}
                        className="flex flex-col items-center gap-0.5 text-xs font-medium text-[var(--accent-gold)]"
                    >
                        <Sparkles className="w-5 h-5" />
                        <span>AI</span>
                    </button>
                </div>
            </header>
            {isPaymentModalOpen && <>
                <PremiumModal onClose={() => setIsPaymentModalOpen(false)} />
            </>}
        </>
    )
}