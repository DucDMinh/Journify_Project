import { BaseRepository, unwrap } from './repo.js';
import { supabase } from '../config/supabaseClient.js';

const FULL_ITINERARY_SELECT = `
    *,
    author:user_id ( id, name, avatar ),
    itinerary_days (
        id, day_number, title,
        itinerary_locations (
            id, location_id, location_name, lat, lng, sequence_order,
            start_time, end_time, cost, activity_note,
            locations ( id, name, img, difficulty_level )
        )
    ),
    itinerary_provinces (
        province_id,
        provinces ( id, name, image_url )
    )
`;

const LIST_ITINERARY_SELECT = `
    *,
    itinerary_provinces ( province_id, provinces ( id, name ) ),
    user_id ( id, name, avatar )
`;

const withOrderedChildren = (query) =>
    query
        .order('day_number', { referencedTable: 'itinerary_days', ascending: true })
        .order('sequence_order', { referencedTable: 'itinerary_days.itinerary_locations', ascending: true });

class ItineraryRepository extends BaseRepository {
    constructor() {
        super('itineraries');
    }

    async create(payload) {
        return unwrap(await supabase.rpc('create_full_itinerary', { payload }));
    }

    async update(id, payload) {
        return unwrap(await supabase.rpc('update_full_itinerary', { p_id: id, payload }));
    }

    async getById(id) {
        return unwrap(await withOrderedChildren(this.table().select(FULL_ITINERARY_SELECT).eq('id', id)).maybeSingle());
    }

    async getOwnerId(id) {
        const row = unwrap(await this.table().select('user_id').eq('id', id).maybeSingle());
        return row?.user_id ?? null;
    }

    async getAll({ publicOnly = false } = {}) {
        let query = this.table().select(LIST_ITINERARY_SELECT).order('created_at', { ascending: false });
        if (publicOnly) query = query.eq('share', true);
        return unwrap(await query);
    }

    async getTrending() {
        const trending = unwrap(await supabase.rpc('get_trending_itineraries_weekly')) ?? [];
        if (trending.length === 0) return trending;
        const links = unwrap(
            await supabase
                .from('itinerary_provinces')
                .select('itinerary_id, province_id, provinces ( id, name )')
                .in('itinerary_id', trending.map((itinerary) => itinerary.id)),
        );
        const byItinerary = Map.groupBy(links, (link) => link.itinerary_id);
        return trending.map((itinerary) => ({
            ...itinerary,
            itinerary_provinces: (byItinerary.get(itinerary.id) ?? []).map(({ province_id, provinces }) => ({ province_id, provinces })),
        }));
    }

    async getByUserId(userId) {
        return unwrap(
            await withOrderedChildren(
                this.table()
                    .select(FULL_ITINERARY_SELECT)
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),
            ),
        );
    }
}

export const itineraryRepo = new ItineraryRepository();
