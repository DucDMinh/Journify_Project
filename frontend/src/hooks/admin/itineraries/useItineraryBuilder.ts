import { useState } from "react";
import { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { BuilderScreenProp, Itinerary, Itinerary_days, Itinerary_locations, Location } from "@/interface";
import { api } from "@/lib/apiClient";

export type ActivityPatch = Partial<Itinerary_locations>;
export type UpdateActivityFn = <K extends keyof Itinerary_locations>(
    dayId: string,
    activityId: string,
    fieldOrPatch: K | ActivityPatch,
    value?: Itinerary_locations[K],
) => void;

type DropData =
    | { type: "existing-activity"; dayId: string; activityId: string }
    | { type: "new-activity"; dayId: string };

const DEFAULT_START_TIME = "08:00";
const DEFAULT_END_TIME = "10:00";
const HIGHLIGHT_CLASSES = ["ring-4", "ring-brand-500", "border-brand-500", "bg-brand-50", "dark:bg-brand-900/20"];

const countDays = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (Number.isNaN(diff) || diff < 0) return null;
    return Math.ceil(diff / 86_400_000) + 1;
};

const makeEmptyDay = (dayNumber: number): Itinerary_days => ({
    id: uuidv4(),
    day_number: dayNumber,
    title: `Ngày ${dayNumber}`,
    itinerary_locations: [],
});

const resizeDays = (days: Itinerary_days[], start?: string, end?: string) => {
    const target = countDays(start, end);
    if (target === null || target === days.length) return days;
    if (target < days.length) return days.slice(0, target);
    const extra = Array.from({ length: target - days.length }, (_, i) => makeEmptyDay(days.length + i + 1));
    return [...days, ...extra];
};

const normalizeLoadedDays = (itinerary?: Partial<Itinerary>): Itinerary_days[] => {
    const loaded = itinerary?.itinerary_days;
    if (!loaded?.length) return resizeDays([], itinerary?.start_date, itinerary?.end_date);
    return loaded.map((day) => ({
        ...day,
        itinerary_locations: (day.itinerary_locations ?? []).map((loc) => ({
            ...loc,
            location_id: loc.locations?.id ?? loc.location_id,
            location_name: loc.locations?.name ?? loc.location_name,
            lat: Number(loc.lat ?? 0),
            lng: Number(loc.lng ?? 0),
        })),
    }));
};

const reindex = (locations: Itinerary_locations[]) =>
    locations.map((loc, index) => ({ ...loc, sequence_order: index + 1 }));

const nextStartTime = (locations: Itinerary_locations[]) =>
    locations.at(-1)?.end_time || DEFAULT_START_TIME;

const makeActivity = (dayId: string, sequence: number, location?: Location, startTime = DEFAULT_START_TIME, endTime = ""): Itinerary_locations => ({
    id: uuidv4(),
    day_id: dayId,
    location_id: location?.id ?? "",
    location_name: location?.name ?? "",
    lat: location?.lat ?? 0,
    lng: location?.lng ?? 0,
    start_time: startTime,
    end_time: endTime,
    cost: 0,
    sequence_order: sequence,
    activity_note: "",
});

const highlightActivity = (activityId: string) => {
    setTimeout(() => {
        const element = document.getElementById(`activity-${activityId}`);
        if (!element) return;
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add(...HIGHLIGHT_CLASSES);
        setTimeout(() => element.classList.remove(...HIGHLIGHT_CLASSES), 1500);
    }, 150);
};

const locationPatch = (location: Location): ActivityPatch => ({
    location_id: location.id,
    location_name: location.name,
    lat: location.lat,
    lng: location.lng,
});

