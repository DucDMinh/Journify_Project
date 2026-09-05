import { supabase } from "../config/supabaseClient.js";

const payosRepo = () => ({
    updateOrder = async (orderId, data) => {
        const { data: updatedOrder, error } = await supabase
            .from("orders")
            .update(data)
            .eq("id", orderId)
            .select()
            .single();

        if (error) throw error;
        return updatedOrder;
    },
});

export default payosRepo;