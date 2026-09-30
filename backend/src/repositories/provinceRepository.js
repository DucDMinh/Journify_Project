import { BaseRepository, unwrap } from './repo.js';
import { supabase } from '../config/supabaseClient.js';

class ProvinceRepository extends BaseRepository {
    constructor() {
        super('provinces');
    }

    async getAll() {
        return unwrap(
            await this.table()
                .select('*, locations(id, name)')
                .order('name', { ascending: true }),
        );
    }

    async getById(id) {
        return unwrap(await this.table().select('*, locations(*)').eq('id', id).maybeSingle());
    }

    async countLocationsByProvince() {
        const rows = unwrap(await supabase.from('locations').select('province_id'));
        const counts = new Map();
        for (const { province_id } of rows) if (province_id) counts.set(province_id, (counts.get(province_id) ?? 0) + 1);
        return counts;
    }

    async countPublicItinerariesByProvince() {
        const rows = unwrap(
            await supabase.from('itinerary_provinces').select('province_id, itineraries!inner(share)').eq('itineraries.share', true),
        );
        const counts = new Map();
        for (const { province_id } of rows) if (province_id) counts.set(province_id, (counts.get(province_id) ?? 0) + 1);
        return counts;
    }

    async getAllNames() {
        return unwrap(await this.table().select('id, name'));
    }
}

export const provinceRepo = new ProvinceRepository();
