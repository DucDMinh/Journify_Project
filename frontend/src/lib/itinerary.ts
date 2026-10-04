import { api } from "@/lib/apiClient";
import { asUserRef, Itinerary, UserRef } from "@/interface";

export const ITINERARY_THEMES = [
    "Khám phá",
    "Nghỉ dưỡng",
    "Ẩm thực",
    "Văn hóa - Lịch sử",
    "Trekking & Khám phá",
    "Biển đảo",
    "Chữa lành",
] as const;

export const themeOptions = (current?: string | null) =>
    current && !ITINERARY_THEMES.includes(current as (typeof ITINERARY_THEMES)[number]) ? [current, ...ITINERARY_THEMES] : [...ITINERARY_THEMES];

export const itineraryAuthor = (itinerary: Pick<Itinerary, "author" | "user_id" | "author_name" | "author_avatar">): UserRef | null => {
    if (itinerary.author) return itinerary.author;
    const ref = asUserRef(itinerary.user_id);
    if (ref) return ref;
    return itinerary.author_name ? { id: "", name: itinerary.author_name, avatar: itinerary.author_avatar ?? undefined } : null;
};

export const provinceNames = (itinerary: Pick<Itinerary, "itinerary_provinces">) =>
    (itinerary.itinerary_provinces ?? []).map((p) => p.provinces?.name).filter((name): name is string => Boolean(name));

export const toItineraryPayload = (itinerary: Itinerary) => ({
    title: itinerary.title,
    summary: itinerary.summary,
    theme: itinerary.theme,
    start_date: itinerary.start_date,
    end_date: itinerary.end_date,
    days: itinerary.days,
    nights: itinerary.nights,
    estimated_cost: itinerary.estimated_cost,
    image_url: itinerary.image_url,
    share: itinerary.share ?? false,
    itinerary_provinces: (itinerary.itinerary_provinces ?? [])
        .map((p) => ({ province_id: p.province_id ?? p.provinces?.id }))
        .filter((p) => p.province_id),
    itinerary_days: (itinerary.itinerary_days ?? []).map((day) => ({
        day_number: day.day_number,
        title: day.title,
        itinerary_locations: (day.itinerary_locations ?? []).map((loc) => ({
            location_id: loc.location_id || null,
            location_name: loc.location_name,
            lat: loc.lat,
            lng: loc.lng,
            sequence_order: loc.sequence_order,
            start_time: loc.start_time,
            end_time: loc.end_time,
            cost: loc.cost,
            activity_note: loc.activity_note,
        })),
    })),
});

type SaveResult = { ok: true; id: string | null; title: string } | { ok: false; message: string };

const createdId = (data: unknown) => {
    const value = data as { itinerary_id?: string; id?: string } | null;
    return value?.itinerary_id ?? value?.id ?? null;
};

export const saveItineraryCopy = async (itinerary: Itinerary, overrides: Partial<ReturnType<typeof toItineraryPayload>> & { cloned_from_id?: string | null } = {}): Promise<SaveResult> => {
    const payload = { ...toItineraryPayload(itinerary), share: false, ...overrides };
    const { response, data } = await api.post("/itineraries", payload);
    if (!response.ok) return { ok: false, message: data.message || "Không lưu được lộ trình" };
    return { ok: true, id: createdId(data.data), title: payload.title };
};

export const cloneItinerary = async (itineraryId: string): Promise<SaveResult> => {
    const { response, data } = await api.get<Itinerary>(`/itineraries/${itineraryId}`);
    if (!response.ok || !data.data) return { ok: false, message: data.message || "Không tải được lộ trình" };
    const original = data.data;
    return saveItineraryCopy(original, { title: `Bản sao - ${original.title}`, cloned_from_id: original.id });
};

export const itineraryShareUrl = (id: string) => `${window.location.origin}/itineraries?trip=${id}`;
