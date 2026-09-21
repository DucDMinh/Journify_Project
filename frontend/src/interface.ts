import { Dispatch, SetStateAction } from "react";

export type UserRole = "ADMIN" | "USER";
export type UserStatus = "active" | "inactive";
export type BuilderStep = "BUILDER" | "SETUP";

export interface Location {
    id: string;
    name: string;
    description?: string;
    note?: string;
    province_id?: string;
    provinces?: { name: string };
    lat: number;
    lng: number;
    img: string | undefined;
    difficulty_level?: string;
    rating?: number;
    created_at?: string;
    saved_count: number;
}

export interface LocationFormData {
    name: string;
    description: string;
    note: string;
    lat: string;
    lng: string;
    province_id: string;
    difficulty_level: string;
}

export const EMPTY_LOCATION_FORM: LocationFormData = {
    name: "",
    description: "",
    note: "",
    lat: "",
    lng: "",
    province_id: "",
    difficulty_level: "",
};

interface LocationModalBaseProps {
    formData: LocationFormData;
    setFormData: Dispatch<SetStateAction<LocationFormData>>;
    mapLink: string;
    setMapLink: (link: string) => void;
    setImageFile: (file: File | null) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleExtractFromLink: () => void;
    provinces: { id: string; name: string }[];
    isSaving: boolean;
    imageFile: File | null;
}

export interface AddLocationModalProps extends LocationModalBaseProps {
    setIsAddModalOpen: (isOpen: boolean) => void;
    handleAddSubmit: (e: React.FormEvent) => Promise<void>;
}

export interface EditLocationModalProps extends LocationModalBaseProps {
    setIsEditModalOpen: Dispatch<SetStateAction<boolean>>;
    handleEditSubmit: (e: React.FormEvent) => Promise<void>;
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
    user_id: UserRef | string | null;
    created_at?: string;
}

export interface Itinerary_provinces {
    itinerary_id?: string;
    province_id?: string;
    provinces?: Province | null;
}

export interface Itinerary_days {
    id: string;
    itinerary_id?: string;
    day_number: number;
    title: string;
    create_at?: string;
    itinerary_locations: Itinerary_locations[];
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
    location_name: string;
    lat: number;
    lng: number;
    locations?: Pick<Location, "id" | "name" | "img" | "difficulty_level"> | null;
}

export interface SetupScreenProp {
    selectedProvinces: Province[];
    setSelectedProvinces: Dispatch<SetStateAction<Province[]>>;
    setLocations: Dispatch<SetStateAction<Location[]>>;
    setStep: Dispatch<SetStateAction<BuilderStep>>;
    setCurrentItinerary: Dispatch<SetStateAction<Partial<Itinerary> | undefined>>;
    step: BuilderStep;
}

export interface BuilderScreenProp {
    setStep: Dispatch<SetStateAction<BuilderStep>>;
    selectedProvinces: Province[];
    currentItinerary: Partial<Itinerary> | undefined;
    setCurrentItinerary: Dispatch<SetStateAction<Partial<Itinerary> | undefined>>;
    locations: Location[];
    setSelectedProvinces: Dispatch<SetStateAction<Province[]>>;
    setLocations: Dispatch<SetStateAction<Location[]>>;
}

export type UserRef = Pick<User, "id" | "name" | "avatar">;

export const asUserRef = (value: UserRef | string | null | undefined): UserRef | null =>
    value && typeof value === "object" ? value : null;

export interface AiItineraryResult {
    title?: string;
    theme?: string;
    summary?: string;
    estimated_cost?: number;
    itinerary_provinces?: { province_id: string | null; province_name?: string }[];
    itinerary_days?: {
        day_number?: number;
        title?: string;
        itinerary_locations?: Partial<Itinerary_locations>[];
    }[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    created_at: string;
    avatar?: string;
    itineraries: Itinerary[];
    phone_number: number;
    background_image: string;
    is_premium: boolean;
}

export interface Order {
    id: string;
    created_at: string;
    status: string;
    user_id: UserRef | null;
    amount: number;
    order_code: number;
    description: string;
    counterAccountNumber: string;
}

export interface Blog {
    id: string;
    user_id: User;
    location: string;
    created_at: string;
    content: string;
    blog_image: string;
    likes: number;
    comments: number;
    shares: number;
    is_liked: boolean;
    emotion: string;
}
