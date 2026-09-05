/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch, SetStateAction } from "react";

export interface Location {
    id: string;
    name: string;
    description?: string;
    note?: string;
    province_id?: string;
    provinces?: {
        name: string;
    };
    lat: number;
    lng: number;
    img: string | undefined;
    difficulty_level?: string;
    rating?: number;
    created_at?: string;
    saved_count: number | 0
}
export interface AddLocationModalProps {
    setIsAddModalOpen: (isOpen: boolean) => void;
    formData: {
        name: string;
        description: string;
        note: string;
        lat: string;
        lng: string;
        province_id: string;
        difficulty_level: string;
    };
    setFormData: React.Dispatch<
        React.SetStateAction<{
            name: string;
            description: string;
            note: string;
            lat: string;
            lng: string;
            province_id: string;
            difficulty_level: string;
        }>
    >;
    mapLink: string;
    setMapLink: (link: string) => void;
    setImageFile: (file: File | null) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleExtractFromLink: () => void;
    handleAddSubmit: (e: React.FormEvent) => Promise<void>;
    provinces: { id: string; name: string }[];
    isSaving: boolean;
    imageFile: File | null;
}

export interface EditLocationModalProps {
    setIsEditModalOpen: Dispatch<SetStateAction<boolean>>;
    formData: {
        name: string;
        description: string;
        note: string;
        lat: string;
        lng: string;
        province_id: string;
        difficulty_level: string;
    };
    setFormData: React.Dispatch<
        React.SetStateAction<{
            name: string;
            description: string;
            note: string;
            lat: string;
            lng: string;
            province_id: string;
            difficulty_level: string;
        }>
    >;
    mapLink: string;
    setMapLink: (link: string) => void;
    setImageFile: (file: File | null) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleExtractFromLink: () => void;
    handleEditSubmit: (e: React.FormEvent) => Promise<void>;
    provinces: { id: string; name: string }[];
    isSaving: boolean;
    imageFile: File | null;
    pickLocation?: Location;
}

export interface Province {
    id: string;
    name: string;
    description?: string;
    best_time_to_visit?: string;
    height?: string;
    locations?: { id: string; name: string }[];
    image_url?: string | null;
}

export interface Itinerary {
    id: string;
    title: string;
    summary: string;
    start_date: string;
    end_date: string;
    theme: string;
    days?: number;
    nights?: number;
    estimated_cost: number;
    image_url?: string | null;
    itinerary_days: Itinerary_days[] | null;
    share?: boolean;
    itinerary_provinces: Itinerary_provinces[] | null;
    user_id: User | null;
}

export interface Itinerary_provinces {
    itinerary_id?: string;
    province_id?: string;
    provinces?: Province | null;
}

export interface SetupScreenProp {
    selectedProvinces: Province[],
    setSelectedProvinces: Dispatch<SetStateAction<Province[]>>,
    setLocations: Dispatch<SetStateAction<Location[]>>,
    setStep: Dispatch<SetStateAction<"BUILDER" | "SETUP">>,
    setCurrentItinerary: Dispatch<SetStateAction<Partial<Itinerary> | undefined>>,
    step: "BUILDER" | "SETUP"
}

export interface BuilderScreenProp {
    setStep: Dispatch<SetStateAction<"BUILDER" | "SETUP">>,
    selectedProvinces: Province[],
    currentItinerary: Partial<Itinerary> | undefined,
    setCurrentItinerary: Dispatch<SetStateAction<Partial<Itinerary> | undefined>>,
    locations: Location[],
    setSelectedProvinces: Dispatch<SetStateAction<Province[]>>,
    setLocations: Dispatch<SetStateAction<Location[]>>
}

export interface Itinerary_days {
    id: string;
    itinerary_id?: string;
    day_number: number;
    title: string;
    create_at?: string;
    itinerary_locations: Itinerary_locations[]
}

export interface Itinerary_locations {
    id: string;
    day_id: string;
    location_id: string | null;
    sequence_order: number;
    activity_note: string;
    cost: number;
    start_time: string;
    end_time: string;
    location_name: string,
    lat: number;
    lng: number;
}
export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: "active" | "inactive";
    created_at: string;
    avatar?: string;
    itineraries: Itinerary[];
    phone_number: number;
    background_image: string;
    is_premium: boolean | false;
}

export interface Order {
    id: string;
    created_at: string;
    status: string;
    user_id: string | { id: string; name: string; avatar?: string } | any;
    amount: number;
    order_code: number,
    description: string;
    counterAccountNumber: string;
}
export type UserRole = "ADMIN" | "USER";

export interface Blog {
    id: string,
    user_id: User,
    location: string,
    created_at: string,
    content: string,
    blog_image: string,
    likes: number,
    comments: number,
    shares: number,
    is_liked: boolean | false,
    emotion: string,
}