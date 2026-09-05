import { BaseRepository } from './repo.js';
import { supabase } from '../config/supabaseClient.js';

class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    async getAll() {
        const { data, error } = await supabase
            .from('users')
            .select('*, itineraries(id, title, theme)')
            .order('created_at', { ascending: true });
        if (error) throw error;
        return { data };
    }
    async getById(id) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*, itineraries(*)')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }
    async checkExistEmail(email) {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();
        if (error) {
            console.error("Lỗi khi kiểm tra email tồn tại:", error.message);
            return false;
        }

        return !!data;
    }
}

export const userRepo = new UserRepository();