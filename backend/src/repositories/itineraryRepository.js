import { BaseRepository } from "./repo.js";
import { supabase } from "../config/supabaseClient.js";

class ItineraryRepository extends BaseRepository {
    constructor() {
        super('itineraries');
    }
    create = async (payload) => {
        const { data, error } = await supabase.rpc('create_full_itinerary', {
            payload: payload
        });

        if (error) {
            console.error("Lỗi khi tạo Itinerary qua RPC:", error);
            throw error;
        }

        return data;
    }
    update = async (id, payload) => {
        const { data, error } = await supabase.rpc('update_full_itinerary', {
            p_id: id,
            payload: payload
        });

        if (error) {
            console.error("Lỗi khi cập nhật Itinerary qua RPC:", error);
            throw error;
        }

        return data;
    }

    getById = async (id) => {
        const { data, error } = await supabase
            .from('itineraries')
            .select(`
    *, 
    itinerary_days (
        id, 
        day_number, 
        title,
        itinerary_locations (
            id, 
            location_id,      
            location_name,    
            lat,              
            lng,              
            sequence_order, 
            start_time, 
            end_time, 
            cost, 
            activity_note,
            locations (
                id, 
                name, 
                img, 
                difficulty_level
            )
        )
    ), 
    itinerary_provinces (
        province_id,
        provinces (
            id,
            name,
            image_url
        )
    )
`)
            .eq('id', id)
            .single();

        if (error) {
            console.error("Lỗi khi lấy Itinerary:", error);
            throw error;
        }

        return { data };
    }
    getAll = async (is_public) => {
        let query = supabase
            .from('itineraries')
            .select(`
                *,
                itinerary_provinces (
                    province_id,
                    provinces (
                        id,
                        name
                    )
                ),
                user_id (
                    id,
                    name
                )
            `)
            .order('created_at', { ascending: false });
        if (is_public === 'true') {
            query = query.eq('share', true);
        }
        const { data, error } = await query;
        return { data, error };
    }
    getTrending = async () => {
        const { data, error } = await supabase.rpc('get_trending_itineraries_weekly');
        return { data, error };
    }
    getItinerariesByUserId = async (userId) => {
        const { data, error } = await supabase
            .from('itineraries')
            .select(`
    *, 
    itinerary_days (
        id, 
        day_number, 
        title,
        itinerary_locations (
            id, 
            location_id,      
            location_name,    
            lat,              
            lng,              
            sequence_order, 
            start_time, 
            end_time, 
            cost, 
            activity_note,
            locations (
                id, 
                name, 
                img, 
                difficulty_level
            )
        )
    ), 
    itinerary_provinces (
        province_id,
        provinces (
            id,
            name,
            image_url
        )
    )
`)
            .eq('user_id', userId);
        return { data, error };
    }
}

export const itineraryRepo = new ItineraryRepository();