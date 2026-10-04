import { BaseRepository, unwrap } from './repo.js';

const AI_LOCATION_FIELDS = 'id, name, lat, lng, description, difficulty_level, rating, saved_count, province_id, provinces(name)';
const AI_MAX_LOCATIONS = 300;

class LocationRepository extends BaseRepository {
    constructor() {
        super('locations');
    }

    filtered(columns, options, { search = '', provinceId = '' }) {
        let query = this.table().select(columns, options);
        if (provinceId) query = query.eq('province_id', provinceId);
        if (search) query = query.ilike('name', `%${search.replace(/[\\%_*]/g, (char) => `\\${char}`)}%`);
        return query;
    }

    async getPaginated({ page = 1, limit = 10, search = '', provinceId = '' }) {
        const offset = (page - 1) * limit;
        const { data, count, error } = await this.filtered('*, provinces(name)', { count: 'exact' }, { search, provinceId })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error?.code === 'PGRST103') {
            const total = await this.filtered('id', { count: 'exact', head: true }, { search, provinceId });
            if (total.error) throw total.error;
            return { data: [], count: total.count ?? 0 };
        }
        if (error) throw error;
        return { data, count: count ?? 0 };
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
        const perProvince = Math.ceil(AI_MAX_LOCATIONS / provinceIds.length);
        const lists = await Promise.all(
            provinceIds.map(async (provinceId) =>
                unwrap(
                    await this.table()
                        .select(AI_LOCATION_FIELDS)
                        .eq('province_id', provinceId)
                        .order('saved_count', { ascending: false })
                        .order('rating', { ascending: false, nullsFirst: false })
                        .limit(perProvince),
                ),
            ),
        );
        return lists.flat();
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
