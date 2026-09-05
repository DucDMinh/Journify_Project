"use client";
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface MapPickerProps {
    lat?: string | number;
    lng?: string | number;
    onLocationSelect: (lat: string, lng: string) => void;
}
function MapUpdater({ lat, lng, setPosition }: { lat?: string | number; lng?: string | number; setPosition: React.Dispatch<React.SetStateAction<L.LatLng | null>>; }) {
    const map = useMap();

    useEffect(() => {
        if (lat && lng) {
            const parsedLat = parseFloat(lat as string);
            const parsedLng = parseFloat(lng as string);

            if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                const newPos = new L.LatLng(parsedLat, parsedLng);
                setPosition(newPos);
                map.flyTo(newPos, 14, { duration: 1.5 });
            }
        }
    }, [lat, lng, map, setPosition]);

    return null;
}

function LocationMarker({ position, setPosition, onLocationSelect }: { position: L.LatLng | null; setPosition: React.Dispatch<React.SetStateAction<L.LatLng | null>>; onLocationSelect: (lat: string, lng: string) => void }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng.lat.toString(), e.latlng.lng.toString());
        },
    });

    return position === null ? null : <Marker position={position} icon={customIcon} />;
}

export default function MapPicker({ lat, lng, onLocationSelect }: MapPickerProps) {
    const [position, setPosition] = useState<L.LatLng | null>(null);

    return (
        <div className="h-full w-full bg-gray-100">
            <MapContainer
                center={[16.047079, 108.20623]}
                zoom={6}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapUpdater lat={lat} lng={lng} setPosition={setPosition} />

                <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
            </MapContainer>
        </div>
    );
}