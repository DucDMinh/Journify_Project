import { getOverview, getCommunityOverview } from '../services/statsService.js';
import { ok } from '../helpers/response.js';

export const overview = async (ctx) => {
    ok(ctx, await getOverview({ months: ctx.query.months }));
};

export const community = async (ctx) => {
    ok(ctx, await getCommunityOverview());
};
