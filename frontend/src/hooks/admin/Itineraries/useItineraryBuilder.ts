
import { BuilderScreenProp, Itinerary_days, Itinerary_locations } from "@/interface";
import { useState } from "react";
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import React from "react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/hooks/auth/AuthContext";

export const useItineraryBuilder = (props: BuilderScreenProp) => {
    const { currentItinerary, selectedProvinces, setStep } = props;
    const [days, setDays] = useState<Itinerary_days[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [activeDragLoc, setActiveDragLoc] = useState<any>(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const calculateTotalCost = () => {
        return days.reduce((total, day) => {
            const dayCost = day.itinerary_locations?.reduce((sum, loc) => sum + (Number(loc.cost) || 0), 0) || 0;
            return total + dayCost;
        }, 0);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragLoc(active.data.current?.location);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUpdateActivity = (dayId: string, activityId: string, field: string | object, value?: any) => {
        setDays(prevDays => prevDays.map(day => {
            if (day.id === dayId) {
                return {
                    ...day,
                    itinerary_locations: day.itinerary_locations.map((loc: Itinerary_locations) => {
                        if (loc.id === activityId) {
                            if (typeof field === 'object' && field !== null) {
                                return { ...loc, ...field };
                            }
                            return { ...loc, [field as string]: value };
                        }
                        return loc;
                    })
                };
            }
            return day;
        }));
    };
    const isDataLoaded = React.useRef(false);
    React.useEffect(() => {
        if (currentItinerary) console.log(currentItinerary)
        if (currentItinerary?.itinerary_days && !isDataLoaded.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedDays = currentItinerary.itinerary_days.map((day: any) => {
                const rawLocations = day.itinerary_locations || [];

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedLocations = rawLocations.map((loc: any) => {
                    if (loc.locations) {
                        return {
                            ...loc,
                            location_id: loc.locations.id,
                            location_name: loc.locations.name,
                            lat: Number(loc.lat || loc.locations?.lat || 0),
                            lng: Number(loc.lng || loc.locations?.lng || 0)
                        };
                    }
                    return loc;
                });

                return {
                    ...day,
                    itinerary_locations: formattedLocations
                };
            });

            setTimeout(() => {
                setDays(formattedDays);
            }, 0);

            isDataLoaded.current = true;
            return;
        }
        if (currentItinerary?.start_date && currentItinerary.end_date) {
            const start = new Date(currentItinerary.start_date);
            const end = new Date(currentItinerary.end_date);

            if (end >= start) {
                const diffTime = end.getTime() - start.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                setTimeout(() => {
                    setDays(prevDays => {
                        const newDays = [...prevDays];
                        if (newDays.length < diffDays) {
                            for (let i = newDays.length + 1; i <= diffDays; i++) {
                                newDays.push({
                                    id: uuidv4(),
                                    day_number: i,
                                    title: `Ngày ${i}`,
                                    itinerary_locations: []
                                });
                            }
                            return newDays;
                        }
                        else if (newDays.length > diffDays) {
                            return newDays.slice(0, diffDays);
                        }
                        return prevDays;
                    });
                }, 0);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentItinerary?.start_date, currentItinerary?.end_date, currentItinerary?.itinerary_days]);
    const scrollToActivity = (activityId: string) => {
        setTimeout(() => {
            const element = document.getElementById(`activity-${activityId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-4', 'ring-brand-500', 'border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20');
                setTimeout(() => {
                    element.classList.remove('ring-4', 'ring-brand-500', 'border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20');
                }, 1500);
            }
        }, 150);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAddLocationToItinerary = (location: any) => {
        if (days.length === 0) {
            toast.error("Vui lòng thiết lập ngày đi trước khi thêm địa điểm!");
            return;
        }

        let targetDayId: string | null = null;
        let targetActivityId: string | null = null;
        let targetDayTitle = "";
        for (const day of days) {
            const emptySlot = day.itinerary_locations?.find(
                (loc: Itinerary_locations) => !loc.location_id
            );
            if (emptySlot) {
                targetDayId = day.id;
                targetActivityId = emptySlot.id;
                targetDayTitle = day.title;
                break;
            }
        }

        let elementIdToScroll = "";
        if (targetDayId && targetActivityId) {
            setDays(prevDays => prevDays.map(day => {
                if (day.id === targetDayId) {
                    return {
                        ...day,
                        itinerary_locations: day.itinerary_locations.map((loc: Itinerary_locations) => {
                            if (loc.id === targetActivityId) {
                                return { ...loc, location_id: location.id, location_name: location.name, lat: location.lat, lng: location.lng };
                            }
                            return loc;
                        })
                    };
                }
                return day;
            }));
            elementIdToScroll = `activity-${targetActivityId}`;
            toast.success(`Đã điền ${location.name} vào ${targetDayTitle}`);
        } else {
            const firstDay = days[0];
            const newActivityId = uuidv4();

            setDays(prevDays => prevDays.map(day => {
                if (day.id === firstDay.id) {
                    const currentLocations = day.itinerary_locations || [];
                    let nextStartTime = "08:00";
                    if (currentLocations.length > 0) {
                        const lastActivity = currentLocations[currentLocations.length - 1];
                        if (lastActivity.end_time) nextStartTime = lastActivity.end_time;
                    }

                    const newActivity: Itinerary_locations = {
                        id: newActivityId,
                        day_id: day.id,
                        location_id: location.id,
                        location_name: location.name,
                        lat: location.lat,
                        lng: location.lng,
                        start_time: nextStartTime,
                        end_time: "",
                        cost: 0,
                        sequence_order: currentLocations.length + 1,
                        activity_note: "",
                    };
                    return { ...day, itinerary_locations: [...currentLocations, newActivity] };
                }
                return day;
            }));
            elementIdToScroll = `activity-${newActivityId}`;
            toast.success(`Đã thêm hoạt động mới tại ${location.name} vào ${firstDay.title}`);
        }
        if (elementIdToScroll) {
            setTimeout(() => {
                const element = document.getElementById(elementIdToScroll);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-4', 'ring-brand-500', 'border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20');
                    setTimeout(() => {
                        element.classList.remove('ring-4', 'ring-brand-500', 'border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20');
                    }, 1500);
                }
            }, 150);
        }
    };
    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragLoc(null);
        const { active, over } = event;

        if (!over) return;

        const draggedLocation = active.data.current?.location;
        const dropData = over.data.current;

        if (dropData?.type === 'existing-activity') {
            handleUpdateActivity(dropData.dayId, dropData.activityId, {
                location_id: draggedLocation.id,
                location_name: draggedLocation.name,
                lat: draggedLocation.lat,
                lng: draggedLocation.lng
            });
            toast.success(`Đã thêm địa điểm ${draggedLocation.name}`);
            scrollToActivity(dropData.activityId);

        } else if (dropData?.type === 'new-activity') {
            const newActivityId = uuidv4();

            setDays(prevDays => prevDays.map(day => {
                if (day.id === dropData.dayId) {
                    const newActivity: Itinerary_locations = {
                        id: newActivityId,
                        day_id: day.id,
                        location_id: draggedLocation.id,
                        location_name: draggedLocation.name,
                        start_time: "08:00",
                        end_time: "10:00",
                        cost: 0,
                        sequence_order: (day.itinerary_locations?.length || 0) + 1,
                        activity_note: "",
                        lat: draggedLocation.lat,
                        lng: draggedLocation.lng
                    };

                    return { ...day, itinerary_locations: [...(day.itinerary_locations || []), newActivity] };
                }
                return day;
            }));

            toast.success(`Đã tạo hoạt động tại ${draggedLocation.name}`);
            scrollToActivity(newActivityId);
        }
    };
    const handleAddActivity = (dayId: string) => {
        setDays(prevDays => prevDays.map(day => {
            if (day.id === dayId) {
                const currentLocations = day.itinerary_locations || [];

                let nextStartTime = "08:00";

                if (currentLocations.length > 0) {
                    const lastActivity = currentLocations[currentLocations.length - 1];
                    if (lastActivity.end_time) {
                        nextStartTime = lastActivity.end_time;
                    }
                }

                const newActivity: Itinerary_locations = {
                    id: uuidv4(),
                    day_id: day.id,
                    location_id: "",
                    sequence_order: currentLocations.length + 1,
                    activity_note: "",
                    cost: 0,
                    start_time: nextStartTime,
                    end_time: "",
                    location_name: "",
                    lat: 0,
                    lng: 0
                };

                return {
                    ...day,
                    itinerary_locations: [...currentLocations, newActivity]
                };
            }
            return day;
        }));
    };
    const handleRemoveActivity = (dayId: string, activityId: string) => {
        setDays(prevDays => prevDays.map(day => {
            if (day.id === dayId) {
                const filteredLocations = (day.itinerary_locations || []).filter((loc: Itinerary_locations) => loc.id !== activityId);
                const reindexedLocations = filteredLocations.map((loc, index) => ({
                    ...loc,
                    sequence_order: index + 1
                }));

                return {
                    ...day,
                    itinerary_locations: reindexedLocations
                };
            }
            return day;
        }));
    };

    const handleMoveActivity = (dayId: string, activityId: string, direction: 'UP' | 'DOWN') => {
        setDays(prevDays => prevDays.map(day => {
            if (day.id === dayId) {
                const locs = [...(day.itinerary_locations || [])];
                const index = locs.findIndex(l => l.id === activityId);
                if (index === -1) return day;
                if (direction === 'UP' && index > 0) {
                    [locs[index - 1], locs[index]] = [locs[index], locs[index - 1]];
                } else if (direction === 'DOWN' && index < locs.length - 1) {
                    [locs[index + 1], locs[index]] = [locs[index], locs[index + 1]];
                } else {
                    return day;
                }
                const reindexedLocations = locs.map((loc, idx) => ({
                    ...loc,
                    sequence_order: idx + 1
                }));

                return { ...day, itinerary_locations: reindexedLocations };
            }
            return day;
        }));
    };

    const { user } = useAuth();

    const handleAddItinerary = async () => {

        const submitData = new FormData();
        if (currentItinerary?.title) submitData.append('title', currentItinerary.title);
        if (currentItinerary?.theme) submitData.append('theme', currentItinerary.theme);
        if (currentItinerary?.summary) submitData.append('summary', currentItinerary.summary);
        if (currentItinerary?.start_date) submitData.append('start_date', currentItinerary.start_date);
        if (currentItinerary?.nights) submitData.append('nights', String(currentItinerary.nights));
        if (currentItinerary?.days) submitData.append('days', String(currentItinerary.days));
        submitData.append('estimated_cost', String(calculateTotalCost()));
        if (currentItinerary?.end_date) submitData.append('end_date', currentItinerary.end_date);
        submitData.append('share', String(currentItinerary?.share ?? false));
        if (days && days.length > 0) {
            submitData.append('itinerary_days', JSON.stringify(days));
        }
        let finalImageUrl = currentItinerary?.image_url;
        if (!finalImageUrl && selectedProvinces && selectedProvinces.length > 0) {
            finalImageUrl = selectedProvinces[0].image_url;
        }
        if (finalImageUrl) {
            submitData.append('image_url', finalImageUrl);
        }
        if (selectedProvinces && selectedProvinces.length > 0) {
            const mappedProvinces = selectedProvinces.map(prov => ({
                province_id: prov.id
            }));
            submitData.append('itinerary_provinces', JSON.stringify(mappedProvinces));
        }
        if (user?.id) {
            submitData.append('user_id', user.id);
        }
        const toastId = toast.loading("Đang lưu lộ trình...");
        try {
            let response, data;
            if (currentItinerary?.id) {
                ({ response, data } = await api.patch(`/itineraries/${currentItinerary.id}`, submitData));
            }
            else {
                ({ response, data } = await api.post("/itineraries", submitData));
            }
            if (!response.ok) throw new Error(data.message || "Lỗi khi lưu lịch trình");
            toast.success("Lưu lộ trình thành công!", { id: toastId });

            setStep("SETUP");

        } catch (error) {
            console.error("Lỗi:", error);
            toast.error("Có lỗi xảy ra khi lưu!", { id: toastId });
        }
    }
    return {
        days,
        setDays,
        calculateTotalCost,
        activeDragLoc,
        isMapModalOpen,
        handleDragStart,
        handleDragEnd,
        handleAddItinerary,
        setIsMapModalOpen,
        handleUpdateActivity,
        handleAddActivity,
        handleRemoveActivity,
        handleAddLocationToItinerary,
        handleMoveActivity
    };
};