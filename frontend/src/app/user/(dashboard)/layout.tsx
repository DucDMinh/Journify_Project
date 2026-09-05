
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { toast } from 'sonner';
import { AppHeader } from "@/layout/user/AppHeader";
import { usePathname } from "next/navigation";
import GlobalStyles from "@/components/user/GlobalStyles";
import { useAuth } from "@/hooks/auth/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { CreateTripModal } from "@/components/modals/user/CreateTripModal";
import { AiPlannerModal } from "@/components/modals/user/AiPlannerModal";
import { PremiumModal } from "@/components/payment/PremiumModal";

type DashboardContextType = {
    notify: (msg: string, icon?: string) => void;
    setIsCreatingTrip: React.Dispatch<React.SetStateAction<boolean>>;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error("useDashboard phải được sử dụng bên trong UserDashboardLayout");
    }
    return context;
};

export default function UserDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [activeNav, setActiveNav] = useState("dashboard");
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isCreatingTrip, setIsCreatingTrip] = useState(false);
    const [theme, setTheme] = useState<"day" | "night">("day");
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const { user: currentUser } = useAuth();
    useEffect(() => {
        if (pathname === "/") setActiveNav("dashboard");
        else if (pathname.includes("/MyItinerary")) setActiveNav("trips");
        else if (pathname.includes("/wishlist")) setActiveNav("wishlist");
    }, [pathname]);
    useEffect(() => {
        if (theme === "night") {
            document.documentElement.classList.add("theme-night");
        } else {
            document.documentElement.classList.remove("theme-night");
        }
    }, [theme]);
    const notify = (msg: string, icon = "✨") => {
        toast(
            <div className="flex items-center gap-2.5 font-medium text-sm">
                <span className="text-lg">{icon}</span>
                <span>{msg}</span>
            </div>,
            {
                style: {
                    borderRadius: "16px",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-color)",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    padding: "12px 16px",
                },
            }
        );
    };

    return (
        <DashboardContext.Provider value={{ notify, setIsCreatingTrip }}>
            <div className="min-h-screen paper-grid selection:bg-[var(--accent-primary)] selection:text-white">
                <GlobalStyles />
                <AppHeader
                    setActiveNav={setActiveNav}
                    setIsAiModalOpen={setIsAiModalOpen}
                    setIsCreatingTrip={setIsCreatingTrip}
                    setTheme={setTheme}
                    currentUser={currentUser}
                    theme={theme}
                    activeNav={activeNav}
                />
                <main className="pb-20">
                    {children}
                </main>
                <AnimatePresence>
                    {isAiModalOpen && (
                        <AiPlannerModal
                            onClose={() => setIsAiModalOpen(false)}
                            onSuccess={(newTrip) => {
                            }}
                            onOpenPremium={() => setIsPaymentModalOpen(true)}
                            notify={notify}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isCreatingTrip && (
                        <CreateTripModal
                            onClose={() => setIsCreatingTrip(false)}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isPaymentModalOpen && (
                        <PremiumModal
                            onClose={() => setIsPaymentModalOpen(false)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </DashboardContext.Provider>
    );
}
