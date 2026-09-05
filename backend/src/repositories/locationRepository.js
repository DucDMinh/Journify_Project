import { BaseRepository } from './repo.js';
import { supabase } from '../config/supabaseClient.js';

class LocationRepository extends BaseRepository {
    constructor() {
        super('locations');
    }

    async getAll(page = 1, limit = 10, search = '', province_id = '') {
        const offset = (page - 1) * limit;
        let query = supabase
            .from(this.tableName)
            .select('*, provinces(name)', { count: 'exact' });
        if (province_id) {
            query = query.eq('province_id', province_id);
        }
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        const { data, count, error } = await query;

        if (error) throw error;

        return { data, count };
    }
    async getFavor(limit) {
        let query = supabase
            .from('locations')
            .select('*, provinces(name)')
            .order('saved_count', { ascending: false });
        const limitNumber = limit ? parseInt(limit) : 5;
        query = query.limit(limitNumber);
        const { data, error } = await query;
        if (error) throw error;
        return { data };
    }
}

export const locationRepo = new LocationRepository();