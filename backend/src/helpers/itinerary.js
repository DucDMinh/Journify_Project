import { pick } from './object.js';

const SCALAR_FIELDS = [
    'title', 'theme', 'summary', 'start_date', 'end_date', 'days', 'nights',
    'estimated_cost', 'image_url', 'share', 'cloned_from_id',
];

const ACTIVITY_FIELDS = [
    'location_id', 'location_name', 'lat', 'lng', 'sequence_order',
    'start_time', 'end_time', 'cost', 'activity_note',
];

const byNumber = (field) => (a, b) => (Number(a?.[field]) || 0) - (Number(b?.[field]) || 0);

export const toFullPayload = (itinerary) => ({
    ...pick(itinerary, SCALAR_FIELDS),
    itinerary_provinces: (itinerary?.itinerary_provinces ?? []).map(({ province_id }) => ({ province_id })),
    itinerary_days: [...(itinerary?.itinerary_days ?? [])].sort(byNumber('day_number')).map((day) => ({
        day_number: day.day_number,
        title: day.title,
        itinerary_locations: [...(day.itinerary_locations ?? [])]
            .sort(byNumber('sequence_order'))
            .map((activity) => pick(activity, ACTIVITY_FIELDS)),
    })),
});

export const mergeItineraryUpdate = (existing, changes) => ({ ...toFullPayload(existing), ...changes });
