/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { X, Upload } from "lucide-react";
import { Province } from "@/interface";

interface EditProvinceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: (submitData: FormData) => Promise<void>;
    isSaving: boolean;
    province?: Province;
}

export const EditProvinceModal: React.FC<EditProvinceModalProps> = ({
    isOpen,
    onClose,
    onEdit,
    isSaving,
    province
}) => {
    const [localFormData, setLocalFormData] = useState({
        name: province?.name || "",
        description: province?.description || "",
        best_time_to_visit: province?.best_time_to_visit || "",
        height: province?.height || "",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(province?.image_url || null);
    if (!isOpen || !province) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const submitData = new FormData();
        submitData.append("name", localFormData.name);
        if (localFormData.description) submitData.append("description", localFormData.description);
        if (localFormData.best_time_to_visit) submitData.append("best_time_to_visit", localFormData.best_time_to_visit);
        if (localFormData.height) submitData.append("height", localFormData.height);
        if (imageFile) {
            submitData.append("image_url", imageFile);
        }

        await onEdit(submitData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 backdrop-blur-sm transition-opacity">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cập nhật: {province.name}</h3>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-5 px-6 py-5">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                                        Tên Tỉnh/Thành phố <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={localFormData.name}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Độ cao (m)</label>
                                    <input
                                        type="text"
                                        name="height"
                                        value={localFormData.height}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Thời điểm lý tưởng</label>
                                    <input
                                        type="text"
                                        name="best_time_to_visit"
                                        value={localFormData.best_time_to_visit}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Ảnh đại diện</label>
                                <div className="flex w-full items-center justify-center">
                                    <label className="relative flex h-48 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500">
                                        {previewUrl ? (
                                            <div className="group relative h-full w-full">
                                                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover transition duration-300 group-hover:opacity-50" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
                                                    <span className="rounded bg-black/70 px-3 py-1.5 text-sm font-medium text-white">Đổi ảnh khác</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pb-6 pt-5 text-gray-500 dark:text-gray-400">
                                                <Upload className="mb-3 h-8 w-8" />
                                                <p className="mb-2 text-sm"><span className="font-semibold">Nhấn để tải lên</span></p>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Mô tả chi tiết</label>
                            <textarea
                                name="description"
                                rows={3}
                                value={localFormData.description}
                                onChange={handleInputChange}
                                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end rounded-b-2xl border-t border-gray-200 p-4 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="mr-3 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 focus:z-10 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center rounded-lg bg-brand-500 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};