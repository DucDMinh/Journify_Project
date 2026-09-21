import { BaseRepository, unwrap } from './repo.js';

const stripSecret = (user) => {
    if (!user) return user;
    const { password_hash, ...safe } = user;
    return safe;
};

class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    async getAll() {
        const rows = unwrap(
            await this.table()
                .select('*, itineraries(id, title, theme)')
                .order('created_at', { ascending: true }),
        );
        return rows.map(stripSecret);
    }

    async getById(id) {
        return stripSecret(unwrap(await this.table().select('*, itineraries(*)').eq('id', id).maybeSingle()));
    }

    async getByIdWithSecret(id) {
        return unwrap(await this.table().select('*').eq('id', id).maybeSingle());
    }

    async getByEmailWithSecret(email) {
        return unwrap(await this.table().select('*').eq('email', email).maybeSingle());
    }

    async existsByEmail(email) {
        const row = unwrap(await this.table().select('id').eq('email', email).maybeSingle());
        return Boolean(row);
    }

    async create(payload) {
        return stripSecret(await super.create(payload));
    }

    async update(id, payload) {
        return stripSecret(await super.update(id, payload));
    }

    async delete(id) {
        return stripSecret(await super.delete(id));
    }

    async setPremium(id, isPremium) {
        return unwrap(await this.table().update({ is_premium: isPremium }).eq('id', id).select('id').maybeSingle());
    }
}

export const userRepo = new UserRepository();