export const useItineraryBuilder = (props: BuilderScreenProp) => {
    const { currentItinerary, selectedProvinces, setStep } = props;
    const [days, setDays] = useState<Itinerary_days[]>(() => normalizeLoadedDays(currentItinerary));
    const [activeDragLoc, setActiveDragLoc] = useState<Location | null>(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    const [syncKey, setSyncKey] = useState({
        id: currentItinerary?.id,
        start: currentItinerary?.start_date,
        end: currentItinerary?.end_date,
    });
    const nextKey = { id: currentItinerary?.id, start: currentItinerary?.start_date, end: currentItinerary?.end_date };
    if (nextKey.id !== syncKey.id || nextKey.start !== syncKey.start || nextKey.end !== syncKey.end) {
        setSyncKey(nextKey);
        if (nextKey.id !== syncKey.id) {
            setDays(normalizeLoadedDays(currentItinerary));
        } else {
            setDays((prev) => resizeDays(prev, nextKey.start, nextKey.end));
        }
    }

    const updateDay = (dayId: string, updater: (day: Itinerary_days) => Itinerary_days) =>
        setDays((prev) => prev.map((day) => (day.id === dayId ? updater(day) : day)));

    const calculateTotalCost = () =>
        days.reduce(
            (total, day) => total + day.itinerary_locations.reduce((sum, loc) => sum + (Number(loc.cost) || 0), 0),
            0,
        );

    const handleUpdateActivity: UpdateActivityFn = (dayId, activityId, fieldOrPatch, value) => {
        const patch: ActivityPatch = typeof fieldOrPatch === "object" ? fieldOrPatch : { [fieldOrPatch]: value };
        updateDay(dayId, (day) => ({
            ...day,
            itinerary_locations: day.itinerary_locations.map((loc) => (loc.id === activityId ? { ...loc, ...patch } : loc)),
        }));
    };

    const appendActivity = (dayId: string, location?: Location, endTime = "") => {
        const activity = makeActivity(dayId, 0, location, DEFAULT_START_TIME, endTime);
        updateDay(dayId, (day) => {
            const next = { ...activity, start_time: nextStartTime(day.itinerary_locations) };
            return { ...day, itinerary_locations: reindex([...day.itinerary_locations, next]) };
        });
        return activity.id;
    };

    const handleAddActivity = (dayId: string) => {
        appendActivity(dayId);
    };

    const handleRemoveActivity = (dayId: string, activityId: string) => {
        updateDay(dayId, (day) => ({
            ...day,
            itinerary_locations: reindex(day.itinerary_locations.filter((loc) => loc.id !== activityId)),
        }));
    };

    const handleMoveActivity = (dayId: string, activityId: string, direction: "UP" | "DOWN") => {
        updateDay(dayId, (day) => {
            const locs = [...day.itinerary_locations];
            const index = locs.findIndex((l) => l.id === activityId);
            const target = direction === "UP" ? index - 1 : index + 1;
            if (index === -1 || target < 0 || target >= locs.length) return day;
            [locs[index], locs[target]] = [locs[target], locs[index]];
            return { ...day, itinerary_locations: reindex(locs) };
        });
    };

    const handleAddLocationToItinerary = (location: Location) => {
        if (days.length === 0) {
            toast.error("Vui lòng thiết lập ngày đi trước khi thêm địa điểm!");
            return;
        }
        for (const day of days) {
            const emptySlot = day.itinerary_locations.find((loc) => !loc.location_id);
            if (emptySlot) {
                handleUpdateActivity(day.id, emptySlot.id, locationPatch(location));
                toast.success(`Đã điền ${location.name} vào ${day.title}`);
                highlightActivity(emptySlot.id);
                return;
            }
        }
        const firstDay = days[0];
        const newId = appendActivity(firstDay.id, location);
        toast.success(`Đã thêm hoạt động mới tại ${location.name} vào ${firstDay.title}`);
        highlightActivity(newId);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragLoc((event.active.data.current?.location as Location) ?? null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragLoc(null);
        const { active, over } = event;
        if (!over) return;
        const draggedLocation = active.data.current?.location as Location | undefined;
        const dropData = over.data.current as DropData | undefined;
        if (!draggedLocation || !dropData) return;

        if (dropData.type === "existing-activity") {
            handleUpdateActivity(dropData.dayId, dropData.activityId, locationPatch(draggedLocation));
            toast.success(`Đã thêm địa điểm ${draggedLocation.name}`);
            highlightActivity(dropData.activityId);
        } else if (dropData.type === "new-activity") {
            const newId = appendActivity(dropData.dayId, draggedLocation, DEFAULT_END_TIME);
            toast.success(`Đã tạo hoạt động tại ${draggedLocation.name}`);
            highlightActivity(newId);
        }
    };

    const handleAddItinerary = async () => {
        const imageUrl = currentItinerary?.image_url || selectedProvinces[0]?.image_url || undefined;
        const payload = {
            title: currentItinerary?.title,
            theme: currentItinerary?.theme,
            summary: currentItinerary?.summary,
            start_date: currentItinerary?.start_date,
            end_date: currentItinerary?.end_date,
            nights: currentItinerary?.nights,
            days: currentItinerary?.days,
            estimated_cost: calculateTotalCost(),
            share: currentItinerary?.share ?? false,
            image_url: imageUrl,
            itinerary_days: days.length > 0 ? days : undefined,
            itinerary_provinces: selectedProvinces.map((prov) => ({ province_id: prov.id })),
        };

        const toastId = toast.loading("Đang lưu lộ trình...");
        try {
            const { response, data } = currentItinerary?.id
                ? await api.patch(`/itineraries/${currentItinerary.id}`, payload)
                : await api.post("/itineraries", payload);
            if (!response.ok) throw new Error(data.message || "Lỗi khi lưu lịch trình");
            toast.success("Lưu lộ trình thành công!", { id: toastId });
            setStep("SETUP");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu!", { id: toastId });
        }
    };

    return {
        days,
        setDays,
        calculateTotalCost,
        activeDragLoc,
        isMapModalOpen,
        setIsMapModalOpen,
        handleDragStart,
        handleDragEnd,
        handleAddItinerary,
        handleUpdateActivity,
        handleAddActivity,
        handleRemoveActivity,
        handleAddLocationToItinerary,
        handleMoveActivity,
    };
};
