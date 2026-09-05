import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import RoutingMachine from "./RoutingMachine";
import { Itinerary_days } from "@/interface";

interface RouteMapViewerProps {
    days: Itinerary_days[] | null;
}

export default function RouteMapViewer({ days }: RouteMapViewerProps) {
    const points: { lat: number; lng: number; name: string }[] = [];

    days?.forEach((day) => {
        day.itinerary_locations?.forEach((loc) => {
            if (loc.lat && loc.lng && loc.lat !== 0) {
                points.push({
                    lat: loc.lat,
                    lng: loc.lng,
                    name: loc.location_name || "Địa điểm"
                });
            }
        });
    });

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

    return (
        <MapContainer center={[points[0].lat, points[0].lng]} zoom={10} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RoutingMachine points={points} />
        </MapContainer>
    );
}