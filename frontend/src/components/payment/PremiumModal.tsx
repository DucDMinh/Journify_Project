/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/hooks/auth/AuthContext";
import { api } from "@/lib/apiClient";
import { usePayOS } from "@payos/payos-checkout";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Crown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from 'sonner';

interface PremiumModalProps {
    onClose: () => void;
}

const features = [
    "Tạo lộ trình AI vô hạn số lần",
    "Clone và lưu trữ lộ trình không giới hạn",
    "Trải nghiệm mượt mà không quảng cáo",
    "Hỗ trợ ưu tiên 24/7 từ đội ngũ"
];

const plans = [
    { id: 1, months: 1, price: 10, title: "1 Tháng" },
    { id: 3, months: 3, price: 25, title: "3 Tháng" },
    { id: 6, months: 6, price: 40, title: "6 Tháng", isPopular: true },
    { id: 12, months: 12, price: 60, title: "1 Năm" },
];

const Message = ({ message }: { message: string }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
        <div className="bg-[var(--bg-card)] p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border border-[var(--border-color)]">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[var(--text-main)]">Thành công!</h3>
            <p className="text-[var(--text-muted)] font-medium mb-6">{message}</p>
            <button
                onClick={() => window.location.reload()}
                className="w-full py-3 rounded-xl bg-[var(--accent-primary)] text-white font-bold hover:opacity-90 transition"
            >
                Hoàn tất
            </button>
        </div>
    </div>
);

