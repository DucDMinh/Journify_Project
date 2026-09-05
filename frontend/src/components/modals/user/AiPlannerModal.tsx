/* eslint-disable @typescript-eslint/no-explicit-any */
import { Itinerary } from "@/interface";
import { AnimatePresence, motion } from "framer-motion";
import { CompassIcon, Send, Sparkles, X, Lock, Crown } from "lucide-react";
import { useState } from "react";
import { TripDetailModal2 } from "./TripDetailModal2";
import { useAuth } from "@/hooks/auth/AuthContext";
import { toast } from 'sonner';
import { api } from "@/lib/apiClient";
import { useRouter } from "next/navigation";

export function AiPlannerModal({
    onClose,
    onSuccess,
    notify,
    onOpenPremium
}: {
    onClose: () => void;
    onSuccess: (trip: Itinerary) => void;
    notify: (msg: string, icon: string) => void;
    onOpenPremium?: () => void;
}) {
    const [prompt, setPrompt] = useState("");
    const [days, setDays] = useState(3);
    const [style, setStyle] = useState("Thư giãn & Healing");
    const [budgetAmount, setBudgetAmount] = useState<number>(3000000);
    const [activeTripDetail, setActiveTripDetail] = useState<Itinerary | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [stepText, setStepText] = useState("");
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const isPremium = currentUser?.is_premium === true;

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!prompt.trim()) {
            notify("Vui lòng nhập điểm đến hoặc ý tưởng chuyến đi", "⚠️");
            return;
        }
        if (days <= 0) {
            notify("Số ngày đi phải lớn hơn 0", "⚠️");
            return;
        }

        setIsGenerating(true);

        const steps = [
            "AI đang phân tích yêu cầu của bạn...",
            "Đang quét dữ liệu địa điểm từ hệ thống...",
            "Đang sắp xếp tuyến đường tối ưu nhất...",
            "Đang tính toán ngân sách và thời gian...",
            "Sắp xong rồi! Đang đóng gói lộ trình..."
        ];

        let stepIdx = 0;
        setStepText(steps[0]);
        const interval = setInterval(() => {
            stepIdx++;
            setStepText(steps[stepIdx % steps.length]);
        }, 1200);

        try {
            const enrichedPrompt = `Đi ${prompt.trim()}. Phong cách: ${style}. Ngân sách: khoảng ${budgetAmount.toLocaleString('vi-VN')} VNĐ.`;
            const { response, data } = await api.post('/ai/planner', { prompt: enrichedPrompt, days_count: days });
            clearInterval(interval);
            if (!response.ok || !data.success) {
                localStorage.setItem("userData", JSON.stringify(data.user))
                onClose()
                throw new Error(data.message || "Có lỗi xảy ra khi tạo lộ trình AI");
            }
            const rawAiData = data.data;
            const now = Date.now();
            const hydratedItinerary: Itinerary = {
                id: `ai-iti-${now}`,
                title: rawAiData.title || `Lộ trình ${days} ngày: ${prompt}`,
                summary: rawAiData.summary || "",
                theme: rawAiData.theme || style,
                estimated_cost: rawAiData.estimated_cost || 0,
                start_date: new Date().toISOString(),
                end_date: new Date(now + days * 86400000).toISOString(),
                days: days,
                nights: days > 1 ? days - 1 : 0,
                image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop",
                share: false,
                user_id: currentUser as any || null,
                itinerary_provinces: rawAiData.itinerary_provinces?.map((prov: any) => ({
                    province_id: prov.province_id,
                    provinces: {
                        id: prov.province_id,
                        name: prov.province_name || "Việt Nam"
                    }
                })) || [],
                itinerary_days: rawAiData.itinerary_days?.map((day: any, dIdx: number) => ({
                    id: `ai-day-${now}-${dIdx}`,
                    day_number: day.day_number || dIdx + 1,
                    title: day.title || `Ngày ${dIdx + 1}`,
                    itinerary_locations: day.itinerary_locations?.map((loc: any, lIdx: number) => ({
                        id: `ai-loc-${now}-${dIdx}-${lIdx}`,
                        day_id: `ai-day-${now}-${dIdx}`,
                        location_id: loc.location_id || "",
                        location_name: loc.location_name || "",
                        lat: loc.lat || 0,
                        lng: loc.lng || 0,
                        sequence_order: loc.sequence_order || lIdx + 1,
                        start_time: loc.start_time || "08:00",
                        end_time: loc.end_time || "10:00",
                        cost: loc.cost || 0,
                        activity_note: loc.activity_note || "",
                        locations: {
                            id: loc.location_id || "",
                            name: loc.location_name || "",
                            img: undefined,
                            difficulty_level: undefined
                        }
                    })) || []
                })) || []
            };

            notify("Tuyệt vời! Lộ trình AI đã sẵn sàng", "✨");
            setIsGenerating(false);
            setActiveTripDetail(hydratedItinerary);
            if (onSuccess) onSuccess(hydratedItinerary);
        } catch (error: any) {
            clearInterval(interval);
            setIsGenerating(false);
            notify(error.message || "Lỗi kết nối đến server AI", "❌");
            console.error("AI Planner Error:", error);
        }
    };

    const handleCloneTrip = async (iti: Itinerary) => {
        const toastId = toast.loading("Đang lưu lộ trình vào hệ thống...");
        try {
            const cleanDays = iti.itinerary_days?.map((day: any) => {
                const cleanLocations = day.itinerary_locations?.map((loc: any) => ({
                    location_id: loc.location_id,
                    sequence_order: loc.sequence_order,
                    start_time: loc.start_time,
                    end_time: loc.end_time,
                    cost: loc.cost,
                    activity_note: loc.activity_note,
                    location_name: loc.location_name,
                    lat: loc.lat,
                    lng: loc.lng
                }));

                return {
                    day_number: day.day_number,
                    title: day.title,
                    itinerary_locations: cleanLocations
                };
            });
            const cleanProvinces = iti.itinerary_provinces?.map((prov: any) => ({
                province_id: prov.province_id
            })) || [];

            const payload = {
                title: iti.title,
                summary: iti.summary,
                theme: iti.theme,
                start_date: iti.start_date,
                end_date: iti.end_date,
                days: iti.days,
                nights: iti.nights,
                estimated_cost: iti.estimated_cost,
                share: false,
                itinerary_days: cleanDays,
                itinerary_provinces: cleanProvinces,
                user_id: currentUser?.id
            };

            const { data, response } = await api.post(`/itineraries`, payload);

            if (!response.ok) throw new Error(data?.message || "Lỗi khi lưu lộ trình");

            toast.success(`Đã lưu "${iti.title}" thành công!`, { id: toastId });
            setActiveTripDetail(null);
            onClose();

        } catch (err: any) {
            console.error("Lỗi lưu lộ trình:", err);
            toast.error(err.message || "Có lỗi xảy ra khi lưu lộ trình", { id: toastId });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isGenerating && onClose()} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[32px] p-6 sm:p-8 shadow-2xl z-10 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-gold)] rounded-full blur-3xl opacity-20 pointer-events-none" />
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-gold)] flex items-center justify-center text-white shadow-md">
                            <Sparkles className="w-5 h-5 animate-spin-slow" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-lg">AI Travel Designer</h3>
                            <p className="text-xs text-[var(--text-muted)] font-medium">Soạn thảo lộ trình cá nhân hóa trong vài giây</p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={isGenerating} className="p-2 rounded-full hover:bg-[var(--bg-paper)] text-[var(--text-muted)] transition-colors disabled:opacity-50">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {!isPremium ? (
                    <div className="py-8 text-center flex flex-col items-center justify-center space-y-5 relative z-10">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                                <Sparkles className="w-8 h-8 text-slate-400" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-[var(--bg-card)]">
                                <Lock className="w-4 h-4" />
                            </div>
                        </div>

                        <div>
                            <h4 className="font-display font-bold text-xl text-[var(--text-main)] mb-2">Tính năng Đặc quyền</h4>
                            <p className="text-sm text-[var(--text-muted)] max-w-[280px] mx-auto leading-relaxed">
                                AI Travel Designer chỉ dành riêng cho thành viên Premium. Nâng cấp ngay để tạo lộ trình không giới hạn!
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                onClose();
                                if (currentUser) {
                                    onOpenPremium?.();
                                } else {
                                    router.push('/auth/signin');
                                    toast.error("Vui lòng đăng nhập để tiếp tục")
                                }
                            }}
                            className="w-full sm:w-auto mt-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-sm font-bold shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Crown className="w-4 h-4" />
                            <span>Mở khóa Premium ngay</span>
                        </button>
                    </div>

                ) : isGenerating ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-16 h-16"><div className="absolute inset-0 rounded-full border-4 border-[var(--accent-primary)]/20 animate-ping" /><div className="w-full h-full rounded-full border-4 border-t-[var(--accent-primary)] border-r-[var(--accent-gold)] border-b-transparent border-l-transparent animate-spin" /><CompassIcon className="w-6 h-6 text-[var(--accent-primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>
                        <h4 className="font-display font-bold text-base animate-pulse text-[var(--text-main)]">{stepText}</h4>
                    </div>
                ) : (
                    <form onSubmit={handleGenerate} className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Bạn muốn đi đâu hoặc trải nghiệm gì? *</label>
                            <textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="VD: Phú Yên 3 ngày cùng nhóm bạn 4 người..." className="w-full p-4 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-sm font-medium outline-none focus:border-[var(--accent-primary)] transition-colors resize-none leading-relaxed" required />
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {["Nghỉ dưỡng Đà Lạt", "Food Tour Hải Phòng", "Phượt xe máy Hà Giang", "Biển Phú Quý"].map((hint) => (
                                <button key={hint} type="button" onClick={() => setPrompt(hint)} className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all">+ {hint}</button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Thời gian (Ngày)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="w-full p-3.5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-sm font-bold outline-none focus:border-[var(--accent-primary)] transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Phong cách</label>
                                <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-sm font-bold outline-none focus:border-[var(--accent-primary)] transition-colors">
                                    <option value="Thư giãn & Healing">🌿 Chữa lành & Chill</option>
                                    <option value="Ẩm thực & Food Tour">🍜 Ăn sập địa phương</option>
                                    <option value="Nhiếp ảnh & Check-in">📸 Sống ảo & Cafe</option>
                                    <option value="Trekking & Khám phá">⛰️ Mạo hiểm & Trekking</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                    Ngân sách dự kiến
                                </label>
                                <span className="text-sm font-bold text-[var(--accent-primary)]">
                                    {budgetAmount.toLocaleString('vi-VN')} VNĐ
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="0"
                                    step="100000"
                                    value={budgetAmount}
                                    onChange={(e) => setBudgetAmount(Number(e.target.value))}
                                    className="w-1/3 p-3 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] text-sm font-bold outline-none focus:border-[var(--accent-primary)] transition-colors"
                                    placeholder="Nhập số..."
                                />
                                <input
                                    type="range"
                                    min="500000"
                                    max="50000000"
                                    step="500000"
                                    value={budgetAmount}
                                    onChange={(e) => setBudgetAmount(Number(e.target.value))}
                                    className="w-2/3 h-2 bg-[var(--bg-paper)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)] border border-[var(--border-color)]"
                                />
                            </div>
                            <div className="flex justify-end text-[10px] text-[var(--text-muted)] mt-1.5 font-medium px-1">
                                <span>Kéo tối đa 50.000.000đ</span>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-end gap-3 border-t border-[var(--border-color)]">
                            <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-paper)] transition-colors">Hủy bỏ</button>
                            <button type="submit" className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)] text-white text-xs font-bold shadow-lg shadow-[var(--accent-primary)]/25 hover:opacity-95 transition-all flex items-center gap-2">
                                <Send className="w-3.5 h-3.5" /><span>Bắt đầu tạo lộ trình</span>
                            </button>
                        </div>
                    </form>
                )}
            </motion.div>
            <AnimatePresence>
                {activeTripDetail && (
                    <TripDetailModal2 currentUser={currentUser} itinerary={activeTripDetail} onClose={() => setActiveTripDetail(null)} onClone={() => handleCloneTrip(activeTripDetail)} />
                )}
            </AnimatePresence>
        </div>
    );
}