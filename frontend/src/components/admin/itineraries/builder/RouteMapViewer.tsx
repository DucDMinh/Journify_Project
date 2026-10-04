import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, Route, TriangleAlert } from "lucide-react";
import RoutingMachine from "./RoutingMachine";
import { Itinerary_days } from "@/interface";
import { api } from "@/lib/apiClient";
import { formatDistanceKm, formatDuration } from "@/lib/format";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_SUBDOMAINS, MAP_TILE_URL, RoadRoute } from "@/utils/map";

interface RouteMapViewerProps {
    days: Itinerary_days[] | null;
}

export default function RouteMapViewer({ days }: RouteMapViewerProps) {
    const points = useMemo(() => {
        const list: { lat: number; lng: number; name: string }[] = [];
        days?.forEach((day) => {
            day.itinerary_locations?.forEach((loc) => {
                if (loc.lat && loc.lng && loc.lat !== 0) {
                    list.push({ lat: Number(loc.lat), lng: Number(loc.lng), name: loc.location_name || "Địa điểm" });
                }
            });
        });
        return list;
    }, [days]);

    const requestKey = JSON.stringify(points.map(({ lat, lng }) => [lat, lng]));
    const [result, setResult] = useState<{ key: string; route: RoadRoute | null } | null>(null);

    useEffect(() => {
        const coordinates: [number, number][] = JSON.parse(requestKey);
        if (coordinates.length < 2) return;
        let ignore = false;
        api.post<RoadRoute>("/map/route", { points: coordinates.map(([lat, lng]) => ({ lat, lng })) })
            .then(({ response, data }) => {
                if (!ignore) setResult({ key: requestKey, route: response.ok ? data.data ?? null : null });
            })
            .catch(() => {
                if (!ignore) setResult({ key: requestKey, route: null });
            });
        return () => {
            ignore = true;
        };
    }, [requestKey]);

    if (points.length < 2) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <span className="text-4xl mb-4">🗺️</span>
                <p className="text-gray-500 font-medium">
                    Cần ít nhất 2 địa điểm có tọa độ để vẽ đường đi.<br />
                    Hãy ghim thêm tọa độ cho các hoạt động nhé!
                </p>
            </div>
        );
    }

    const isLoading = result?.key !== requestKey;
    const route = isLoading ? null : result?.route ?? null;
    const fallback = !isLoading && (!route || route.degraded);
    const hasGaps = Boolean(route && !route.degraded && route.legs.some((leg) => !leg.shapes.length));

    return (
        <div className="relative h-full w-full">
            <MapContainer center={[points[0].lat, points[0].lng]} zoom={10} className="h-full w-full">
                <TileLayer attribution={MAP_TILE_ATTRIBUTION} url={MAP_TILE_URL} subdomains={MAP_TILE_SUBDOMAINS} />
                <RoutingMachine points={points} route={route && !route.degraded ? route : null} fallback={fallback} />
            </MapContainer>
            <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] max-w-[calc(100%-1.5rem)] rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-gray-700 shadow-md dark:bg-gray-900/90 dark:text-gray-200">
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-500" /> Đang tìm đường đi trong lãnh thổ Việt Nam...
                    </span>
                ) : fallback ? (
                    <span className="flex items-center gap-2">
                        <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" /> Chưa tải được đường đi thực tế, đang nối thẳng các điểm theo thứ tự.
                    </span>
                ) : (
                    <>
                        <span className="flex items-center gap-2">
                            <Route className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                            {points.length} điểm · {formatDistanceKm(route?.distanceKm)} · khoảng {formatDuration(route?.durationMinutes)} lái xe
                        </span>
                        {hasGaps && <span className="mt-1 block text-amber-600 dark:text-amber-400">Nét đứt: chặng chưa có đường bộ (đi tàu, thuyền hoặc thiếu dữ liệu đường).</span>}
                    </>
                )}
            </div>
        </div>
    );
}
