import { useEffect, useMemo } from "react";
import L from "leaflet";
import { Marker, Polyline, Popup, useMap } from "react-leaflet";
import { shortPlaceName } from "@/lib/format";
import { decodePolyline, RoadRoute } from "@/utils/map";

interface RoutingMachineProps {
    points: { lat: number; lng: number; name: string }[];
    route: RoadRoute | null;
    fallback: boolean;
}

type LatLngTuple = [number, number];

const stopIcon = (label: number) =>
    L.divIcon({
        className: "",
        html: `<div class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-sky-500 text-xs font-bold text-white shadow-md">${label}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
    });

export default function RoutingMachine({ points, route, fallback }: RoutingMachineProps) {
    const map = useMap();

    const roadLines = useMemo(() => (route?.legs ?? []).flatMap((leg) => leg.shapes.map((shape) => decodePolyline(shape))), [route]);

    const gapLines = useMemo(() => {
        const toTuple = ({ lat, lng }: { lat: number; lng: number }): LatLngTuple => [lat, lng];
        if (fallback) return [points.map(toTuple)];
        return (route?.legs ?? []).flatMap((leg, i) => (!leg.shapes.length && points[i + 1] ? [[toTuple(points[i]), toTuple(points[i + 1])]] : []));
    }, [fallback, route, points]);

    useEffect(() => {
        const coordinates: LatLngTuple[] = [...points.map(({ lat, lng }): LatLngTuple => [lat, lng]), ...roadLines.flat()];
        if (coordinates.length) map.fitBounds(L.latLngBounds(coordinates), { padding: [32, 32] });
    }, [map, points, roadLines]);

    return (
        <>
            {roadLines.map((line, i) => (
                <Polyline key={`road-${i}`} positions={line} pathOptions={{ color: "#0ea5e9", weight: 5, opacity: 0.85 }} />
            ))}
            {gapLines.map((line, i) => (
                <Polyline key={`gap-${i}`} positions={line} pathOptions={{ color: "#f59e0b", weight: 3, dashArray: "6 8" }} />
            ))}
            {points.map((point, i) => (
                <Marker key={`${i}-${point.lat}-${point.lng}`} position={[point.lat, point.lng]} icon={stopIcon(i + 1)}>
                    <Popup>
                        <b>Điểm {i + 1}</b>
                        <br />
                        {shortPlaceName(point.name)}
                    </Popup>
                </Marker>
            ))}
        </>
    );
}
