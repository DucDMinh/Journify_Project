import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, MapPin, Calendar, Type, ArrowRight, Sparkles, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import { Province } from "@/interface";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/hooks/auth/AuthContext";
import { countTripDays, todayIso } from "@/lib/format";

interface CreateTripModalProps {
    onClose: () => void;
    initialProvinceId?: string;
}

const inputClass =
    "w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-paper)] px-4 py-3 text-sm font-medium text-[var(--text-main)] transition-all focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] [color-scheme:light] dark:[color-scheme:dark]";

export const CreateTripModal = ({ onClose, initialProvinceId }: CreateTripModalProps) => {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProvinces, setSelectedProvinces] = useState<Province[]>([]);
    const [formData, setFormData] = useState({ title: "", start_date: "", end_date: "" });
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const today = todayIso();

    useEffect(() => {
        let ignore = false;
        api.get<Province[]>('/provinces').then(({ data, response }) => {
            if (ignore) return;
            if (!response.ok) {
                toast.error(data.message || "Không tải được danh sách tỉnh thành");
                return;
            }
            const list = data.data ?? [];
            setProvinces(list);
            const initial = list.find((p) => p.id === initialProvinceId);
            if (initial) setSelectedProvinces([initial]);
        });
        return () => {
            ignore = true;
        };
    }, [initialProvinceId]);

    const handleSelectProvince = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const prov = provinces.find((p) => p.id === e.target.value);
        if (prov && !selectedProvinces.some((p) => p.id === prov.id)) setSelectedProvinces([...selectedProvinces, prov]);
        e.target.value = "";
    };

    const tripDays = countTripDays(formData.start_date, formData.end_date);
    const hasInvalidDates = Boolean(formData.start_date && formData.end_date && !tripDays);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProvinces.length === 0) {
            toast.error("Vui lòng chọn ít nhất 1 điểm đến!");
            return;
        }
        if (hasInvalidDates) {
            toast.error("Ngày về phải sau hoặc bằng ngày đi");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Đang khởi tạo không gian làm việc...");
        const payload = {
            title: formData.title.trim(),
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            ...(tripDays ? { days: tripDays, nights: tripDays - 1 } : {}),
            itinerary_provinces: selectedProvinces.map((p) => ({ province_id: p.id })),
            image_url: selectedProvinces[0]?.image_url || null,
        };
        const { data, response } = await api.post<{ itinerary_id?: string; id?: string }>('/itineraries', payload);
        if (!response.ok) {
            toast.error(data.message || "Không tạo được lộ trình", { id: toastId });
            setIsSubmitting(false);
            return;
        }
        toast.success("Khởi tạo thành công! Hãy thêm địa điểm cho từng ngày.", { id: toastId });
        const newTripId = data.data?.itinerary_id || data.data?.id;
        onClose();
        router.push(newTripId ? `/my-itinerary/${newTripId}/builder` : "/my-itinerary");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl"
            >
                <div className="relative overflow-hidden bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 p-6 text-white">
                    <div className="absolute right-0 top-0 p-4 opacity-20"><Sparkles className="h-16 w-16" /></div>
                    <h2 className="font-display relative z-10 mb-1 text-2xl font-bold">Bắt đầu hành trình</h2>
                    <p className="relative z-10 text-sm text-indigo-100">Khởi tạo chuyến đi tuyệt vời tiếp theo của bạn.</p>
                    <button onClick={onClose} className="absolute right-4 top-4 z-20 rounded-full bg-white/10 p-2 backdrop-blur-sm transition-colors hover:bg-white/20" aria-label="Đóng">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {!currentUser ? (
                    <div className="space-y-4 p-6 text-center">
                        <p className="text-sm text-[var(--text-muted)]">Bạn cần đăng nhập để tạo và lưu lộ trình của riêng mình.</p>
                        <Link
                            href="/auth/signin"
                            onClick={onClose}
                            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90"
                        >
                            <LogIn className="h-4 w-4" /> Đăng nhập ngay
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 p-6">
                        <div>
                            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                <MapPin className="h-3.5 w-3.5" /> Điểm đến (có thể chọn nhiều)
                            </label>
                            {selectedProvinces.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-2">
                                    {selectedProvinces.map((prov) => (
                                        <span key={prov.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/10 px-3 py-1.5 text-sm font-bold text-[var(--accent-primary)]">
                                            {prov.name}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedProvinces(selectedProvinces.filter((p) => p.id !== prov.id))}
                                                className="rounded-full p-0.5 transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
                                                aria-label={`Bỏ ${prov.name}`}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <select defaultValue="" onChange={handleSelectProvince} className={inputClass}>
                                <option value="" disabled>+ Chọn tỉnh/thành phố...</option>
                                {provinces
                                    .filter((p) => !selectedProvinces.some((sp) => sp.id === p.id))
                                    .map((prov) => (
                                        <option key={prov.id} value={prov.id}>{prov.name}</option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                <Type className="h-3.5 w-3.5" /> Tên chuyến đi
                            </label>
                            <input
                                required
                                maxLength={200}
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className={`${inputClass} font-bold`}
                                placeholder="VD: Chuyến đi thanh xuân Đà Lạt..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                    <Calendar className="h-3.5 w-3.5" /> Ngày đi
                                </label>
                                <input
                                    type="date"
                                    min={today}
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className={`${inputClass} cursor-pointer`}
                                />
                            </div>
                            <div>
                                <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                    <Calendar className="h-3.5 w-3.5" /> Ngày về
                                </label>
                                <input
                                    type="date"
                                    min={formData.start_date || today}
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className={`${inputClass} cursor-pointer ${hasInvalidDates ? "border-red-400" : ""}`}
                                />
                            </div>
                        </div>
                        <p className="-mt-2 text-xs text-[var(--text-muted)]">
                            {hasInvalidDates
                                ? "Ngày về phải sau hoặc bằng ngày đi."
                                : tripDays
                                  ? `Chuyến đi ${tripDays} ngày ${tripDays - 1} đêm, hệ thống sẽ tạo sẵn ${tripDays} ngày trong lịch trình.`
                                  : "Có thể bỏ trống ngày và chọn sau trong trình thiết kế."}
                        </p>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:transform-none disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? "Đang khởi tạo..." : <>Tiếp tục lên kế hoạch <ArrowRight className="h-4 w-4" /></>}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
};
