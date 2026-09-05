/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, Type, ArrowRight, Sparkles } from "lucide-react";
import { Province } from "@/interface";
import { toast } from 'sonner';
import { api } from "@/lib/apiClient";
import { useDashboard } from "@/app/user/(dashboard)/layout";
import { useAuth } from "@/hooks/auth/AuthContext";
import { useRouter } from "next/navigation";

interface CreateTripModalProps {
    onClose: () => void;
}

export const CreateTripModal = ({ onClose }: CreateTripModalProps) => {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProvinces, setSelectedProvinces] = useState<Province[]>([]);
    const { user: currentUser } = useAuth();
    const { setIsCreatingTrip } = useDashboard();
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: "",
        start_date: "",
        end_date: "",
    });

    const fetchProvinces = async () => {
        try {
            const { data, response } = await api.get('/provinces');
            if (!response.ok) throw new Error(data.message || "Lỗi khi lấy dữ liệu tỉnh thành!");
            setProvinces(data.data);
        } catch (error) {
            toast.error(`Lỗi: ${error}`);
        }
    };

    useEffect(() => {
        fetchProvinces();
    }, []);
    const handleSelectProvince = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const provId = e.target.value;
        const prov = provinces.find(p => p.id === provId);
        if (prov && !selectedProvinces.some(p => p.id === prov.id)) {
            setSelectedProvinces([...selectedProvinces, prov]);
        }
        e.target.value = "";
    };
    const handleRemoveProvince = (idToRemove: string) => {
        setSelectedProvinces(selectedProvinces.filter(p => p.id !== idToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProvinces.length === 0) {
            toast.error("Vui lòng chọn ít nhất 1 điểm đến!");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Đang khởi tạo không gian làm việc...");

        try {
            const submitData = new FormData();
            if (formData.title) submitData.append('title', formData.title);
            if (formData.start_date) submitData.append('start_date', formData.start_date);
            if (formData.end_date) submitData.append('end_date', formData.end_date);
            if (currentUser?.id) submitData.append('user_id', currentUser.id);
            const provincePayload = selectedProvinces.map(p => ({
                province_id: p.id,
                provinces: p
            }));
            submitData.append('itinerary_provinces', JSON.stringify(provincePayload));
            if (selectedProvinces[0]?.image_url) {
                submitData.append('image_url', selectedProvinces[0].image_url);
            }

            const { data, response } = await api.post('/itineraries', submitData);

            if (!response.ok) throw new Error(data.message || "Lỗi khi tạo lộ trình");

            toast.success("Khởi tạo thành công!", { id: toastId });
            setIsCreatingTrip(false);
            const newTripId = data.itinerary_id || data.data?.itinerary_id;
            if (newTripId) {
                router.push(`/MyItinerary/${newTripId}/builder`);
            }

        } catch (error) {
            toast.error(`Có lỗi xảy ra: ${error}`, { id: toastId });
            setIsSubmitting(false);
        }
    };
    const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden z-10"
                >
                    <div className="relative bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 p-6 text-white overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles className="w-16 h-16" /></div>
                        <h2 className="relative z-10 font-display text-2xl font-bold mb-1">Bắt đầu hành trình</h2>
                        <p className="relative z-10 text-sm text-indigo-100">Khởi tạo chuyến đi tuyệt vời tiếp theo của bạn.</p>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" /> Điểm đến (Có thể chọn nhiều)
                            </label>
                            {selectedProvinces.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {selectedProvinces.map(prov => (
                                        <span
                                            key={prov.id}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-sm font-bold rounded-lg border border-[var(--accent-primary)]/20"
                                        >
                                            {prov.name}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProvince(prov.id)}
                                                className="hover:bg-[var(--accent-primary)] hover:text-white rounded-full p-0.5 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <select
                                defaultValue=""
                                onChange={handleSelectProvince}
                                className="w-full bg-[var(--bg-paper)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all appearance-none"
                            >
                                <option value="" disabled>+ Bấm để chọn Tỉnh/Thành phố...</option>
                                {provinces.filter(p => !selectedProvinces.some(sp => sp.id === p.id)).map(prov => (
                                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Type className="w-3.5 h-3.5" /> Tên chuyến đi
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-[var(--bg-paper)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                                placeholder="Vd: Chuyến đi thanh xuân Đà Lạt..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" /> Ngày đi
                                </label>
                                <input
                                    type="date"
                                    min={today}
                                    value={formData?.start_date || ''}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    onClick={(e) => {
                                        if ('showPicker' in HTMLInputElement.prototype) {
                                            e.currentTarget.showPicker();
                                        }
                                    }}

                                    className="w-full cursor-pointer rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white [color-scheme:light_dark]"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" /> Ngày về
                                </label>
                                <input
                                    type="date"
                                    value={formData?.end_date || ''}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    min={formData?.start_date || today}
                                    onClick={(e) => {
                                        if ('showPicker' in HTMLInputElement.prototype) {
                                            e.currentTarget.showPicker();
                                        }
                                    }}

                                    className="w-full cursor-pointer rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white [color-scheme:light_dark]"
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 rounded-xl bg-[var(--accent-primary)] text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">Đang khởi tạo...</span>
                                ) : (
                                    <span className="flex items-center gap-2">Tiếp tục lên kế hoạch <ArrowRight className="w-4 h-4" /></span>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};