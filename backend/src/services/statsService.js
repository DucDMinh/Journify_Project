import { supabase } from '../config/supabaseClient.js';
import { unwrap } from '../repositories/repo.js';
import { ORDER_STATUS } from './paymentService.js';

const MAX_MONTHS = 24;
const TOP_LIMIT = 5;

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

const toVietnamTime = (date) => new Date(new Date(date).getTime() + VIETNAM_OFFSET_MS);

const formatMonth = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

const monthKey = (date) => formatMonth(toVietnamTime(date));

const lastMonths = (count) => {
    const now = toVietnamTime(Date.now());
    return Array.from({ length: count }, (_, i) =>
        formatMonth(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1 - i), 1))),
    );
};

const rows = async (query) => unwrap(await query);

const countRows = async (table) => {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count ?? 0;
};

const tally = (items, keyFn) => {
    const map = new Map();
    for (const item of items) {
        const key = keyFn(item);
        if (!key) continue;
        map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
};

export const getOverview = async ({ months = 6 } = {}) => {
    const range = Math.min(MAX_MONTHS, Math.max(1, Number(months) || 6));
    const monthKeys = lastMonths(range);
    const sinceIso = `${monthKeys[0]}-01T00:00:00.000Z`;

    const [users, itineraries, itineraryProvinces, orders, locationCount, provinceCount, blogCount, topLocations, recentOrders, recentUsers] =
        await Promise.all([
            rows(supabase.from('users').select('id, created_at, is_premium, status, role')),
            rows(supabase.from('itineraries').select('id, created_at, share, theme')),
            rows(supabase.from('itinerary_provinces').select('province_id, provinces(name)')),
            rows(supabase.from('orders').select('id, created_at, status, amount')),
            countRows('locations'),
            countRows('provinces'),
            countRows('blogs'),
            rows(supabase.from('locations').select('id, name, saved_count, img, provinces(name)').order('saved_count', { ascending: false }).limit(TOP_LIMIT)),
            rows(supabase.from('orders').select('id, created_at, status, amount, order_code, user_id(id, name, avatar)').order('created_at', { ascending: false }).limit(TOP_LIMIT)),
            rows(supabase.from('users').select('id, name, email, avatar, is_premium, created_at').order('created_at', { ascending: false }).limit(TOP_LIMIT)),
        ]);

    const paidOrders = orders.filter((o) => o.status === ORDER_STATUS.PAID);

    const monthly = monthKeys.map((month) => ({
        month,
        revenue: paidOrders.filter((o) => monthKey(o.created_at) === month).reduce((s, o) => s + Number(o.amount || 0), 0),
        paidOrders: paidOrders.filter((o) => monthKey(o.created_at) === month).length,
        newUsers: users.filter((u) => monthKey(u.created_at) === month).length,
        newItineraries: itineraries.filter((i) => monthKey(i.created_at) === month).length,
    }));
    const current = monthly.at(-1);
    const previous = monthly.at(-2) ?? { revenue: 0, paidOrders: 0, newUsers: 0, newItineraries: 0 };

    const provinceNames = new Map(itineraryProvinces.map((ip) => [ip.province_id, ip.provinces?.name]));
    const topProvinces = [...tally(itineraryProvinces, (ip) => ip.province_id).entries()]
        .map(([id, count]) => ({ id, name: provinceNames.get(id) ?? 'Không rõ', itineraries: count }))
        .sort((a, b) => b.itineraries - a.itineraries)
        .slice(0, TOP_LIMIT);

    const themes = [...tally(itineraries, (i) => i.theme?.trim() || 'Chưa phân loại').entries()]
        .map(([theme, count]) => ({ theme, count }))
        .sort((a, b) => b.count - a.count);

    const ordersByStatus = Object.values(ORDER_STATUS).map((status) => ({
        status,
        count: orders.filter((o) => o.status === status).length,
    }));

    return {
        range: { months: range, from: sinceIso.slice(0, 10), to: toVietnamTime(Date.now()).toISOString().slice(0, 10) },
        totals: {
            users: users.length,
            activeUsers: users.filter((u) => u.status !== 'inactive').length,
            premiumUsers: users.filter((u) => u.is_premium).length,
            admins: users.filter((u) => u.role === 'ADMIN').length,
            itineraries: itineraries.length,
            publicItineraries: itineraries.filter((i) => i.share).length,
            locations: locationCount,
            provinces: provinceCount,
            blogs: blogCount,
            orders: orders.length,
            paidOrders: paidOrders.length,
            revenue: paidOrders.reduce((s, o) => s + Number(o.amount || 0), 0),
        },
        thisMonth: current,
        previousMonth: previous,
        monthly,
        ordersByStatus,
        topProvinces,
        topLocations: topLocations.map((l) => ({ id: l.id, name: l.name, province: l.provinces?.name ?? null, saved_count: l.saved_count ?? 0, img: l.img ?? null })),
        themes,
        recentOrders,
        recentUsers,
    };
};

const LEADERBOARD_LIMIT = 5;
const POINTS = { blog: 10, publicItinerary: 20, like: 2 };

export const getCommunityOverview = async () => {
    const [blogs, publicItineraries, users, hotLocations, latestItineraries] = await Promise.all([
        rows(supabase.from('blogs').select('id, user_id, likes')),
        rows(supabase.from('itineraries').select('id, user_id').eq('share', true)),
        rows(supabase.from('users').select('id, name, avatar, is_premium')),
        rows(supabase.from('locations').select('id, name, img, saved_count, provinces(name)').order('saved_count', { ascending: false }).limit(TOP_LIMIT)),
        rows(
            supabase
                .from('itineraries')
                .select('id, title, image_url, days, nights, estimated_cost, theme, created_at, user_id(id, name, avatar), itinerary_provinces(provinces(name))')
                .eq('share', true)
                .order('created_at', { ascending: false })
                .limit(TOP_LIMIT),
        ),
    ]);

    const score = new Map();
    const bump = (userId, field, amount = 1) => {
        if (!userId) return;
        const entry = score.get(userId) ?? { blogs: 0, itineraries: 0, likes: 0 };
        entry[field] += amount;
        score.set(userId, entry);
    };
    for (const b of blogs) {
        bump(b.user_id, 'blogs');
        bump(b.user_id, 'likes', Number(b.likes || 0));
    }
    for (const i of publicItineraries) bump(i.user_id, 'itineraries');

    const usersById = new Map(users.map((u) => [u.id, u]));
    const leaderboard = [...score.entries()]
        .map(([userId, s]) => ({
            user: usersById.get(userId) ?? { id: userId, name: 'Thành viên', avatar: null, is_premium: false },
            blogs: s.blogs,
            itineraries: s.itineraries,
            likes: s.likes,
            points: s.blogs * POINTS.blog + s.itineraries * POINTS.publicItinerary + s.likes * POINTS.like,
        }))
        .filter((row) => row.points > 0)
        .sort((a, b) => b.points - a.points)
        .slice(0, LEADERBOARD_LIMIT);

    return {
        totals: { members: users.length, posts: blogs.length, publicItineraries: publicItineraries.length },
        leaderboard,
        hotLocations: hotLocations.map((l) => ({ id: l.id, name: l.name, img: l.img ?? null, saved_count: l.saved_count ?? 0, province: l.provinces?.name ?? null })),
        latestItineraries,
    };
};
