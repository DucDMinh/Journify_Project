import { BaseRepository, unwrap } from './repo.js';

class OrderRepository extends BaseRepository {
    constructor() {
        super('orders');
    }

    async getAll() {
        return unwrap(
            await this.table()
                .select('*, user_id(id, name)')
                .order('created_at', { ascending: false }),
        );
    }

    async getByOrderCode(orderCode) {
        return unwrap(await this.table().select('*').eq('order_code', orderCode).maybeSingle());
    }

    async markPaid(id, details) {
        return unwrap(
            await this.table()
                .update({ status: 'PAID', ...details })
                .eq('id', id)
                .eq('status', 'PENDING')
                .select()
                .maybeSingle(),
        );
    }
}

export const orderRepo = new OrderRepository();
