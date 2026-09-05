import { BaseRepository } from './repo.js';
import { supabase } from '../config/supabaseClient.js';

class ProvinceRepository extends BaseRepository {
    constructor() {
        super('provinces');
    }

    async getAll() {
        const { data, error } = await supabase
            .from('provinces')
            .select('*, locations(id, name)')
            .order('name', { ascending: true });
        if (error) throw error;
        return data;
    }
    async getById(id) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*, locations(*)')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }
}

export const provinceRepo = new ProvinceRepository();