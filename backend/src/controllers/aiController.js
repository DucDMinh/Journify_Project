import { generateItinerary as generateItineraryService } from '../services/aiService.js';
import { ok } from '../helpers/response.js';

export const generateItinerary = async (ctx) => {
    const { prompt, days_count: daysCount } = ctx.request.body ?? {};
    const itinerary = await generateItineraryService({ prompt, daysCount });
    ok(ctx, itinerary, 'Tạo lịch trình AI thành công');
};
