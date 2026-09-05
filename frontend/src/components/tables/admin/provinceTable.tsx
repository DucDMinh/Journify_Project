import React, { useState } from "react";
import { Edit, Trash2, Compass, ChevronDown, ChevronRight, MapPin, ExternalLink } from "lucide-react";
import { Province } from "@/interface";
import { Popconfirm } from "antd";
import { motion } from "framer-motion";
import Link from "next/link";

interface ProvinceTableProps {
    setIsListModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    provinces: Province[];
    executeDelete: (id: string, name: string) => Promise<void>;
    setIsEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setPickProvince: React.Dispatch<React.SetStateAction<Province | undefined>>;
}

export const ProvinceTable: React.FC<ProvinceTableProps> = ({
    provinces,
    executeDelete,
    setIsEditModalOpen,
    setPickProvince,
}) => {
    // State quản lý dòng nào đang được mở rộng
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        setExpandedRowId((prev) => (prev === id ? null : id));
    };

    return (
        <>
            {provinces.map((loc, index) => (
                <React.Fragment key={loc.id}>
                    {/* --- DÒNG CHÍNH (TỈNH/THÀNH PHỐ) --- */}
                    <motion.tr
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
                        onClick={() => toggleRow(loc.id)}
                        className={`cursor-pointer group border-b border-transparent transition-all duration-300 hover:border-gray-100 hover:bg-gray-50/50 dark:hover:border-gray-800 dark:hover:bg-gray-800/30 ${expandedRowId === loc.id ? "bg-gray-50/50 dark:bg-gray-800/20" : "bg-white dark:bg-transparent"
                            }`}
                    >
                        <td className="px-6 py-4">
                            <div className="relative h-14 w-24 overflow-hidden rounded-xl border border-gray-200/60 shadow-sm dark:border-gray-700">
                                {loc.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={loc.image_url}
                                        alt={loc.name}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gray-50/50 text-gray-300 dark:bg-gray-900/50 dark:text-gray-600">
                                        <Compass className="h-5 w-5 opacity-60" />
                                    </div>
                                )}
                                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/5 dark:ring-white/10 pointer-events-none"></div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <div className="text-gray-400 dark:text-gray-500 transition-transform duration-200">
                                    {expandedRowId === loc.id ? (
                                        <ChevronDown className="h-4 w-4 text-brand-500" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </div>
                                <span className="text-sm font-bold text-gray-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                                    {loc.name}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col items-start gap-1.5">
                                <span className="inline-flex items-center rounded-lg border border-blue-100 bg-blue-50/80 px-2.5 py-1 text-xs font-bold text-blue-700 backdrop-blur-md dark:border-blue-800/40 dark:bg-blue-900/20 dark:text-blue-400">
                                    {loc.height ? `${loc.height} m` : "Chưa cập nhật"}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2 opacity-60 transition-all duration-300 group-hover:opacity-100">
                                <button
                                    title="Chỉnh sửa"
                                    onClick={() => {
                                        setPickProvince(loc);
                                        setIsEditModalOpen(true);
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-blue-500 transition-all hover:bg-blue-500 hover:text-white hover:shadow-lg hover:shadow-blue-500/30 active:scale-90 dark:bg-gray-800/80 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                                <Popconfirm
                                    title={<span className="font-bold">Xác nhận xóa tỉnh/thành</span>}
                                    description={
                                        <div className="max-w-[250px] text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Bạn có chắc chắn muốn xóa vĩnh viễn <strong>&quot;{loc.name}&quot;</strong>? Hành động này sẽ không thể đảo ngược.
                                        </div>
                                    }
                                    onConfirm={() => executeDelete(loc.id, loc.name)}
                                    okText="Xóa vĩnh viễn"
                                    cancelText="Hủy bỏ"
                                    okButtonProps={{ danger: true, className: "font-semibold" }}
                                    cancelButtonProps={{ className: "font-semibold" }}
                                    placement="topRight"
                                >
                                    <button
                                        title="Gỡ bỏ địa điểm"
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-red-500 transition-all hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/30 active:scale-90 dark:bg-gray-800/80 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </Popconfirm>
                            </div>
                        </td>
                    </motion.tr>

                    {/* --- DÒNG PHỤ: DROPDOWN ĐỊA ĐIỂM (Chỉ hiện khi dòng chính được click) --- */}
                    {expandedRowId === loc.id && (
                        <tr className="bg-gray-50/30 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800">
                            <td colSpan={4} className="p-0">
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="px-6 py-4 lg:pl-32 overflow-hidden"
                                >
                                    <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Compass className="h-4 w-4 text-brand-500" />
                                        Danh sách các địa điểm nổi bật ({Array.isArray(loc.locations) ? loc.locations.length : 0})
                                    </div>

                                    <div className="max-h-[220px] overflow-y-auto rounded-xl border border-gray-200/60 bg-white/50 shadow-inner custom-scrollbar dark:border-gray-700 dark:bg-gray-800/50 p-2">
                                        {Array.isArray(loc.locations) && loc.locations.length > 0 ? (
                                            <ul className="space-y-1">
                                                {loc.locations.map((subLoc: { id: string; name: string }) => (
                                                    <li key={subLoc.id} className="group flex items-center justify-between p-2.5 rounded-lg transition-colors hover:bg-white dark:hover:bg-gray-700/80 hover:shadow-sm">
                                                        <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-900/30">
                                                                <MapPin className="h-3.5 w-3.5" />
                                                            </div>
                                                            {subLoc.name}
                                                        </div>
                                                        <Link
                                                            href={`/locations?search=${encodeURIComponent(subLoc.name)}`}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-brand-900/40 dark:hover:text-brand-400"
                                                        >
                                                            Chi tiết
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="py-8 text-center flex flex-col items-center justify-center">
                                                <MapPin className="h-6 w-6 text-gray-300 mb-2 dark:text-gray-600" />
                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Chưa có địa điểm nào được thêm
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </td>
                        </tr>
                    )}
                </React.Fragment>
            ))}
        </>
    );
};