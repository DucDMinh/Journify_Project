"use client";

import React, { useState, createContext, useContext, useCallback } from "react";
import { toast } from 'sonner';
import { AppHeader } from "@/layout/user/AppHeader";
import GlobalStyles from "@/components/user/GlobalStyles";
import { AnimatePresence } from "framer-motion";
import { CreateTripModal } from "@/components/modals/user/CreateTripModal";
import { AiPlannerModal } from "@/components/modals/user/AiPlannerModal";
import { PremiumModal } from "@/components/payment/PremiumModal";

type DashboardContextType = {
    notify: (msg: string, icon?: string) => void;
    setIsCreatingTrip: React.Dispatch<React.SetStateAction<boolean>>;
    openCreateTrip: (initialProvinceId?: string) => void;
    openAiPlanner: () => void;
    openPremium: () => void;
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
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isCreatingTrip, setIsCreatingTrip] = useState(false);
    const [initialProvinceId, setInitialProvinceId] = useState<string | undefined>();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const notify = useCallback((msg: string, icon = "✨") => {
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
    }, []);

    const openCreateTrip = useCallback((provinceId?: string) => {
        setInitialProvinceId(provinceId);
        setIsCreatingTrip(true);
    }, []);
    const openAiPlanner = useCallback(() => setIsAiModalOpen(true), []);
    const openPremium = useCallback(() => setIsPaymentModalOpen(true), []);

    return (
        <DashboardContext.Provider value={{ notify, setIsCreatingTrip, openCreateTrip, openAiPlanner, openPremium }}>
            <div className="min-h-screen paper-grid selection:bg-[var(--accent-primary)] selection:text-white">
                <GlobalStyles />
                <AppHeader onOpenAiPlanner={openAiPlanner} onCreateTrip={() => openCreateTrip()} onOpenPremium={openPremium} />
                <main className="pb-24 md:pb-20">
                    {children}
                </main>
                <AnimatePresence>
                    {isAiModalOpen && (
                        <AiPlannerModal
                            onClose={() => setIsAiModalOpen(false)}
                            onOpenPremium={openPremium}
                            notify={notify}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isCreatingTrip && (
                        <CreateTripModal
                            initialProvinceId={initialProvinceId}
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
