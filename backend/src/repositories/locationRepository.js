import { BaseRepository, unwrap } from './repo.js';

const AI_LOCATION_FIELDS = 'id, name, lat, lng, description';

class LocationRepository extends BaseRepository {
    constructor() {
        super('locations');
    }

    async getPaginated({ page = 1, limit = 10, search = '', provinceId = '' }) {
        const offset = (page - 1) * limit;
        let query = this.table().select('*, provinces(name)', { count: 'exact' });
        if (provinceId) query = query.eq('province_id', provinceId);
        if (search) query = query.ilike('name', `%${search}%`);

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) throw error;
        return { data, count };
    }

    async getMostSaved(limit = 5) {
        return unwrap(
            await this.table()
                .select('*, provinces(name)')
                .order('saved_count', { ascending: false })
                .limit(limit),
        );
    }

    async getByProvinceForAi(provinceId, limit = 12) {
        return unwrap(await this.table().select(AI_LOCATION_FIELDS).eq('province_id', provinceId).limit(limit));
    }

    async searchByKeywordsForAi(keywords, limit = 12) {
        const orFilter = keywords.map((kw) => `name.ilike.%${kw}%,description.ilike.%${kw}%`).join(',');
        return unwrap(await this.table().select(AI_LOCATION_FIELDS).or(orFilter).limit(limit));
    }
}

export const locationRepo = new LocationRepository();
