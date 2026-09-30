import { BaseRepository, unwrap } from './repo.js';

const AI_LOCATION_FIELDS = 'id, name, lat, lng, description, difficulty_level, rating, saved_count, province_id, provinces(name)';
const AI_MAX_LOCATIONS = 300;

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

    async getByProvincesForAi(provinceIds) {
        if (!provinceIds.length) return [];
        return unwrap(await this.table().select(AI_LOCATION_FIELDS).in('province_id', provinceIds).limit(AI_MAX_LOCATIONS));
    }

    async searchByKeywordsForAi(keywords, limit = 30) {
        // Bỏ ký tự đặc biệt của cú pháp filter PostgREST (dấu phẩy, ngoặc, %) trong từ khóa do LLM sinh ra
        const safe = keywords.map((kw) => String(kw).replace(/[,()%*\\]/g, ' ').trim()).filter((kw) => kw.length >= 2);
        if (!safe.length) return [];
        const orFilter = safe.map((kw) => `name.ilike.%${kw}%,description.ilike.%${kw}%`).join(',');
        return unwrap(await this.table().select(AI_LOCATION_FIELDS).or(orFilter).limit(limit));
    }
}

export const locationRepo = new LocationRepository();
