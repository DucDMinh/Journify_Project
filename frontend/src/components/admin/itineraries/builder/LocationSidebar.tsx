/* eslint-disable @typescript-eslint/no-explicit-any */
import { Province, Location, Itinerary_days } from "@/interface";
import { CheckCircle2, Search } from "lucide-react";
import { DraggableLocationCard } from "./DraggableLocationCard";
import { useState, useMemo } from "react";
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

interface LocationSidebarProp {
    selectedProvinces: Province[];
    locations: Location[];
    onAddLocation?: (loc: Location) => void;
    days: Itinerary_days[];
}

export const LocationSidebar = ({ selectedProvinces, locations, onAddLocation, days }: LocationSidebarProp) => {
    const [searchTerm, setSearchTerm] = useState("");

    const { addedLocationIds, referencePoint } = useMemo<{
        addedLocationIds: Set<string>;
        referencePoint: { lat: number; lng: number } | null;
    }>(() => {
        const ids = new Set<string>();
        let lastValidLoc: { lat: number; lng: number } | null = null;

        (days || []).forEach((day: any) => {
            (day.itinerary_locations || []).forEach((loc: any) => {
                if (loc.location_id) ids.add(loc.location_id);
                const lat = Number(loc.lat || loc.locations?.lat || 0);
                const lng = Number(loc.lng || loc.locations?.lng || 0);
                if (lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
                    lastValidLoc = { lat, lng };
                }
            });
        });

        return { addedLocationIds: ids, referencePoint: lastValidLoc };
    }, [days]);
    const processedLocations = useMemo<any[]>(() => {
        let result = locations || [];

        if (searchTerm.trim()) {
            result = result.filter((loc: any) => loc.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        let mappedResult = result.map((loc: any) => {
            let dist: number | undefined = undefined;
            const lat = Number(loc.lat || loc.locations?.lat || loc.latitude || 0);
            const lng = Number(loc.lng || loc.locations?.lng || loc.longitude || 0);

            if (referencePoint && lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
                dist = calculateDistance(
                    referencePoint.lat,
                    referencePoint.lng,
                    lat,
                    lng
                );
            }
            return { ...loc, distance: dist };
        });

        if (referencePoint) {
            mappedResult = mappedResult.sort((a: any, b: any) => {
                if (a.distance === undefined) return 1;
                if (b.distance === undefined) return -1;
                return a.distance - b.distance;
            });
        }

        return mappedResult;
    }, [locations, searchTerm, referencePoint]);

    return (
        <div className="col-span-1 xl:col-span-4 border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 flex flex-col sticky top-[80px] h-[calc(100vh-80px)] self-start">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Kho Địa Điểm</h3>
                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span className="truncate">
                        {referencePoint
                            ? "Đang sắp xếp các điểm gần bạn nhất"
                            : (selectedProvinces.length > 0 ? `Đang gợi ý điểm tại ${selectedProvinces.map(p => p.name).join(", ")}` : "Đang hiển thị tất cả địa điểm")}
                    </span>
                </p>

                <div className="flex gap-2">
                    <div className="relative flex flex-1 shadow-sm rounded-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Tìm tên địa điểm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-l-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />
                        <button type="button" className="flex items-center justify-center rounded-r-lg border border-l-0 border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">Tìm</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-5 pb-32 custom-scrollbar">
                {(() => {
                    return processedLocations.length > 0 ? (
                        processedLocations.map((loc: any) => (
                            <DraggableLocationCard
                                key={loc.id}
                                loc={loc}
                                isAdded={addedLocationIds.has(loc.id)}
                                distance={loc.distance}
                                onAdd={() => onAddLocation?.(loc as any)}
                            />
                        ))
                    ) : (
                        <div className="py-12 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                            Không tìm thấy địa điểm phù hợp.
                        </div>
                    );
                })()}
            </div>
        </div>
    )
}