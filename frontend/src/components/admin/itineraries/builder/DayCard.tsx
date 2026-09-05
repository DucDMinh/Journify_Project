import { Itinerary_days, Itinerary_locations } from "@/interface";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, DollarSign, MapPin, Trash2 } from "lucide-react";
import { DroppableActivityZone, DroppableAddButton } from "./ActivityDropZone";
interface DayCardProp {
    days: Itinerary_days[];
    handleRemoveActivity: (dayId: string, activityId: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleUpdateActivity: (dayId: string, activityId: string, field: string | object, value?: any) => void;
    handleMoveActivity: (dayId: string, activityId: string, direction: 'UP' | 'DOWN') => void;
    setIsMapModalOpen: (isOpen: boolean) => void;
    setCurrentActiveDayId: (id: string | null) => void;
    setCurrentActiveLocId: (id: string | null) => void;
    handleAddActivity: (dayId: string) => void;
}

export const DayCard = ({
    days,
    handleRemoveActivity,
    handleUpdateActivity,
    handleMoveActivity,
    setIsMapModalOpen,
    setCurrentActiveDayId,
    setCurrentActiveLocId,
    handleAddActivity
}: DayCardProp) => {

    return (
        <div className="space-y-6">
            {days.length > 0 ? days.map((day) => (
                <motion.div key={day.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">                              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3 w-full">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white dark:bg-white dark:text-gray-900">{day.day_number}</div>
                        <input type="text" defaultValue={day.title} className="w-full border-none bg-transparent font-bold text-gray-900 focus:ring-0 dark:text-white outline-none" />
                    </div>
                </div>
                    <div className="p-4 space-y-4">
                        {day.itinerary_locations?.map((loc: Itinerary_locations, index: number) => (
                            <div key={loc.id} id={`activity-${loc.id}`} className="group relative flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50 hover:border-brand-300 transition-colors">
                                <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 bg-white">
                                    <button
                                        onClick={() => handleMoveActivity(day.id, loc.id, 'UP')}
                                        disabled={index === 0}
                                        className="p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                                        title="Chuyển lên trên"
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleMoveActivity(day.id, loc.id, 'DOWN')}
                                        disabled={index === (day.itinerary_locations?.length || 0) - 1}
                                        className="p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                                        title="Chuyển xuống dưới"
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-400 rounded-l-xl opacity-50"></div>
                                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                    <button
                                        onClick={() => handleRemoveActivity(day.id, loc.id)}
                                        className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-900/30 transition-colors"
                                        title="Xóa hoạt động này"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                    <div className="lg:col-span-5">
                                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Địa điểm</label>
                                        {loc.location_id ? (
                                            <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 p-2 text-sm dark:border-brand-900/50 dark:bg-brand-900/20 h-[42px]">
                                                <div className="flex items-center gap-2 truncate">
                                                    <MapPin className="h-4 w-4 text-brand-500 shrink-0" />
                                                    <span className="font-medium text-brand-700 dark:text-brand-400 truncate" title={loc.location_name}>

                                                        {loc.location_name}

                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        handleUpdateActivity(day.id, loc.id, 'location_id', "");
                                                        handleUpdateActivity(day.id, loc.id, 'location_name', "");
                                                    }}
                                                    className="text-xs text-gray-400 hover:text-red-500 px-2 shrink-0 transition-colors"
                                                >
                                                    Gỡ
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="lg:col-span-5">
                                                <DroppableActivityZone
                                                    dayId={day.id}
                                                    loc={loc}
                                                    onUpdate={handleUpdateActivity}
                                                    onOpenMap={(dId, lId) => {
                                                        setIsMapModalOpen(true);
                                                        setCurrentActiveDayId(dId);
                                                        setCurrentActiveLocId(lId);
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="lg:col-span-4 flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Từ</label>
                                            <input
                                                type="time"
                                                value={loc.start_time}
                                                onChange={(e) => handleUpdateActivity(day.id, loc.id, 'start_time', e.target.value)}
                                                className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white h-[42px] [color-scheme:light_dark]"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Đến</label>
                                            <input
                                                type="time"
                                                value={loc.end_time}
                                                onChange={(e) => handleUpdateActivity(day.id, loc.id, 'end_time', e.target.value)}
                                                className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white h-[42px] [color-scheme:light_dark]"
                                            />
                                        </div>
                                    </div>

                                    <div className="lg:col-span-3">
                                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Chi phí (VNĐ)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={loc.cost || ''}
                                                onChange={(e) => handleUpdateActivity(day.id, loc.id, 'cost', Number(e.target.value))}
                                                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white h-[42px]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        placeholder="Ghi chú (VD: Lên đồ đẹp chụp hình, vé vào cổng mua trước...)"
                                        value={loc.activity_note}
                                        onChange={(e) => handleUpdateActivity(day.id, loc.id, 'activity_note', e.target.value)}
                                        className="w-full rounded-lg border border-transparent bg-transparent p-2 text-sm text-gray-700 placeholder-gray-400 hover:border-gray-200 hover:bg-white focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-900 dark:focus:bg-gray-900"
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="p-4">
                            <DroppableAddButton dayId={day.id} onAdd={() => handleAddActivity(day.id)} />
                        </div>
                    </div>
                </motion.div>
            )) : (
                <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-white/50 dark:bg-gray-900/50">
                    Chưa có lịch trình ngày nào. Nhập ngày khởi hành và kết thúc để bắt đầu
                </div>
            )}
        </div>
    )
}