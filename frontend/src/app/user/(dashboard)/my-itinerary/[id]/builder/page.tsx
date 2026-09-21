"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Compass } from "lucide-react";
import { api } from "@/lib/apiClient";
import { BuilderScreen } from "@/components/admin/itineraries/builder/BuilderScreen";
import { BuilderStep, Itinerary, Province, Location } from "@/interface";

export default function ItineraryBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const tripId = params.id as string;
    const [isLoading, setIsLoading] = useState(true);
    const [currentItinerary, setCurrentItinerary] = useState<Partial<Itinerary> | undefined>(undefined);
    const [selectedProvinces, setSelectedProvinces] = useState<Province[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    useEffect(() => {
        if (!tripId) return;
        const fetchInitialWorkspace = async () => {
            try {
                const { data, response } = await api.get<Itinerary>(`/itineraries/${tripId}`);
                if (!response.ok || !data.data) throw new Error(data.message || "Không thể tải dữ liệu lộ trình");

                const itinerary = data.data;
                setCurrentItinerary(itinerary);
                const provinces = (itinerary.itinerary_provinces ?? [])
                    .map((ip) => ip.provinces)
                    .filter((p): p is Province => Boolean(p));
                setSelectedProvinces(provinces);

                if (provinces.length > 0) {
                    const results = await Promise.all(
                        provinces.map((province) => api.get<Province & { locations?: Location[] }>(`/provinces/${province.id}`)),
                    );
                    setLocations(results.flatMap((res) => (res.response.ok ? res.data.data?.locations ?? [] : [])));
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Lỗi khi tải dữ liệu không gian làm việc");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialWorkspace();
    }, [tripId]);

    const handleSetStep: React.Dispatch<React.SetStateAction<BuilderStep>> = (nextStep) => {
        const stepValue = typeof nextStep === "function" ? nextStep("BUILDER") : nextStep;
        if (stepValue === "SETUP") router.push("/my-itinerary");
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="flex flex-col items-center">
                    <Compass className="h-10 w-10 animate-spin text-brand-500 mb-4" />
                    <p className="text-gray-500 font-medium animate-pulse">Đang tải không gian làm việc...</p>
                </div>
            </div>
        );
    }

    return (
        <BuilderScreen
            setStep={handleSetStep}
            currentItinerary={currentItinerary}
            setCurrentItinerary={setCurrentItinerary}
            selectedProvinces={selectedProvinces}
            setSelectedProvinces={setSelectedProvinces}
            locations={locations}
            setLocations={setLocations}
        />
    );
}
