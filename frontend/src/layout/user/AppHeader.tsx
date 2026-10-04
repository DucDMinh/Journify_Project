import { BookOpen, Compass, CompassIcon, Crown, FolderKanban, LogIn, LogOut, Moon, Newspaper, PlusCircle, Settings, Sparkles, Sun, User as UserIcon, type LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { useAuth } from "@/hooks/auth/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import UserAvatar from "@/components/common/UserAvatar";

interface AppHeaderProps {
    onOpenAiPlanner: () => void;
    onCreateTrip: () => void;
    onOpenPremium: () => void;
}

interface NavItem {
    id: string;
    label: string;
    shortLabel: string;
    icon: LucideIcon;
    path?: string;
    match?: string[];
}

const NAV_ITEMS: NavItem[] = [
    { id: "dashboard", label: "Khám phá", shortLabel: "Khám phá", icon: Compass, path: "/", match: ["/", "/explore", "/itineraries"] },
    { id: "trips", label: "Lộ trình của tôi", shortLabel: "Lộ trình", icon: FolderKanban, path: "/my-itinerary", match: ["/my-itinerary"] },
    { id: "blog", label: "Blog", shortLabel: "Blog", icon: Newspaper, path: "/blog", match: ["/blog"] },
    { id: "community", label: "Cộng đồng", shortLabel: "Cộng đồng", icon: UserIcon, path: "/community", match: ["/community"] },
    { id: "tips", label: "Cẩm nang", shortLabel: "Cẩm nang", icon: BookOpen, path: "/tips", match: ["/tips"] },
    { id: "ai-planner", label: "AI Planner", shortLabel: "AI", icon: Sparkles },
];

const MOBILE_NAV_IDS = ["dashboard", "trips", "blog", "community", "ai-planner"];

const normalizePath = (pathname: string) => pathname.replace(/^\/user(?=\/|$)/, "") || "/";

const isActive = (item: NavItem, path: string) =>
    (item.match ?? []).some((prefix) => (prefix === "/" ? path === "/" : path === prefix || path.startsWith(`${prefix}/`)));

export const AppHeader = ({ onOpenAiPlanner, onCreateTrip, onOpenPremium }: AppHeaderProps) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { user: currentUser, isReady, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const path = normalizePath(usePathname() ?? "/");

    useEffect(() => {
        if (!isProfileOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsProfileOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isProfileOpen]);

    const handleNavItemClick = (item: NavItem) => {
        if (item.path) router.push(item.path);
        else onOpenAiPlanner();
    };

    const navButtonClass = (active: boolean) =>
        `flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition-all ${
            active
                ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-paper)] hover:text-[var(--text-main)]"
        }`;

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-[var(--border-color)] bg-[var(--bg-card)]/80 shadow-sm backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    <NextLink href="/" className="flex shrink-0 items-center gap-3" aria-label="Journify - Trang chủ">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-gold)] text-white shadow-md">
                            <CompassIcon className="h-5 w-5" />
                        </div>
                        <span className="font-display text-xl font-bold tracking-tight">Journify</span>
                    </NextLink>

                    <nav className="hidden items-center gap-0.5 md:flex lg:gap-1" aria-label="Điều hướng chính">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavItemClick(item)}
                                title={item.label}
                                aria-current={isActive(item, path) ? "page" : undefined}
                                className={navButtonClass(isActive(item, path))}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span className="hidden xl:inline">{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            onClick={onCreateTrip}
                            className="flex items-center gap-2 whitespace-nowrap rounded-full bg-[var(--accent-primary)] px-3 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 sm:px-4"
                            title="Tạo lộ trình"
                        >
                            <PlusCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">Tạo lộ trình</span>
                        </button>

                        <div className="flex items-center gap-2 border-l border-[var(--border-color)] pl-2">
                            <button
                                onClick={toggleTheme}
                                title={theme === "light" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
                                className="rounded-full p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-paper)]"
                            >
                                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-[var(--accent-gold)]" />}
                            </button>
                            {!isReady ? (
                                <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--border-color)]" />
                            ) : currentUser ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsProfileOpen((open) => !open)}
                                        className="block rounded-full border-2 border-[var(--accent-gold)] transition hover:scale-105 focus:outline-none"
                                        aria-label="Mở menu tài khoản"
                                    >
                                        <UserAvatar src={currentUser.avatar} name={currentUser.name} className="h-8 w-8" textClassName="text-xs" />
                                    </button>
                                    {isProfileOpen && (
                                        <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] py-1 shadow-lg">
                                            <div className="border-b border-[var(--border-color)] px-4 py-3">
                                                <p className="truncate text-sm font-bold text-[var(--text-main)]">{currentUser.name}</p>
                                                <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{currentUser.email || "Thành viên Journify"}</p>
                                            </div>
                                            <div className="py-1">
                                                <NextLink
                                                    href="/profile"
                                                    onClick={() => setIsProfileOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-[var(--text-main)] transition-colors hover:bg-[var(--bg-paper)]"
                                                >
                                                    <UserIcon className="h-4 w-4 text-[var(--text-muted)]" />
                                                    Hồ sơ cá nhân
                                                </NextLink>
                                                <NextLink
                                                    href="/settings"
                                                    onClick={() => setIsProfileOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-[var(--text-main)] transition-colors hover:bg-[var(--bg-paper)]"
                                                >
                                                    <Settings className="h-4 w-4 text-[var(--text-muted)]" />
                                                    Cài đặt
                                                </NextLink>
                                                {currentUser.is_premium ? (
                                                    <p className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-[var(--accent-gold)]">
                                                        <Crown className="h-4 w-4" />
                                                        Bạn là hội viên Premium
                                                    </p>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setIsProfileOpen(false);
                                                            onOpenPremium();
                                                        }}
                                                        className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-[var(--accent-gold)] transition-colors hover:bg-[var(--bg-paper)]"
                                                    >
                                                        <Crown className="h-4 w-4" />
                                                        Nâng cấp Premium
                                                    </button>
                                                )}
                                            </div>
                                            <div className="border-t border-[var(--border-color)] py-1">
                                                <button
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        logout();
                                                    }}
                                                    className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Đăng xuất
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <NextLink
                                    href="/auth/signin"
                                    className="flex items-center justify-center whitespace-nowrap rounded-full border border-orange-500 px-3 py-2 text-sm font-semibold text-orange-500 shadow-sm transition-all duration-300 hover:bg-orange-500 hover:text-white sm:px-5"
                                >
                                    <LogIn className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Đăng nhập</span>
                                </NextLink>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <nav
                className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-[var(--border-color)] bg-[var(--bg-card)] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:hidden"
                aria-label="Điều hướng nhanh"
            >
                {NAV_ITEMS.filter((item) => MOBILE_NAV_IDS.includes(item.id)).map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleNavItemClick(item)}
                        aria-current={isActive(item, path) ? "page" : undefined}
                        className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 text-[11px] font-medium ${
                            item.id === "ai-planner"
                                ? "text-[var(--accent-gold)]"
                                : isActive(item, path)
                                  ? "text-[var(--accent-primary)]"
                                  : "text-[var(--text-muted)]"
                        }`}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="truncate">{item.shortLabel}</span>
                    </button>
                ))}
            </nav>
        </>
    );
};
