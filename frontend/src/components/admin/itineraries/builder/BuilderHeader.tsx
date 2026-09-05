/* eslint-disable @typescript-eslint/no-explicit-any */
import { Map, ArrowLeft, Save, DollarSign, Plus, MapPin, X } from "lucide-react"; // 🌟 Nhớ import MapPin

interface BuilderHeaderProps {
    totalCost: number;
    selectedProvinces: any[];
    onBack: () => void;
    onSave: () => void;
    isDropdownOpen: boolean;
    setIsDropdownOpen: (val: boolean) => void;
    searchProvince: string;
    setSearchProvince: (val: string) => void;
    filteredProvinces: any[];
    onAddNewProvince: (province: any) => void;
    onOpenDropdown: () => void;
    onRemoveProvince: (id: string) => void;
}

export const BuilderHeader = ({
    totalCost, selectedProvinces, onBack, onSave,
    isDropdownOpen, setIsDropdownOpen, searchProvince, setSearchProvince, filteredProvinces, onAddNewProvince, onOpenDropdown, onRemoveProvince
}: BuilderHeaderProps) => {
    return (
        <>
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    <Map className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Thiết kế Lộ trình</h1>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {selectedProvinces.length > 0 ? (
                            selectedProvinces.map(p => (
                                <span key={p.id} className="flex items-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md dark:bg-brand-900/30 dark:text-brand-400">
                                    {p.name}
                                    <button
                                        onClick={() => onRemoveProvince(p.id)}
                                        className="text-brand-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full p-0.5 transition-colors"
                                        title="Xóa khu vực này"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-gray-500">Chưa chọn khu vực cụ thể</span>
                        )}

                        <div className="relative flex items-center">
                            {!isDropdownOpen ? (
                                <button
                                    onClick={onOpenDropdown}
                                    className="flex items-center justify-center h-5 w-5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                                    title="Thêm khu vực"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                            ) : (
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchProvince}
                                    onChange={(e) => setSearchProvince(e.target.value)}
                                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                    placeholder="Tìm tỉnh..."
                                    className="h-6 text-xs px-2 py-1 w-32 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:border-brand-500 dark:text-white"
                                />
                            )}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                        {filteredProvinces && filteredProvinces.length > 0 ? (
                                            filteredProvinces.map((province) => (
                                                <button
                                                    key={province.id}
                                                    onClick={() => onAddNewProvince(province)}
                                                    className="w-full text-left px-4 py-3 flex items-center hover:bg-brand-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-none focus:bg-brand-50 focus:outline-none"
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
                        </div>
                    </div>

                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-green-50 px-4 py-2 text-green-700 rounded-xl dark:bg-green-900/30 dark:text-green-400">
                    <DollarSign className="h-5 w-5" />
                    <div>
                        <p className="text-xs font-semibold">Tổng dự kiến</p>
                        <p className="text-lg font-bold">{totalCost.toLocaleString('vi-VN')} đ</p>
                    </div>
                </div>
                <button
                    onClick={onSave}
                    className="flex items-center rounded-xl bg-brand-600 px-6 py-2.5 font-bold text-white transition-transform active:scale-95 hover:bg-brand-700 shadow-md shadow-brand-500/30">
                    <Save className="mr-2 h-4 w-4" /> Lưu
                </button>
            </div>
        </>
    )
}