import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeItineraryUpdate, toFullPayload } from './itinerary.js';

const existing = {
    id: 'it-1',
    user_id: 'u-1',
    title: 'Đà Lạt 3 ngày',
    theme: 'Nghỉ dưỡng',
    summary: 'Chuyến đi thư giãn',
    start_date: '2026-12-01',
    end_date: '2026-12-03',
    days: 3,
    nights: 2,
    estimated_cost: 3000000,
    image_url: 'https://example.com/dalat.jpg',
    share: false,
    cloned_from_id: null,
    author: { id: 'u-1', name: 'A' },
    itinerary_provinces: [{ province_id: 'p-1', provinces: { id: 'p-1', name: 'Lâm Đồng' } }],
    itinerary_days: [
        { id: 'd-2', day_number: 2, title: 'Ngày 2', itinerary_locations: [] },
        {
            id: 'd-1',
            day_number: 1,
            title: 'Ngày 1',
            itinerary_locations: [
                { id: 'a-2', location_id: null, location_name: 'Chợ đêm', sequence_order: 2, start_time: '19:00:00', end_time: null, cost: 0, activity_note: '', lat: 11.9, lng: 108.4, locations: null },
                { id: 'a-1', location_id: 'l-1', location_name: 'Hồ Xuân Hương', sequence_order: 1, start_time: '08:00:00', end_time: '09:00:00', cost: 0, activity_note: 'Dạo hồ', lat: 11.94, lng: 108.44, locations: { id: 'l-1' } },
            ],
        },
    ],
};

test('payload đầy đủ giữ mọi trường, sắp xếp ngày và hoạt động, bỏ dữ liệu thừa', () => {
    const payload = toFullPayload(existing);
    assert.equal(payload.title, 'Đà Lạt 3 ngày');
    assert.equal(payload.user_id, undefined);
    assert.equal(payload.author, undefined);
    assert.deepEqual(payload.itinerary_provinces, [{ province_id: 'p-1' }]);
    assert.deepEqual(payload.itinerary_days.map((day) => day.day_number), [1, 2]);
    assert.deepEqual(payload.itinerary_days[0].itinerary_locations.map((a) => a.location_name), ['Hồ Xuân Hương', 'Chợ đêm']);
    assert.equal(payload.itinerary_days[0].itinerary_locations[0].id, undefined);
    assert.equal(payload.itinerary_days[0].itinerary_locations[0].locations, undefined);
});

test('cập nhật một phần không làm mất ngày, hoạt động, tỉnh và các trường khác', () => {
    const merged = mergeItineraryUpdate(existing, { share: true });
    assert.equal(merged.share, true);
    assert.equal(merged.title, 'Đà Lạt 3 ngày');
    assert.equal(merged.summary, 'Chuyến đi thư giãn');
    assert.equal(merged.estimated_cost, 3000000);
    assert.equal(merged.itinerary_days.length, 2);
    assert.equal(merged.itinerary_provinces.length, 1);
});

test('gửi itinerary_days mới thì thay thế toàn bộ lịch trình', () => {
    const merged = mergeItineraryUpdate(existing, { itinerary_days: [] });
    assert.deepEqual(merged.itinerary_days, []);
    assert.equal(merged.itinerary_provinces.length, 1);
});
