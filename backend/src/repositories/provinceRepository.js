import { BaseRepository, unwrap } from './repo.js';
import { supabase } from '../config/supabaseClient.js';

const PAGE_SIZE = 1000;

const fetchAllRows = async (buildQuery) => {
    const rows = [];
    for (let from = 0; ; from += PAGE_SIZE) {
        const page = unwrap(await buildQuery().range(from, from + PAGE_SIZE - 1));
        rows.push(...page);
        if (page.length < PAGE_SIZE) return rows;
    }
};

const countBy = (rows) => {
    const counts = new Map();
    for (const { province_id } of rows) if (province_id) counts.set(province_id, (counts.get(province_id) ?? 0) + 1);
    return counts;
};

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
        return countBy(await fetchAllRows(() => supabase.from('locations').select('province_id').order('id')));
    }

    async countPublicItinerariesByProvince() {
        return countBy(
            await fetchAllRows(() =>
                supabase
                    .from('itinerary_provinces')
                    .select('province_id, itineraries!inner(share)')
                    .eq('itineraries.share', true)
                    .order('itinerary_id')
                    .order('province_id'),
            ),
        );
    }

    async getAllNames() {
        return unwrap(await this.table().select('id, name'));
    }
}

export const provinceRepo = new ProvinceRepository();
