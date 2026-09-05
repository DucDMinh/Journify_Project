"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
    X, Link as LinkIcon, Image as ImageIcon,
    UploadCloud, AlertTriangle, FileText, Compass, Sparkles
} from "lucide-react";
import { EditLocationModalProps } from "@/interface"

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gray-900 text-sm text-gray-400">
            <Compass className="h-8 w-8 animate-spin text-brand-400 mb-3" />
            <span className="font-medium tracking-wider text-xs uppercase text-gray-400">Đang khởi tạo không gian...</span>
        </div>
    ),
});

export const EditLocationModal: React.FC<EditLocationModalProps> = ({
    setIsEditModalOpen,
    formData,
    setFormData,
    mapLink,
    setMapLink,
    setImageFile,
    handleInputChange,
    handleExtractFromLink,
    handleEditSubmit,
    provinces,
    isSaving,
    imageFile,
    pickLocation
}) => {
    const [oldImageUrl, setOldImageUrl] = useState<string | null>(pickLocation?.img || null);
    const displayImage = imageFile ? URL.createObjectURL(imageFile) : oldImageUrl;

    const handleRemoveImage = () => {
        setImageFile(null);
        setOldImageUrl(null);
    };

    useEffect(() => {
        if (pickLocation) {
            setFormData({
                name: pickLocation.name || "",
                description: pickLocation.description || "",
                note: pickLocation.note || "",
                lat: pickLocation.lat.toString() || "",
                lng: pickLocation.lng.toString() || "",
                province_id: pickLocation.province_id || "",
                difficulty_level: pickLocation.difficulty_level || ""
            });
        }
    }, [pickLocation, setFormData]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/70 p-0 backdrop-blur-lg transition-all sm:p-4">
            <div className="flex h-full w-full max-w-6xl overflow-hidden bg-white shadow-2xl dark:bg-gray-900 sm:h-[90vh] sm:rounded-3xl border border-gray-100 dark:border-gray-800">

                <div className="grid h-full w-full grid-cols-1 lg:grid-cols-12 relative">

                    <button
                        onClick={() => setIsEditModalOpen(false)}
                        className="absolute right-4 top-4 z-50 rounded-full bg-white/80 p-2.5 text-gray-500 shadow-lg backdrop-blur-md transition-all hover:bg-red-500 hover:text-white dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-red-500"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="relative hidden h-full flex-col lg:col-span-5 lg:flex border-r border-gray-100 dark:border-gray-800">
                        <div className="relative z-0 h-full w-full overflow-hidden">
                            <MapPicker
                                lat={formData.lat}
                                lng={formData.lng}
                                onLocationSelect={(lat, lng) => {
                                    setFormData((prev) => ({ ...prev, lat, lng }));
                                }}
                            />
                        </div>

                        {/* Floating HUD: Tiêu đề nổi */}
                        <div className="absolute left-4 top-4 z-10 flex items-center gap-2.5 rounded-2xl bg-white/90 px-4 py-3 shadow-xl backdrop-blur-md dark:bg-gray-900/90 border border-white/20">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
                                <Compass className="h-4 w-4 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Không gian</h3>
                                <p className="text-sm font-bold text-gray-800 dark:text-white">Định vị địa lý</p>
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 z-10 grid grid-cols-2 gap-3 rounded-2xl bg-gray-950/80 p-3.5 shadow-xl backdrop-blur-md border border-white/10">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Vĩ độ (Latitude)</label>
                                <input
                                    type="text"
                                    name="lat"
                                    onChange={handleInputChange}
                                    required
                                    value={formData.lat}
                                    placeholder="21.0285"
                                    className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none placeholder:text-gray-600"
                                />
                            </div>
                            <div className="border-l border-white/10 pl-3">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Kinh độ (Longitude)</label>
                                <input
                                    type="text"
                                    name="lng"
                                    onChange={handleInputChange}
                                    required
                                    value={formData.lng}
                                    placeholder="105.8542"
                                    className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none placeholder:text-gray-600"
                                />
                            </div>
                        </div>
                    </div>


                    {/* ================= CỘT PHẢI: HỆ THỐNG THẺ THÔNG TIN (Chiếm 7 phần) ================= */}
                    <div className="flex h-full flex-col overflow-hidden lg:col-span-7 bg-gray-50/50 dark:bg-gray-950/30">

                        {/* Tiêu đề góc phải form */}
                        <div className="px-6 pt-6 pb-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/50 dark:text-brand-400 mb-2">
                                <Sparkles className="h-3 w-3" /> Studio Cập Nhật
                            </span>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                Biên tập địa điểm
                            </h2>
                        </div>

                        {/* Vùng cuộn chứa Form */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-5">
                            <form id="edit-location-form" onSubmit={handleEditSubmit} className="space-y-5">
                                {/* MODULE 1: TRÍCH XUẤT TỌA ĐỘ NHANH */}
                                <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 p-4 dark:border-blue-900/30">
                                    <label className="mb-2 flex items-center text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">
                                        <LinkIcon className="mr-2 h-3.5 w-3.5" />
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={mapLink}
                                            onChange={(e) => setMapLink(e.target.value)}
                                            className="flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                            placeholder="Thả liên kết bản đồ vào đây..."
                                        />
                                        <button
                                            type="button"
                                            onClick={handleExtractFromLink}
                                            className="inline-flex shrink-0 items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-600/10 transition-all hover:bg-blue-700 active:scale-95"
                                        >
                                            Phân tích
                                        </button>
                                    </div>
                                </div>

                                {/* MODULE 2: HÌNH ẢNH ĐẠI DIỆN (Dạng Cinema thuôn dài siêu đẹp) */}
                                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <label className="mb-2.5 flex items-center text-xs font-bold uppercase tracking-wider text-gray-400">
                                        <ImageIcon className="mr-2 h-3.5 w-3.5 text-brand-500" />
                                        Hình ảnh đại diện bài viết
                                    </label>

                                    {displayImage ? (
                                        <div className="group relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-gray-100 shadow-inner dark:border-gray-800">
                                            {/*eslint-disable-next-line @next/next/no-img-element*/}
                                            <img
                                                src={displayImage}
                                                alt="Preview"
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            {/* Bộ công cụ chỉnh sửa ảnh tối giản ẩn/hiện tinh tế */}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 backdrop-blur-xs transition-all duration-300">
                                                <div className="flex gap-2">
                                                    <label className="flex cursor-pointer items-center justify-center rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-gray-800 shadow-lg hover:bg-gray-100">
                                                        <UploadCloud className="mr-1.5 h-4 w-4" /> Thay ảnh
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files ? e.target.files[0] : null;
                                                                if (file) setImageFile(file);
                                                            }}
                                                        />
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveImage}
                                                        className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-lg hover:bg-red-700"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="group flex aspect-[21/9] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 transition-all hover:border-brand-500 hover:bg-brand-50/20 dark:border-gray-700 dark:bg-gray-900/30">
                                            <div className="flex flex-col items-center justify-center text-center p-4">
                                                <div className="mb-2 rounded-xl bg-brand-50 p-2.5 text-brand-500 dark:bg-brand-950/40">
                                                    <UploadCloud className="h-6 w-6" />
                                                </div>
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                    Tải lên tác phẩm hình ảnh mới
                                                </p>
                                                <p className="mt-0.5 text-[10px] text-gray-400">
                                                    PNG, JPG, WEBP • Tối đa 5MB
                                                </p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files ? e.target.files[0] : null;
                                                    setImageFile(file);
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>

                                {/* MODULE 3: ĐỊNH DANH ĐỊA ĐIỂM (Thông tin cốt lõi) */}
                                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                                            Tên địa danh tôn vinh *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm font-medium text-gray-900 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/5 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                            placeholder="VD: Bản Cát Cát"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                                                Khu vực hành chính *
                                            </label>
                                            <select
                                                name="province_id"
                                                required
                                                value={formData.province_id}
                                                onChange={handleInputChange}
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm font-medium text-gray-900 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                            >
                                                <option value="">-- Chọn Tỉnh / Thành --</option>
                                                {provinces?.map((prov) => (
                                                    <option key={prov.id} value={prov.id}>
                                                        {prov.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                                                Cấp độ trải nghiệm
                                            </label>
                                            <select
                                                name="difficulty_level"
                                                value={formData.difficulty_level}
                                                onChange={handleInputChange}
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm font-medium text-gray-900 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                            >
                                                <option value="">-- Cấp độ --</option>
                                                <option value="Dễ">🟢 Dễ (Cho mọi lứa tuổi)</option>
                                                <option value="Trung Bình">🟡 Trung Bình (Thể lực nhẹ)</option>
                                                <option value="Khó">🔴 Khó (Thử thách mạo hiểm)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* MODULE 4: NỘI DUNG CHI TIẾT */}
                                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                                    <div>
                                        <label className="mb-1 flex items-center text-xs font-bold uppercase tracking-wider text-gray-400">
                                            <FileText className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                                            Câu chuyện & Mô tả chi tiết
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/5 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                            rows={4}
                                            placeholder="Khơi nguồn cảm hứng bằng những dòng giới thiệu đặc trưng của tọa độ này..."
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="mb-1 flex items-center text-xs font-bold uppercase tracking-wider text-amber-500">
                                            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                                            Cảnh báo & Lưu ý an toàn
                                        </label>
                                        <textarea
                                            name="note"
                                            value={formData.note}
                                            onChange={handleInputChange}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/5 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                            rows={2}
                                            placeholder="Thời tiết, trang phục khuyên dùng, lưu ý đường sá..."
                                        ></textarea>
                                    </div>
                                </div>

                            </form>
                        </div>

                        {/* HÀNH ĐỘNG FOOTER - TINH GỌN, CHUYÊN NGHIỆP */}
                        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
                            <p className="hidden text-xs font-semibold text-gray-400 sm:block">
                                Vui lòng kiểm tra kỹ các thông tin gắn dấu <span className="text-red-500">*</span>
                            </p>
                            <div className="flex w-full gap-3 sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-500 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                                >
                                    Đóng lại
                                </button>
                                <button
                                    type="submit"
                                    form="edit-location-form"
                                    disabled={isSaving}
                                    className={`flex items-center justify-center rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all focus:outline-none ${isSaving
                                        ? "cursor-not-allowed bg-brand-400"
                                        : "bg-brand-600 hover:bg-brand-700 hover:shadow-brand-600/20 active:scale-98"
                                        }`}
                                >
                                    {isSaving ? (
                                        <>
                                            <svg className="mr-2 h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang lưu kho...
                                        </>
                                    ) : (
                                        "Xác nhận thay đổi"
                                    )}
                                </button>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};