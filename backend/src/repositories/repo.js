import { supabase } from '../config/supabaseClient.js';

export class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
    }

    async getAll() {
        const { data, error } = await supabase.from(this.tableName).select('*').order('id', { ascending: false });
        if (error) throw error;
        return data;
    }

    async getById(id) {
        const { data, error } = await supabase.from(this.tableName).select('*').eq('id', id);
        if (error) throw error;
        return data.length > 0 ? data[0] : null;
    }

    async create(payload) {
        const { data, error } = await supabase.from(this.tableName).insert([payload]).select();
        if (error) throw error;
        return data[0];
    }

    async update(id, payload) {
        const { data, error } = await supabase.from(this.tableName).update(payload).eq('id', id).select();
        if (error) throw error;
        return data.length > 0 ? data[0] : null;
    }

    async delete(id) {
        const { data, error } = await supabase.from(this.tableName).delete().eq('id', id).select();
        if (error) throw error;
        return data.length > 0 ? data[0] : null;
    }
}