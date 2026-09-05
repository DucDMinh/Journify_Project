import { useItinerarySetup } from "@/hooks/admin/Itineraries/useItinerarySetup";
import { SetupScreenProp } from "@/interface";
import { motion } from "framer-motion";
import { Sparkles, Search, Compass, ChevronRight, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const SetupScreen: React.FC<SetupScreenProp> = (props) => {
    const { selectedProvinces, step } = props;
    const {
        isDropdownOpen, setIsDropdownOpen,
        searchProvince, setSearchProvince,
        templates,
        isLoading,
        filteredProvinces,
        handleSelectProvince,
        handleRemoveProvince,
        handleCreateItinerary,
        handleSelectTemplate
    } = useItinerarySetup(props);

    const [visibleCount, setVisibleCount] = useState(3);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setTimeout(() => setVisibleCount((prev) => prev + 3), 500);
                }
            },
            { root: null, rootMargin: "20px", threshold: 0 }
        );
        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [step, visibleCount, templates.length]);
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 md:p-12 font-sans flex flex-col items-center justify-start">
            <div className="w-full max-w-4xl text-center mb-12 mt-10">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 mb-6 font-semibold text-sm">
                    <Sparkles className="h-4 w-4" /> Bắt đầu hành trình mới
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                    Bạn muốn đi đâu?
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-gray-500 dark:text-gray-400 text-lg">
                    Hãy chọn một hoặc nhiều tỉnh thành, hoặc bắt đầu nhanh bằng một lộ trình mẫu.
                </motion.p>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 mb-16 flex flex-col md:flex-row gap-4 items-center relative">
                <div className="flex flex-wrap items-center gap-2 p-2 min-h-[60px] bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all w-full md:flex-1">
                    <Search className="h-5 w-5 text-gray-400 ml-2 shrink-0" />

                    {selectedProvinces.map(p => (
                        <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-700 text-sm font-bold text-gray-800 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-600">
                            {p.name}
                            <button onClick={() => handleRemoveProvince(p.id)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                        </span>
                    ))}

                    <input
                        type="text"
                        placeholder={selectedProvinces.length === 0 ? "Tìm kiếm tỉnh thành (VD: Hà Nội, Đà Lạt...)" : "Thêm điểm đến..."}
                        value={searchProvince}
                        onChange={(e) => {
                            setSearchProvince(e.target.value);
                            setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                        className="flex-1 min-w-[200px] bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 font-medium border-0 border-transparent focus:border-transparent outline-none focus:outline-none ring-0 focus:ring-0 shadow-none focus:shadow-none"
                    />
                </div>

                {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 md:right-48 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {filteredProvinces && filteredProvinces.length > 0 ? (
                                filteredProvinces.map((province) => (
                                    <button
                                        key={province.id}
                                        onClick={() => handleSelectProvince({ id: province.id, name: province.name, image_url: province.image_url ?? "" })}
                                        className="w-full text-left px-4 py-3 flex items-center hover:bg-brand-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 font-medium transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-none focus:bg-brand-50 focus:outline-none"
                                    >
                                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                        {province.name}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-4 text-center text-sm text-gray-500">
                                    Không tìm thấy tỉnh/thành nào phù hợp.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <button
                    disabled={selectedProvinces.length === 0}
                    onClick={handleCreateItinerary}
                    className={`w-full md:w-auto shrink-0 px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${selectedProvinces.length === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                        : "bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/30 hover:scale-105 active:scale-95"
                        }`}
                >
                    Tạo Lộ Trình <ChevronRight className="h-5 w-5" />
                </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="w-full max-w-6xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Compass className="text-brand-500" /> Hoặc chọn Lộ trình mẫu
                    </h2>
                    <button className="text-brand-600 dark:text-brand-400 font-semibold text-sm hover:underline">Xem tất cả</button>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
                            Đang tải dữ liệu...
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {templates.filter((tpl) => tpl.share === true).slice(0, visibleCount).map((tpl) => (
                            <div
                                key={tpl.id}
                                onClick={() => handleSelectTemplate(tpl)}
                                className="group cursor-pointer bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 hover:border-brand-300 dark:hover:border-brand-700 flex flex-row h-32 sm:h-36"
                            >
                                <div className="w-32 sm:w-48 overflow-hidden relative shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={tpl.image_url || ""} alt={tpl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-2 left-2 flex flex-wrap gap-1 pr-2">
                                        <span className="bg-brand-500/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                            {tpl.theme || "Du lịch"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col flex-1 justify-between min-w-0">
                                    <div>
                                        <h3 className="font-bold text-base md:text-lg text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors line-clamp-2 leading-tight">
                                            {tpl.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5 truncate">
                                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate" title={tpl.itinerary_provinces?.map(p => p.provinces?.name).filter(Boolean).join(', ')}>
                                                {tpl.itinerary_provinces && tpl.itinerary_provinces.length > 0
                                                    ? tpl.itinerary_provinces.map(p => p.provinces?.name).filter(Boolean).join(', ')
                                                    : "Chưa xác định điểm đến"}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-2">
                                        <span className="text-gray-600 dark:text-gray-300 text-xs font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                                            {tpl.days || 0} ngày {tpl.nights || 0} đêm
                                        </span>
                                        <div className="flex items-center justify-between gap-3 text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-md text-sm">
                                            <span>Dự kiến:</span>
                                            <span>{tpl.estimated_cost?.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {visibleCount < templates.length && (
                            <div ref={loaderRef} className="py-6 flex justify-center items-center w-full">
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 animate-pulse font-medium">
                                    <div className="h-4 w-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
                                    Đang tải thêm lộ trình...
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};