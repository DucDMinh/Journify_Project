import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitIntoDays, scheduleDay, buildItineraryDays } from './itineraryPlanner.js';

// Các điểm sát nhau (~0,7km) quanh kinh độ lng, vĩ độ 21
const cluster = (name, lng, count, duration = 60) =>
    Array.from({ length: count }, (_, i) => ({ id: `${name}${i}`, lat: 21 + i * 0.005, lng: lng + i * 0.005, duration_minutes: duration }));

test('chia ngày: đủ số ngày, mỗi ngày ít nhất 1 điểm, tổng đúng bằng số điểm', () => {
    for (const [n, k] of [[20, 5], [7, 3], [5, 5], [13, 4]]) {
        const sizes = splitIntoDays(cluster('A', 105, n), k);
        assert.equal(sizes.length, k);
        assert.equal(sizes.reduce((a, b) => a + b, 0), n);
        assert.ok(sizes.every((size) => size >= 1), `${n} điểm / ${k} ngày: ${sizes}`);
    }
});

test('chia ngày cân bằng theo thời gian, không theo số điểm', () => {
    // 2 điểm dài (4 tiếng) và 4 điểm ngắn (30 phút), 2 ngày -> ngày có điểm dài phải ít điểm hơn
    const stops = [...cluster('L', 105, 2, 240), ...cluster('S', 105.02, 4, 30)];
    const sizes = splitIntoDays(stops, 2);
    assert.deepEqual(sizes, [1, 5]);
});

test('mỗi ngày gói gọn trong một cụm địa lý, quãng chuyển xa rơi vào đầu ngày', () => {
    // Xen kẽ điểm của 2 cụm cách nhau ~100km (A0, B0, A1, B1...), 2 ngày -> mỗi ngày phải là trọn một cụm
    const a = cluster('A', 105, 4);
    const b = cluster('B', 106, 4);
    const { days, dropped } = buildItineraryDays(a.flatMap((stop, i) => [stop, b[i]]), 2);
    assert.equal(dropped, 0);
    assert.deepEqual(days.map((day) => new Set(day.map((s) => s.id[0])).size), [1, 1]);
    // Ngày 2 bắt đầu bằng quãng chuyển ~100km (gần 3 giờ) nên điểm đầu tiên không thể bắt đầu lúc 08:00
    assert.ok(days[1][0].start_time > '10:00', days[1][0].start_time);
});

test('không đủ thời gian thì bỏ các điểm ưu tiên thấp nhất, giữ điểm xuất phát', () => {
    // 12 điểm x 4 tiếng trong 2 ngày (mỗi ngày tối đa 12 tiếng hoạt động)
    const stops = cluster('A', 105, 12, 240);
    const { days, dropped } = buildItineraryDays(stops, 2);
    const kept = days.flat().map((s) => s.id);
    assert.ok(dropped > 0);
    assert.equal(kept.length + dropped, 12);
    assert.ok(kept.includes('A0'));
    // Chỉ giữ các điểm có độ ưu tiên cao nhất (đứng đầu danh sách)
    assert.deepEqual([...kept].sort(), stops.slice(0, kept.length).map((s) => s.id).sort());
});

test('ít điểm hơn số ngày: mỗi ngày 1 điểm, các ngày còn lại để trống', () => {
    const { days } = buildItineraryDays(cluster('A', 105, 2), 4);
    assert.deepEqual(days.map((d) => d.length), [1, 1, 0, 0]);
});

test('xếp giờ: bắt đầu 08:00, cộng di chuyển, chèn nghỉ trưa, giữ thời lượng', () => {
    const [s1, s2, s3] = scheduleDay(cluster('A', 105, 3, 120));
    assert.equal(s1.start_time, '08:00');
    assert.equal(s1.end_time, '10:00');
    // ~0,7km -> làm tròn lên 5 phút di chuyển
    assert.equal(s2.start_time, '10:05');
    assert.equal(s2.end_time, '12:05');
    // Sau 11:30 -> nghỉ trưa 60 phút rồi mới đi tiếp
    assert.equal(s3.start_time, '13:10');
    assert.equal(s3.end_time, '15:10');
});

test('xếp giờ: ngày sau bắt đầu bằng quãng di chuyển từ điểm cuối ngày trước', () => {
    const [previous] = cluster('P', 105, 1);
    const [first] = scheduleDay(cluster('A', 105, 1), { ...previous, lat: 21, lng: 104.9 });
    // ~10km -> 25 phút di chuyển
    assert.equal(first.start_time, '08:25');
});

test('thời lượng không hợp lệ được đưa về khoảng cho phép', () => {
    const [p] = cluster('A', 105, 1);
    assert.equal(scheduleDay([{ ...p, duration_minutes: 'abc' }])[0].end_time, '09:30');
    assert.equal(scheduleDay([{ ...p, duration_minutes: 5 }])[0].end_time, '08:30');
    assert.equal(scheduleDay([{ ...p, duration_minutes: 999 }])[0].end_time, '12:00');
});
