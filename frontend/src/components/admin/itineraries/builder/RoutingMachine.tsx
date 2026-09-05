import { useEffect } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { useMap } from "react-leaflet";

interface RoutingMachineProps {
    points: { lat: number; lng: number; name: string }[];
}

export default function RoutingMachine({ points }: RoutingMachineProps) {
    const map = useMap();

    useEffect(() => {
        if (!map || points.length < 2) return;

        const waypoints = points.map(p => L.latLng(p.lat, p.lng));

        const routingControl = L.Routing.control({
            plan: L.Routing.plan(waypoints, {
                createMarker: (i, waypoint) => {
                    return L.marker(waypoint.latLng).bindPopup(
                        `<b>Điểm ${i + 1}</b><br/>${points[i].name}`
                    );
                }
            }),
            routeWhileDragging: false,
            addWaypoints: false,
            showAlternatives: false,
            fitSelectedRoutes: true,
            lineOptions: {
                styles: [{ color: "#0ea5e9", weight: 5 }],
                extendToWaypoints: true,
                missingRouteTolerance: 0
            }
        }).addTo(map);

        return () => {
            if (!map || !routingControl) return;

            try {
                // 1. Xóa các điểm dừng để dọn dẹp layers hiện tại
                routingControl.getPlan().setWaypoints([]);
                map.removeControl(routingControl);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (routingControl as any)._map = {
                    removeLayer: () => { },
                    addLayer: () => { },
                    hasLayer: () => false,
                    on: () => { },
                    off: () => { },
                    getSize: () => ({ x: 0, y: 0 })
                };

            } catch (error) {
                console.warn("Lỗi dọn dẹp bản đồ (đã an toàn bỏ qua):", error);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, JSON.stringify(points)]);

    return null;
}