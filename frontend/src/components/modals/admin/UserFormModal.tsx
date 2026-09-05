/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Pencil, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from 'sonner';
import { User } from "@/interface";
import { api } from "@/lib/apiClient";

const userFormSchema = z.object({
    name: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Email không đúng định dạng"),
    phone_number: z.string().regex(/^\d*$/, "Số điện thoại chỉ được chứa chữ số").optional().or(z.literal("")),
    password: z.string().optional(),
    role: z.enum(["ADMIN", "USER"]),
    status: z.enum(["active", "inactive"]),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedUser: User | null;
    onSuccess: () => void;
}

export default function UserFormModal({ isOpen, onClose, selectedUser, onSuccess }: UserFormModalProps) {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
    });
    useEffect(() => {
        if (isOpen) {
            reset({
                name: selectedUser?.name || "",
                email: selectedUser?.email || "",
                phone_number: selectedUser?.phone_number ? String(selectedUser.phone_number) : "",
                password: "",
                role: selectedUser?.role || "USER",
                status: selectedUser?.status || "active",
            });
        }
    }, [isOpen, selectedUser, reset]);

    const onSubmit = async (formData: UserFormValues) => {
        if (!selectedUser && (!formData.password || formData.password.length < 6)) {
            toast.error("Mật khẩu cho người dùng mới phải có ít nhất 6 ký tự.");
            return;
        }

        try {
            const payload: any = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone_number: formData.phone_number ? parseInt(formData.phone_number, 10) : undefined,
                role: formData.role,
                status: formData.status,
            };
            if (formData.password && formData.password.trim()) {
                payload.password = formData.password;
            }

            if (selectedUser) {
                const { data } = await api.patch(`/users/${selectedUser.id}`, payload);
                if (data.success) {
                    toast.success("Sửa thông tin người dùng thành công!");
                    onSuccess();
                    onClose();
                    return;
                }
                toast.error(data.message)
            } else {
                const { data } = await api.post("/users", payload);
                if (data.success) {
                    toast.success("Thêm người dùng thành công!");
                    onSuccess();
                    onClose();
                    return;
                }
                toast.error(data.message)
            }

        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Có lỗi xảy ra");
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {selectedUser ? <><Pencil className="h-5 w-5 text-blue-600" /> Chỉnh sửa</> : <><UserPlus className="h-5 w-5 text-blue-600" /> Thêm mới</>}
                        </h2>
                        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="h-5 w-5" /></button>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Họ và tên</label>
                            <input type="text" {...register("name")} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 rounded-xl" />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                {...register("email")}
                                placeholder="email@example.com"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        {!selectedUser && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Mật khẩu (Ít nhất 6 ký tự)
                                </label>
                                <input
                                    type="password"
                                    {...register("password")}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                                />
                                {errors.password && (
                                    <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Số điện thoại
                            </label>
                            <input
                                type="text"
                                {...register("phone_number")}
                                placeholder="0123456789"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                            />
                            {errors.phone_number && (
                                <p className="text-red-500 text-xs mt-1">{errors.phone_number.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Vai trò
                                </label>
                                <select
                                    {...register("role")}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="USER">Người dùng</option>
                                    <option value="ADMIN">Quản trị viên</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium hover:bg-gray-100 rounded-xl">Hủy</button>
                            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl flex items-center gap-2 disabled:opacity-60">
                                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</> : selectedUser ? "Cập nhật" : "Thêm mới"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}