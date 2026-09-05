import { useDroppable } from "@dnd-kit/core";
import { CheckCircle2, Map, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from 'sonner';

export const DroppableActivityZone = ({
    dayId,
    loc,
    onUpdate,
    onOpenMap
}: {
    dayId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loc: any, onUpdate: any,
    onOpenMap: (dayId: string, locId: string) => void
}) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `drop-activity-${dayId}-${loc.id}`,
        data: { type: 'existing-activity', dayId, activityId: loc.id }
    });

    const [isSearchingLoc, setIsSearchingLoc] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    return (
        <div
            ref={setNodeRef}
            className={`relative flex items-center rounded-lg border bg-white transition-all overflow-hidden h-[42px] ${isOver
                ? 'border-brand-500 bg-brand-50 shadow-md ring-2 ring-brand-500/20 dark:bg-brand-900/30'
                : 'border-gray-200 dark:border-gray-600 dark:bg-gray-800'
                }`}
        >
            <input
                type="text"
                placeholder={
                    isOver
                        ? "✨ Thả địa điểm vào đây..."
                        : "Gõ tên, kéo thả, hoặc chọn Map..."
                }
                value={loc.location_name || ''}
                onChange={(e) => {
                    const newValue = e.target.value;
                    if (loc.location_id) {
                        onUpdate(dayId, loc.id, {
                            location_name: newValue,
                            location_id: "", // xóa liên kết cũ
                        });
                    } else {
                        onUpdate(dayId, loc.id, { location_name: newValue });
                    }
                }}
                onBlur={async (e) => {
                    const typedName = e.target.value.trim();
                    if (!typedName) return;
                    if (isSearchingLoc) return;
                    if (abortControllerRef.current) {
                        abortControllerRef.current.abort();
                    }
                    const controller = new AbortController();
                    abortControllerRef.current = controller;

                    try {
                        setIsSearchingLoc(true);

                        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                            typedName
                        )}&format=json&limit=1&countrycodes=vn&accept-language=vi`;

                        const res = await fetch(url, {
                            headers: {
                                'User-Agent': 'MyTravelApp/1.0 (daod1278@example.com)',
                            },
                            signal: controller.signal,
                        });

                        if (!res.ok) throw new Error('Network response was not ok');
                        const data = await res.json();

                        if (Array.isArray(data) && data.length > 0) {
                            const { lat, lon, display_name } = data[0];
                            onUpdate(dayId, loc.id, {
                                lat: parseFloat(lat),
                                lng: parseFloat(lon),
                                location_name: typedName,
                                display_name,
                            });

                            toast.success(
                                `Đã ghim: ${display_name.split(',').slice(0, 3).join(',')}`
                            );
                        } else {
                            onUpdate(dayId, loc.id, {
                                lat: null,
                                lng: null,
                                location_name: typedName,
                            });

                            toast.error(
                                `Không tìm thấy "${typedName}". Vui lòng ghim lại trên Bản đồ!`,
                                { duration: 4000, icon: '⚠️' }
                            );
                        }
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (err: any) {
                        if (err.name === 'AbortError') return;
                        console.error('Lỗi tìm tọa độ:', err);
                        toast.error('Lỗi kết nối tới hệ thống bản đồ.');
                    } finally {
                        setIsSearchingLoc(false);
                        abortControllerRef.current = null;
                    }
                }}
                className={`flex-1 min-w-0 bg-transparent px-3 text-sm font-medium outline-none placeholder:text-gray-400 dark:text-white ${isOver ? 'text-brand-600' : ''
                    }`}
            />

            <div className="flex h-full items-center shrink-0">
                {isSearchingLoc ? (
                    <div className="flex h-full items-center px-3 border-l border-gray-100 dark:border-gray-700 bg-gray-50 text-brand-500">
                        <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : loc.location_id ? (
                    <div className="flex h-full items-center px-3 border-l border-gray-100 dark:border-gray-700 bg-green-50 dark:bg-green-900/20 text-green-600" title="Địa điểm chuẩn từ hệ thống">
                        <CheckCircle2 className="h-4 w-4" />
                    </div>
                ) : (
                    <button
                        onClick={() => onOpenMap(dayId, loc.id)}
                        className="flex h-full items-center justify-center gap-1.5 border-l border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:text-brand-400"
                    >
                        <Map className="h-4 w-4" /> Bản đồ
                    </button>
                )}
            </div>
        </div>
    );
};
export const DroppableAddButton = ({ dayId, onAdd }: { dayId: string, onAdd: () => void }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `drop-new-${dayId}`,
        data: { type: 'new-activity', dayId }
    });

    return (
        <button
            ref={setNodeRef}
            onClick={onAdd}
            className={`flex w-full items-center justify-center rounded-xl border-2 border-dashed py-3 text-sm font-medium transition-all ${isOver ? 'border-brand-500 bg-brand-50 text-brand-600 scale-[1.02] shadow-sm dark:bg-brand-900/30 dark:text-brand-400'
                : 'border-gray-200 bg-gray-50/50 text-gray-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800/30'
                }`}
        >
            <Plus className="mr-2 h-4 w-4" />
            {isOver ? "✨ Thả để tạo ngay hoạt động mới!" : "Thêm hoạt động (hoặc Kéo thả vào đây)"}
        </button>
    );
};