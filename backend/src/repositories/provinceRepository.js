import { BaseRepository, unwrap } from './repo.js';

class ProvinceRepository extends BaseRepository {
    constructor() {
        super('provinces');
    }

    async getAll() {
        return unwrap(
            await this.table()
                .select('*, locations(id, name)')
                .order('name', { ascending: true }),
        );
    }

    async getById(id) {
        return unwrap(await this.table().select('*, locations(*)').eq('id', id).maybeSingle());
    }

    async findByName(name) {
        return unwrap(await this.table().select('id, name').ilike('name', `%${name}%`).limit(1).maybeSingle());
    }
}

export const provinceRepo = new ProvinceRepository();
