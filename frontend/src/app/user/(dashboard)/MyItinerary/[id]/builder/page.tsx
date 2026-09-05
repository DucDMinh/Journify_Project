/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from 'sonner';
import { Compass } from "lucide-react";
import { api } from "@/lib/apiClient";
import { BuilderScreen } from "@/components/admin/itineraries/builder/BuilderScreen";
import { Itinerary, Province, Location } from "@/interface";

export default function ItineraryBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const tripId = params.id as string;
    const [isLoading, setIsLoading] = useState(true);
    const [currentItinerary, setCurrentItinerary] = useState<Partial<Itinerary> | undefined>(undefined);
    const [selectedProvinces, setSelectedProvinces] = useState<Province[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [step, setStep] = useState<"BUILDER" | "SETUP">("BUILDER");

    useEffect(() => {
        const fetchInitialWorkspace = async () => {
            if (!tripId) return;
            try {
                const { data, response } = await api.get(`/itineraries/${tripId}`);
                if (!response.ok) throw new Error("Không thể tải dữ liệu lộ trình");

                const fetchedItinerary = data.data.data || data;
                setCurrentItinerary(fetchedItinerary);
                const provinces = fetchedItinerary.itinerary_provinces
                    ?.map((ip: any) => ip.provinces)
                    .filter(Boolean) || [];
                setSelectedProvinces(provinces);
                if (provinces.length > 0) {
                    const results = await Promise.all(
                        provinces.map((province: Province) =>
                            api.get(`/provinces/${province.id}`)
                        )
                    );
                    const locations = results
                        .filter((res) => res.response?.ok)
                        .flatMap((res) => res.data?.data?.locations || res.data?.locations || []);
                    setLocations(locations);
                }
            } catch (error) {
                console.error("Lỗi khởi tạo Workspace:", error);
                toast.error("Lỗi khi tải dữ liệu không gian làm việc");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialWorkspace();
    }, [tripId]);
    const handleSetStep: React.Dispatch<React.SetStateAction<"BUILDER" | "SETUP">> = (newStep) => {
        const stepValue = typeof newStep === 'function' ? newStep(step) : newStep;

        if (stepValue === "SETUP") {
            router.push('/MyItinerary');
        } else {
            setStep(stepValue);
        }
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