export function PremiumModal({ onClose }: PremiumModalProps) {
    const [selectedPlan, setSelectedPlan] = useState<number>(40);
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [isCreatingLink, setIsCreatingLink] = useState(false);
    const { user: currentUser, login } = useAuth();
    const [orderId, setOrderId] = useState('');
    const [payOSConfig, setPayOSConfig] = useState({
        RETURN_URL: window.location.href,
        ELEMENT_ID: "embedded-payment-container",
        CHECKOUT_URL: '',
        embedded: true,
        onSuccess: (event: any) => {
            setIsOpen(false);
            const toastId = toast.loading("Thanh toán thành công! Đang cập nhật hệ thống...");
            setTimeout(async () => {
                try {
                    const { data, response } = await api.get('/auth/refresh-token');
                    if (!response.ok) throw new Error("Co loi xay ra")
                    login(data.token, data.user);
                    toast.success("Tài khoản đã được nâng cấp Premium 👑", { id: toastId });
                    setMessage("Cảm ơn bạn! Tài khoản của bạn đã là Premium.");
                } catch (error) {
                    toast.error("Có lỗi khi làm mới dữ liệu, vui lòng F5 trang.", { id: toastId });
                }
            }, 2000);
        },
        onCancel: (event: any) => {
            console.log("Khách đã hủy thanh toán:", event);
            setIsOpen(false);
            setPayOSConfig((old) => ({ ...old, CHECKOUT_URL: '' }));
            exit();
        }
    });

    const handleCreateOrder = async (selectedPlan: number) => {
        setIsCreatingLink(true);
        const toastId = toast.loading("Đang khởi tạo giao dịch...");
        const currentUrl = window.location.href;
        try {
            const { data, response } = await api.post('/create-embedded-payment-link', {
                selectedPlan: selectedPlan,
                userId: currentUser?.id,
                returnUrl: currentUrl
            });

            if (!response.ok) {
                throw new Error(data.message || "Có lỗi xảy ra khi tạo giao dịch");
            }
            setOrderId(data.orderId);
            setPayOSConfig((oldConfig) => ({
                ...oldConfig,
                CHECKOUT_URL: data.checkoutUrl,
            }));

            toast.success("Khởi tạo thành công!", { id: toastId });
            setIsOpen(true);

        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsCreatingLink(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        try {
            const { data, response } = await api.patch(`/orders/${orderId}`, { status: "CANCEL" })
            if (!response.ok) throw new Error(data.message);
        } catch (error) {
            console.log(error)
        }
    }

    const { open, exit } = usePayOS(payOSConfig);


    useEffect(() => {
        if (payOSConfig.CHECKOUT_URL != '') {
            open();
        }
    }, [payOSConfig]);

    return message ? (
        <Message message={message} />
    ) : (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                        if (!isOpen) onClose();
                    }}
                    className="fixed inset-0 bg-slate-900/70 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={`relative w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-2xl z-10 overflow-hidden flex flex-col transition-all duration-500 ease-in-out ${isOpen ? "md:flex-row max-w-3xl gap-6 md:gap-8" : "max-w-sm gap-0"
                        }`}
                >
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-gold)] rounded-full blur-3xl opacity-20 pointer-events-none" />
                    <button
                        onClick={() => {
                            if (isOpen) exit();
                            handleCancelOrder(orderId)
                            onClose();
                        }}
                        disabled={isCreatingLink}
                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--bg-paper)] text-[var(--text-muted)] transition-colors disabled:opacity-50 z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    {isOpen && (
                        <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-[var(--border-color)] pb-6 md:pb-0 md:pr-6 animate-in fade-in zoom-in duration-500">
                            <div className="text-center mb-4">
                                <h3 className="font-display font-bold text-lg text-[var(--text-main)]">Thanh toán Quét mã QR</h3>
                                <p className="text-xs text-[var(--text-muted)] mt-1">Sử dụng App ngân hàng bất kỳ để quét mã</p>
                            </div>
                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex-1 min-h-[350px] relative flex items-center justify-center">
                                <div
                                    id="embedded-payment-container"
                                    className="w-full h-full absolute inset-0"
                                ></div>
                            </div>

                            <p className="text-center text-[11px] font-medium text-orange-500 mt-4 bg-orange-500/10 py-2 rounded-lg">
                                ⏳ Vui lòng đợi 5-10s sau khi thanh toán thành công để hệ thống cập nhật.
                            </p>
                        </div>
                    )}
                    <div className={`w-full flex flex-col transition-all duration-500 ${isOpen ? "md:w-1/2" : ""}`}>
                        <div className="flex flex-col items-center text-center mb-5 relative z-10 mt-1">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FFD700] to-[#FFA500] flex items-center justify-center text-white shadow-lg shadow-orange-500/30 mb-3">
                                <Crown className="w-6 h-6" />
                            </div>
                            <h3 className="font-display font-bold text-xl bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">
                                Nâng cấp Premium
                            </h3>
                            <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
                                Trải nghiệm du lịch thông minh không giới hạn
                            </p>
                        </div>
                        {!isOpen && (
                            <ul className="space-y-2.5 mb-5 bg-[var(--bg-paper)]/50 p-3.5 rounded-xl border border-[var(--border-color)] relative z-10">
                                {features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                        <span className="text-[13px] text-[var(--text-main)] font-medium leading-tight">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="grid grid-cols-2 gap-3 relative z-10 mb-5">
                            {plans.map((plan) => {
                                const isSelected = selectedPlan === plan.price;
                                const basePrice = 10;
                                const originalTotal = basePrice * plan.months;
                                const savedPercent = plan.months > 1
                                    ? Math.round(((originalTotal - plan.price) / originalTotal) * 100)
                                    : 0;

                                return (
                                    <div
                                        key={plan.id}
                                        onClick={() => !isOpen && setSelectedPlan(plan.price)}
                                        className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 text-center ${isOpen ? "cursor-default opacity-80" : "cursor-pointer"
                                            } ${isSelected
                                                ? "border-orange-500 bg-orange-500/10 shadow-sm"
                                                : "border-[var(--border-color)] bg-[var(--bg-paper)] hover:border-orange-400/50"
                                            }`}
                                    >
                                        {plan.isPopular && !isOpen && (
                                            <div className="absolute -top-2.5 inset-x-0 flex justify-center">
                                                <span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full shadow-sm">
                                                    Phổ biến
                                                </span>
                                            </div>
                                        )}
                                        <span className={`font-bold text-xs mt-1 ${isSelected ? 'text-orange-500' : 'text-[var(--text-muted)]'}`}>
                                            {plan.title}
                                        </span>
                                        <div className={`text-xl font-black my-1 ${isSelected ? 'text-orange-500' : 'text-[var(--text-main)]'}`}>
                                            {plan.price}K
                                        </div>
                                        {savedPercent > 0 ? (
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${isSelected ? 'text-orange-500 bg-orange-500/10' : 'text-orange-500/80 bg-orange-500/5'}`}>
                                                Tiết kiệm {savedPercent}%
                                            </span>
                                        ) : (
                                            <span className="text-[10px] px-2 py-0.5 opacity-0 select-none">.</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {!isOpen ? (
                            <button
                                id="create-payment-link-btn"
                                onClick={(event) => {
                                    event.preventDefault();
                                    handleCreateOrder(selectedPlan);
                                }}
                                disabled={isCreatingLink}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-sm font-bold shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100 relative z-10"
                            >
                                {isCreatingLink ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Đang tạo mã QR...</span>
                                    </>
                                ) : (
                                    <>
                                        <Crown className="w-4 h-4" />
                                        <span>Nâng cấp ngay với {selectedPlan}K</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={(event) => {
                                    event.preventDefault();
                                    setIsOpen(false);
                                    handleCancelOrder(orderId)
                                    exit();
                                }}
                                className="w-full py-3.5 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all mt-auto"
                            >
                                Hủy giao dịch
                            </button>
                        )}

                        {!isOpen && (
                            <p className="text-center text-[10px] font-medium text-[var(--text-muted)] mt-3 relative z-10">
                                Gia hạn tự động. Hủy bất cứ lúc nào.
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}