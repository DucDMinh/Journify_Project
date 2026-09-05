import { BaseRepository } from "./repo.js";
import { supabase } from "../config/supabaseClient.js";

class OrderRepository extends BaseRepository {
    constructor() {
        super('orders');
    }
    async getAll() {
        const { data, error } = await supabase
            .from('orders')
            .select('*, user_id(id, name)')
            .order('created_at', { ascending: false });
        if (error) throw new Error(error)
        return data
    }
}
export const orderRepo = new OrderRepository();