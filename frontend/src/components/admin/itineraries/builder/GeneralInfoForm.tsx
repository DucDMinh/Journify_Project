import { Itinerary } from "@/interface";
import { Switch } from "antd";
import { Calendar, MapPin } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface GeneralInfoFormProp {
    currentItinerary: Partial<Itinerary> | undefined,
    setCurrentItinerary: Dispatch<SetStateAction<Partial<Itinerary> | undefined>>,
}

export const GeneralInfoForm = ({ currentItinerary, setCurrentItinerary }: GeneralInfoFormProp) => {
    const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    return (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-4">
                <input
                    type="text"
                    value={currentItinerary?.title || ''}
                    required
                    onChange={(e) => setCurrentItinerary({ ...currentItinerary, title: e.target.value })}
                    placeholder="Nhập tên lộ trình"
                    className="flex-1 w-full border-none bg-transparent text-3xl font-black text-gray-900 focus:outline-none focus:ring-0 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700"
                />
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {currentItinerary?.share ? 'Công khai' : 'Riêng tư'}
                    </span>
                    <Switch checked={currentItinerary?.share ?? false}
                        onChange={() => setCurrentItinerary({
                            ...currentItinerary,
                            share: !currentItinerary?.share
                        })}>
                    </Switch>
                </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Ngày khởi hành
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none z-10" />

                        <input
                            type="date"
                            min={today}
                            value={currentItinerary?.start_date || ''}
                            onChange={(e) => setCurrentItinerary({ ...currentItinerary, start_date: e.target.value })}
                            onClick={(e) => {
                                if ('showPicker' in HTMLInputElement.prototype) {
                                    e.currentTarget.showPicker();
                                }
                            }}

                            className="w-full cursor-pointer rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white [color-scheme:light_dark]"
                        />
                    </div>
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Ngày kết thúc
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none z-10" />

                        <input
                            type="date"
                            value={currentItinerary?.end_date || ''}
                            onChange={(e) => setCurrentItinerary({ ...currentItinerary, end_date: e.target.value })}
                            min={currentItinerary?.start_date || today}
                            onClick={(e) => {
                                if ('showPicker' in HTMLInputElement.prototype) {
                                    e.currentTarget.showPicker();
                                }
                            }}

                            className="w-full cursor-pointer rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white [color-scheme:light_dark]"
                        />
                    </div>
                </div>
                <div>
                    <label className="mb-1.5 flex items-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                        <MapPin className="mr-2 h-4 w-4" /> Chủ đề
                    </label>
                    <select value={currentItinerary?.theme || ''} onChange={(e) => setCurrentItinerary({ ...currentItinerary, theme: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                        <option value="">Chọn chủ đề...</option>
                        <option value="Trekking & Khám phá">Trekking & Khám phá</option>
                        <option value="Nghỉ dưỡng">Nghỉ dưỡng</option>
                        <option value="Văn hóa - Lịch sử">Văn hóa - Lịch sử</option>
                        <option value="Ẩm thực">Ẩm thực</option>
                    </select>
                </div>
            </div>
        </div>
    )
}