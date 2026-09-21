import { supabase } from '../config/supabaseClient.js';

const unwrap = ({ data, error }) => {
    if (error) throw error;
    return data;
};

export class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
    }

    table() {
        return supabase.from(this.tableName);
    }

    async getAll() {
        return unwrap(await this.table().select('*').order('created_at', { ascending: false }));
    }

    async getById(id) {
        return unwrap(await this.table().select('*').eq('id', id).maybeSingle());
    }

    async create(payload) {
        return unwrap(await this.table().insert([payload]).select().single());
    }

    async update(id, payload) {
        return unwrap(await this.table().update(payload).eq('id', id).select().maybeSingle());
    }

    async delete(id) {
        return unwrap(await this.table().delete().eq('id', id).select().maybeSingle());
    }
}

export { unwrap };
