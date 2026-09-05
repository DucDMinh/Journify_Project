"use client";
import { useState } from "react";

import { Itinerary, Location, Province } from "@/interface";
import { SetupScreen } from "@/components/admin/itineraries/setup";
import { BuilderScreen } from "@/components/admin/itineraries/builder/BuilderScreen";

export default function ItineraryBuilderPage() {
    const [step, setStep] = useState<"SETUP" | "BUILDER">("SETUP");
    const [selectedProvinces, setSelectedProvinces] = useState<Province[]>([]);
    const [currentItinerary, setCurrentItinerary] = useState<Partial<Itinerary>>();
    const [locations, setLocations] = useState<Location[]>([]);
    if (step === "SETUP") {
        return (
            <SetupScreen
                selectedProvinces={selectedProvinces}
                setSelectedProvinces={setSelectedProvinces}
                setLocations={setLocations}
                setStep={setStep}
                setCurrentItinerary={setCurrentItinerary}
                step={step}
            />
        );
    }


    return (
        <BuilderScreen
            setStep={setStep}
            selectedProvinces={selectedProvinces}
            currentItinerary={currentItinerary}
            setCurrentItinerary={setCurrentItinerary}
            locations={locations}
            setSelectedProvinces={setSelectedProvinces}
            setLocations={setLocations}
        />
    );
}