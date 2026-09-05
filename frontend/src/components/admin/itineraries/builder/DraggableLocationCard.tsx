/* eslint-disable @typescript-eslint/no-explicit-any */
import { useDraggable } from "@dnd-kit/core";
import { Plus, Star, Info } from "lucide-react";
import { useState, useRef } from "react";

export const DraggableLocationCard = ({
    loc,
    onAdd,
    isAdded,
    distance
}: {
    loc: any,
    onAdd?: () => void,
    isAdded?: boolean,
    distance?: number
}) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `drag-loc-${loc.id}`,
        data: { location: loc }
    });

    // 🌟 STATE QUẢN LÝ POPUP THÔNG TIN
    const [isHovered, setIsHovered] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState({ top: 0, left: 0 });
    const cardRef = useRef<HTMLDivElement>(null);

    // Kích hoạt khi chuột đưa vào thẻ
    const handleMouseEnter = () => {
        if (isDragging || !cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();

        // Tính toán vị trí top, giới hạn không cho tràn màn hình xuống dưới (giả định popup cao khoảng 300px)
        const topPos = Math.min(rect.top, window.innerHeight - 320);

        setTooltipStyle({
            top: topPos,
            left: rect.left - 16 // Cách lề trái của card 16px
        });
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <>
            <div
                ref={(node) => {
                    setNodeRef(node);
                    cardRef.current = node as HTMLDivElement;
                }}
                {...listeners}
                {...attributes}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`group relative flex cursor-grab items-center gap-3 rounded-xl border p-3 shadow-sm transition-all active:cursor-grabbing ${isDragging ? 'opacity-40 border-brand-300' : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 hover:border-brand-300 hover:shadow-md'
                    } ${isAdded ? 'opacity-50 saturate-50' : 'opacity-100'}`}
            >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 pointer-events-none relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={loc.image_url || loc.img} alt={loc.name} className="h-full w-full object-cover" />
                    {isAdded && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Đã<br />thêm</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 pointer-events-none">
                    <h4 className={`truncate text-sm font-bold ${isAdded ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{loc.name}</h4>
                    <div className="mt-1 flex items-center gap-1.5 text-xs">
                        <span className={`${isAdded ? 'text-gray-400' : 'text-green-500'} font-medium`}>
                            {loc.difficulty_level || loc.difficulty || "Cơ bản"}
                        </span>

                        {distance !== undefined ? (
                            <>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="text-brand-500 font-medium">{distance.toFixed(1)} km</span>
                            </>
                        ) : (
                            <>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="text-gray-400 italic text-[11px]">Chưa có tọa độ</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                    <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd?.();
                        }}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:hover:bg-brand-900/50"
                        title="Thêm vào lộ trình"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>
            {isHovered && !isDragging && (
                <div
                    className="fixed z-[9999] w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden pointer-events-none animate-in fade-in slide-in-from-right-4 duration-200"
                    style={{
                        top: tooltipStyle.top,
                        left: tooltipStyle.left,
                        transform: 'translateX(-100%)'
                    }}
                >
                    {(loc.image_url || loc.img) && (
                        <div className="h-32 w-full bg-gray-100 dark:bg-gray-700 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={loc.image_url || loc.img} alt={loc.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <h4 className="absolute bottom-3 left-4 right-4 text-white font-bold text-lg leading-tight line-clamp-2 shadow-sm">
                                {loc.name}
                            </h4>
                        </div>
                    )}
                    <div className="p-4">
                        {!(loc.image_url || loc.img) && (
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg leading-tight line-clamp-2">
                                {loc.name}
                            </h4>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-semibold">
                            {loc.rating && (
                                <span className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 px-2 py-1 rounded-md">
                                    <Star className="h-3.5 w-3.5 fill-current" /> {loc.rating}
                                </span>
                            )}
                            <span className="bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-2 py-1 rounded-md">
                                {loc.difficulty_level || loc.difficulty || "Cơ bản"}
                            </span>
                        </div>

                        {loc.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4 leading-relaxed mb-3">
                                {loc.description}
                            </p>
                        )}

                        {loc.note && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-xl border border-amber-100 dark:border-amber-800/50">
                                <p className="text-xs text-amber-800 dark:text-amber-400 flex items-start gap-1.5">
                                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span className="line-clamp-3 leading-relaxed">{loc.note}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};