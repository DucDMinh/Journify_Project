"use client";
import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { supabase } from "@/utils/supabaseClient";
import { Toaster, toast } from 'sonner';
import { Plus, MapPin, Search, Globe, Sparkles, Map } from "lucide-react";
import { Province } from "@/interface";
import { ProvinceTable } from "@/components/tables/admin/provinceTable";
import { AddProvinceModal } from "@/components/modals/admin/AddProvinceModal";
import { EditProvinceModal } from "@/components/modals/admin/EditProvinceModal";
import { motion, AnimatePresence } from "framer-motion";
import { ListLocationsModal } from "@/components/modals/admin/ListLocationsModal";
import { api } from "@/lib/apiClient";

export default function ProvincesPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [pickProvince, setPickProvince] = useState<Province | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [provinces, setProvinces] = useState<Province[]>([]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isListModalOpen, setIsListModalOpen] = useState(false);

    const executeDelete = async (id: string, name: string) => {
        const toastId = toast.loading(`Đang vô hiệu hóa "${name}"...`);
        try {
            const { response, data } = await api.delete(`/provinces/${id}`);

            if (!response.ok) {
                throw new Error(data.message || "Lỗi khi xóa tỉnh thành");
            }

            toast.success(`Đã xóa "${name}" thành công!`, { id: toastId });
            sessionStorage.removeItem("provinces_cache");
            fetchProvinces();
        } catch (error) {
            console.error("Lỗi:", error);
            toast.error("Xóa thất bại! Vui lòng thử lại.", { id: toastId });
        }
    };

    const fetchProvinces = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/provinces`);
            const result = await response.json();

            if (result.success && result.data) {
                setProvinces(result.data);
            } else if (Array.isArray(result)) {
                setProvinces(result);
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
            toast.error("Không thể tải danh sách tỉnh/thành phố!");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const initTimer = setTimeout(() => {
            fetchProvinces();
        }, 0);

        const provinceChannel = supabase.channel("custom-province-channel")
            .on("postgres_changes", { event: "*", schema: "public", table: "provinces" }, () => {
                sessionStorage.removeItem("provinces_cache");
                fetchProvinces();
            }).subscribe();

        return () => {
            supabase.removeChannel(provinceChannel);
            clearTimeout(initTimer);
        };
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleAddSubmit = async (submitData: FormData) => {
        setIsSaving(true);
        const toastId = toast.loading("Đang thiết lập tỉnh/thành phố lên hệ thống...");

        try {
            const { response, data } = await api.post("/provinces", submitData);

            if (!response.ok) {
                throw new Error(data.message || "Lỗi khi thêm tỉnh thành");
            }

            toast.success("Khởi tạo không gian thành công!", { id: toastId });
            setIsAddModalOpen(false);
            sessionStorage.removeItem("provinces_cache");
            fetchProvinces();
        } catch (error) {
            console.error("Lỗi:", error);
            toast.error("Lưu thất bại! Cổng kết nối có vấn đề.", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditSubmit = async (submitData: FormData) => {
        if (!pickProvince) {
            toast.error("Không tìm thấy dữ liệu tỉnh/thành cần sửa!");
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading("Đang tái cấu trúc tỉnh/thành phố...");

        try {
            const { response, data } = await api.patch(`/provinces/${pickProvince.id}`, submitData);

            if (!response.ok) {
                throw new Error(data.message || "Lỗi khi sửa địa điểm");
            }

            toast.success("Cập nhật tọa độ thành công!", { id: toastId });
            setIsEditModalOpen(false);
            setPickProvince(undefined);
            sessionStorage.removeItem("provinces_cache");
            fetchProvinces();
        } catch (error) {
            console.error("Lỗi:", error);
            toast.error("Cập nhật thất bại! Cổng kết nối có vấn đề.", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const ITEMS_PER_PAGE = 10;
    const filteredProvinces = provinces.filter((province) => {
        if (!searchQuery) return true;
        return province.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
    const calculatedTotalPages = Math.ceil(filteredProvinces.length / ITEMS_PER_PAGE) || 1;

    const paginatedProvinces = filteredProvinces.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="min-h-screen pb-12">
            <PageBreadcrumb pageTitle="Quản lý Tỉnh/Thành phố" />
            <Toaster duration={1500} richColors position="bottom-right" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-3xl bg-gray-900 p-8 text-white shadow-2xl mb-8 dark:bg-gray-950 border border-gray-800"
            >
                <div className="absolute -right-20 -top-20 opacity-10 pointer-events-none">
                    <Globe className="h-96 w-96 animate-[spin_120s_linear_infinite]" />
                </div>
                <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-brand-600/20 to-transparent pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-300 backdrop-blur-md mb-4 border border-brand-500/30">
                            <Sparkles className="h-3.5 w-3.5" /> Quản trị khu vực
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
                            Hệ thống Tỉnh thành
                        </h1>
                        <p className="max-w-xl text-sm text-gray-400 font-medium leading-relaxed">
                            Quản lý toàn bộ danh sách các tỉnh và thành phố. Thiết lập dữ liệu cơ sở phục vụ cho hệ thống bản đồ du lịch.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-brand-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-brand-500/30 transition-all hover:scale-105 hover:bg-brand-500 hover:shadow-brand-500/50 active:scale-95"
                    >
                        <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                            <div className="relative h-full w-8 bg-white/20"></div>
                        </div>
                        <Plus className="mr-2 h-5 w-5" />
                        <span>Thêm Tỉnh/Thành phố</span>
                    </button>
                </div>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <div className="mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="flex w-full lg:w-auto flex-col sm:flex-row items-center gap-3 bg-white/80 p-2 rounded-2xl shadow-sm border border-gray-200/60 backdrop-blur-xl dark:bg-gray-900/80 dark:border-gray-800">
                        <div className="relative w-full sm:w-72">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm kiếm tỉnh/thành phố..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="block w-full rounded-xl border-none bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-gray-900 transition-all focus:bg-white focus:ring-2 focus:ring-brand-500/50 dark:bg-gray-800/50 dark:text-white placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-4 py-2.5 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-800 hidden lg:block">
                        Khu vực quản lý dữ liệu
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none relative">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                            <thead className="bg-gray-50/80 backdrop-blur-md text-xs uppercase tracking-widest text-gray-500 dark:bg-gray-800/80 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-5 font-bold">Hình ảnh</th>
                                    <th className="px-6 py-5 font-bold">Tên Tỉnh/Thành phố</th>
                                    <th className="px-6 py-5 font-bold">Độ cao</th>
                                    <th className="px-6 py-5 text-right font-bold">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
                                                    <Map className="h-6 w-6 animate-pulse text-brand-500" />
                                                    <div className="absolute inset-0 rounded-xl border-2 border-brand-500 opacity-20 animate-ping"></div>
                                                </div>
                                                <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Đang đồng bộ dữ liệu...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : !Array.isArray(paginatedProvinces) || paginatedProvinces.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center">
                                            <div className="mx-auto max-w-sm flex flex-col items-center justify-center p-6 rounded-3xl bg-gray-50 border border-dashed border-gray-200 dark:bg-gray-800/30 dark:border-gray-700">
                                                <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                                                    <MapPin className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">Không gian trống</h3>
                                                <p className="text-xs text-gray-500">Chưa có tỉnh thành nào được ghi nhận tại đây.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <ProvinceTable
                                        setIsListModalOpen={setIsListModalOpen}
                                        provinces={paginatedProvinces}
                                        executeDelete={executeDelete}
                                        setIsEditModalOpen={setIsEditModalOpen}
                                        setPickProvince={setPickProvince}
                                    />
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!isLoading && calculatedTotalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800/50 dark:bg-gray-900">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Trang <span className="text-brand-600 dark:text-brand-400">{currentPage}</span> / {calculatedTotalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Quay lại
                                </button>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, calculatedTotalPages))}
                                    disabled={currentPage === calculatedTotalPages}
                                    className="flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Tiếp tiến
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {isAddModalOpen && (
                    <AddProvinceModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                        onAdd={handleAddSubmit}
                        isSaving={isSaving}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isEditModalOpen && (
                    <EditProvinceModal
                        key={pickProvince?.id || 'empty-edit-modal'}
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setPickProvince(undefined);
                        }}
                        onEdit={handleEditSubmit}
                        isSaving={isSaving}
                        province={pickProvince}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isListModalOpen && (
                    <ListLocationsModal
                        onClose={() => setIsListModalOpen(false)}
                        setIsListModalOpen={setIsListModalOpen}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}