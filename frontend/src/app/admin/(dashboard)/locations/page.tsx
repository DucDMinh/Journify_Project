"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MapPin, Search, Filter, Globe, Sparkles, Map } from "lucide-react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { AddLocationModal } from "@/components/modals/admin/addLocation";
import { EditLocationModal } from "@/components/modals/admin/editLocation";
import { LocationTable } from "@/components/tables/admin/locationsTable";
import { useLocationsAdmin } from "@/hooks/admin/useLocationsAdmin";

export default function LocationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LocationsContent />
    </Suspense>
  );
}

function LocationsContent() {
  const searchParams = useSearchParams();
  const {
    locations, provinces, isLoading, isSaving,
    mapLink, setMapLink,
    pickLocation, setPickLocation,
    filterProvince, searchQuery, currentPage, goToPage, totalPages,
    isAddModalOpen, setIsAddModalOpen,
    isEditModalOpen, setIsEditModalOpen,
    formData, setFormData,
    imageFile, setImageFile,
    handleInputChange, handleFilterChange, handleSearchChange,
    handleExtractFromLink, handleAddSubmit, handleEditSubmit, executeDelete,
  } = useLocationsAdmin(searchParams.get("search") ?? "");

  return (
    <div className="min-h-screen pb-12">
      <PageBreadcrumb pageTitle="Quản lý Không gian & Địa điểm" />
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
              <Sparkles className="h-3.5 w-3.5" /> Quản trị bản đồ
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
              Trung tâm địa điểm
            </h1>
            <p className="max-w-xl text-sm text-gray-400 font-medium leading-relaxed">
              Khám phá, thiết lập và lưu trữ các điểm đến tuyệt vời nhất. Quản lý hệ thống bản đồ du lịch của bạn tại một nơi duy nhất.
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
            <span>Khởi tạo Tọa độ mới</span>
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
                placeholder="Tìm kiếm địa danh..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full rounded-xl border-none bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-gray-900 transition-all focus:bg-white focus:ring-2 focus:ring-brand-500/50 dark:bg-gray-800/50 dark:text-white placeholder:text-gray-400"
              />
            </div>

            <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="relative w-full sm:w-56">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Filter className="h-4 w-4 text-brand-500" />
              </div>
              <select
                value={filterProvince}
                onChange={handleFilterChange}
                className="block w-full appearance-none rounded-xl border-none bg-brand-50/50 py-2.5 pl-10 pr-8 text-sm font-bold text-brand-700 transition-all focus:bg-brand-50 focus:ring-2 focus:ring-brand-500/50 dark:bg-brand-900/20 dark:text-brand-400 cursor-pointer"
              >
                <option value="">Tất cả Vùng miền</option>
                {provinces?.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
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
                  <th className="px-6 py-5 font-bold">Tên địa điểm</th>
                  <th className="px-6 py-5 font-bold">Tỉnh thành</th>
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
                ) : locations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="mx-auto max-w-sm flex flex-col items-center justify-center p-6 rounded-3xl bg-gray-50 border border-dashed border-gray-200 dark:bg-gray-800/30 dark:border-gray-700">
                        <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                          <MapPin className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">Không gian trống</h3>
                        <p className="text-xs text-gray-500">Chưa có tọa độ nào được ghi nhận tại đây. Hãy khởi tạo một địa điểm mới.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <LocationTable
                    locations={locations}
                    executeDelete={executeDelete}
                    setIsEditModalOpen={setIsEditModalOpen}
                    setPickLocation={setPickLocation}
                    setFormData={setFormData}
                  />
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800/50 dark:bg-gray-900">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Trang <span className="text-brand-600 dark:text-brand-400">{currentPage}</span> / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Quay lại
                </button>
                <button
                  onClick={() => goToPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
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
          <AddLocationModal
            setIsAddModalOpen={setIsAddModalOpen}
            formData={formData}
            setFormData={setFormData}
            mapLink={mapLink}
            setMapLink={setMapLink}
            setImageFile={setImageFile}
            handleInputChange={handleInputChange}
            handleExtractFromLink={handleExtractFromLink}
            handleAddSubmit={handleAddSubmit}
            provinces={provinces}
            isSaving={isSaving}
            imageFile={imageFile}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditModalOpen && (
          <EditLocationModal
            setIsEditModalOpen={setIsEditModalOpen}
            formData={formData}
            setFormData={setFormData}
            mapLink={mapLink}
            setMapLink={setMapLink}
            setImageFile={setImageFile}
            handleInputChange={handleInputChange}
            handleExtractFromLink={handleExtractFromLink}
            handleEditSubmit={handleEditSubmit}
            provinces={provinces}
            isSaving={isSaving}
            imageFile={imageFile}
            pickLocation={pickLocation}
          />
        )}
      </AnimatePresence>
    </div>
  );
}