import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitTour, scheduleDay, buildItineraryDays } from './itineraryPlanner.js';

// Hai cụm cách nhau ~100km: cụm A quanh kinh độ 105.0, cụm B quanh 106.0 (cùng vĩ độ 21)
const cluster = (name, lng, count) =>
    Array.from({ length: count }, (_, i) => ({ id: `${name}${i}`, lat: 21 + i * 0.005, lng: lng + i * 0.005, duration_minutes: 60 }));

test('quy hoạch động cắt tour ở cạnh dài nhất khi kích thước cho phép', () => {
    // 6 điểm, cạnh dài ở giữa (vị trí 2 -> 3)
    assert.deepEqual(splitTour([1, 1, 100, 1, 1], 6, 2), [3, 3]);
    // Cạnh dài lệch về một phía vẫn được chọn nếu chênh lệch số điểm không quá 1 so với chia đều
    assert.deepEqual(splitTour([1, 100, 1, 1, 1], 6, 2), [2, 4]);
});

test('số điểm mỗi ngày cân bằng, tổng đúng bằng số điểm', () => {
    for (const [n, k] of [[20, 5], [7, 3], [5, 5], [13, 4]]) {
        const sizes = splitTour(new Array(n - 1).fill(1), n, k);
        assert.equal(sizes.length, k);
        assert.equal(sizes.reduce((a, b) => a + b, 0), n);
        assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 3, `${n} điểm / ${k} ngày: ${sizes}`);
    }
});

test('mỗi ngày gói gọn trong một cụm địa lý', () => {
    // Xen kẽ điểm của 2 cụm (A0, B0, A1, B1...), 2 ngày -> mỗi ngày phải là trọn một cụm
    const a = cluster('A', 105, 4);
    const b = cluster('B', 106, 4);
    const stops = a.flatMap((stop, i) => [stop, b[i]]);
    const days = buildItineraryDays(stops, 2);
    const clusterOf = (day) => new Set(day.map((s) => s.id[0]));
    assert.equal(days.length, 2);
    assert.equal(clusterOf(days[0]).size, 1);
    assert.equal(clusterOf(days[1]).size, 1);
    assert.equal(days[0].length + days[1].length, 8);
});

test('ít điểm hơn số ngày: mỗi ngày 1 điểm, các ngày còn lại để trống', () => {
    const days = buildItineraryDays(cluster('A', 105, 2), 4);
    assert.deepEqual(days.map((d) => d.length), [1, 1, 0, 0]);
});

test('xếp giờ: bắt đầu 08:00, cộng di chuyển, chèn nghỉ trưa, giữ thời lượng', () => {
    const [a, b, c] = cluster('A', 105, 3).map((s) => ({ ...s, duration_minutes: 120 }));
    const [s1, s2, s3] = scheduleDay([a, b, c]);
    assert.equal(s1.start_time, '08:00');
    assert.equal(s1.end_time, '10:00');
    // ~0.7km -> làm tròn lên 5 phút di chuyển
    assert.equal(s2.start_time, '10:05');
    assert.equal(s2.end_time, '12:05');
    // Sau 11:30 -> nghỉ trưa 60 phút rồi mới đi tiếp
    assert.equal(s3.start_time, '13:10');
    assert.equal(s3.end_time, '15:10');
});

test('thời lượng không hợp lệ được đưa về khoảng cho phép', () => {
    const [p] = cluster('A', 105, 1);
    assert.equal(scheduleDay([{ ...p, duration_minutes: 'abc' }])[0].end_time, '09:30');
    assert.equal(scheduleDay([{ ...p, duration_minutes: 5 }])[0].end_time, '08:30');
    assert.equal(scheduleDay([{ ...p, duration_minutes: 999 }])[0].end_time, '12:00');
});
