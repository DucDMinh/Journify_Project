import { BaseRepository, unwrap } from './repo.js';
import { supabase } from '../config/supabaseClient.js';

const FULL_ITINERARY_SELECT = `
    *,
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
    user_id ( id, name )
`;

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
        return unwrap(await this.table().select(FULL_ITINERARY_SELECT).eq('id', id).maybeSingle());
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
        return unwrap(await supabase.rpc('get_trending_itineraries_weekly'));
    }

    async getByUserId(userId) {
        return unwrap(
            await this.table()
                .select(FULL_ITINERARY_SELECT)
                .eq('user_id', userId)
                .order('created_at', { ascending: false }),
        );
    }
}

export const itineraryRepo = new ItineraryRepository();
