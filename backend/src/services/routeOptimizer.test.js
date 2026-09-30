import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    buildDistanceMatrix, pathLength, nearestNeighbor, twoOpt, optimizeOrder, optimizeDay, estimateTravelMinutes,
} from './routeOptimizer.js';

// Bộ sinh số ngẫu nhiên có seed để test lặp lại được
const mulberry32 = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const randomPoints = (rand, n) => Array.from({ length: n }, () => ({ lat: 21 + rand() * 0.3, lng: 105.7 + rand() * 0.3 }));

// Nghiệm tối ưu bằng vét cạn (nhánh cận), điểm 0 cố định ở đầu, để đối chiếu
const bruteForceLength = (dist) => {
    const n = dist.length;
    const used = new Array(n).fill(false);
    used[0] = true;
    let best = Infinity;
    const visit = (last, count, length) => {
        if (length >= best) return;
        if (count === n) {
            best = length;
            return;
        }
        for (let i = 0; i < n; i++) {
            if (used[i]) continue;
            used[i] = true;
            visit(i, count + 1, length + dist[last][i]);
            used[i] = false;
        }
    };
    visit(0, 1, 0);
    return best;
};

// Các điểm trên cùng một vĩ tuyến, cách nhau theo kinh độ
const onLine = (...lngs) => lngs.map((lng) => ({ lat: 21, lng: 105 + lng * 0.01 }));

test('Nearest Neighbor luôn đi tới điểm chưa thăm gần nhất', () => {
    const points = onLine(0, 7, 1, 3);
    assert.deepEqual(nearestNeighbor([0], buildDistanceMatrix(points)), [0, 2, 3, 1]);
});

test('2-opt gỡ bỏ đoạn đường tự cắt nhau', () => {
    // 4 góc hình vuông, thứ tự ban đầu đi chéo 2 lần (2 đường chéo cắt nhau)
    const points = [{ lat: 21.01, lng: 105 }, { lat: 21, lng: 105.01 }, { lat: 21.01, lng: 105.01 }, { lat: 21, lng: 105 }];
    const dist = buildDistanceMatrix(points);
    const before = pathLength([0, 1, 2, 3], dist);
    const after = pathLength(twoOpt([0, 1, 2, 3], dist), dist);
    assert.ok(after < before);
    assert.ok(Math.abs(after - bruteForceLength(dist)) < 1e-6, `thực tế ${after}m`);
});

test('kết quả là hoán vị hợp lệ, giữ điểm đầu và không bao giờ dài hơn thứ tự ban đầu', () => {
    const rand = mulberry32(1);
    for (let t = 0; t < 200; t++) {
        const n = 2 + Math.floor(rand() * 14);
        const { order, distanceMeters, originalDistanceMeters } = optimizeOrder(randomPoints(rand, n));
        assert.deepEqual([...order].sort((a, b) => a - b), [...Array(n).keys()]);
        assert.equal(order[0], 0);
        assert.ok(distanceMeters <= originalDistanceMeters + 1e-6);
    }
});

test('gần với nghiệm tối ưu vét cạn (sai lệch tối đa < 10%)', () => {
    const rand = mulberry32(42);
    let optimalCount = 0;
    for (let t = 0; t < 100; t++) {
        const points = randomPoints(rand, 8);
        const optimum = bruteForceLength(buildDistanceMatrix(points));
        const gap = optimizeOrder(points).distanceMeters / optimum - 1;
        assert.ok(gap < 0.1, `sai lệch ${(gap * 100).toFixed(2)}% ở lần ${t}`);
        if (gap < 1e-9) optimalCount += 1;
    }
    assert.ok(optimalCount >= 90, `chỉ ${optimalCount}/100 lần đạt tối ưu`);
});

test('giữ nguyên khi thứ tự đã ngắn nhất', () => {
    const activities = onLine(0, 1, 2, 3).map((p, i) => ({ id: `a${i}`, ...p, start_time: '08:00', end_time: '09:00' }));
    const result = optimizeDay(activities);
    assert.equal(result.changed, false);
    assert.equal(result.activities, activities);
});

test('hoạt động không có tọa độ giữ nguyên vị trí, hoạt động có tọa độ được sắp lại', () => {
    const [p0, p1, p2] = onLine(0, 5, 1);
    const activities = [
        { id: 'A', ...p0 },
        { id: 'lunch', lat: 0, lng: 0 },
        { id: 'B', ...p1 },
        { id: 'C', ...p2 },
    ];
    const result = optimizeDay(activities);
    assert.equal(result.changed, true);
    assert.deepEqual(result.activities.map((a) => a.id), ['A', 'lunch', 'C', 'B']);
    assert.deepEqual(result.activities.map((a) => a.sequence_order), [1, 2, 3, 4]);
});

test('xếp lại giờ: giữ giờ bắt đầu ngày, thời lượng, khoảng nghỉ và cộng thời gian di chuyển', () => {
    const [p0, p1, p2] = onLine(0, 20, 1); // cách nhau ~1km và ~20km
    const activities = [
        { id: 'A', ...p0, start_time: '08:00:00', end_time: '09:00:00' },
        { id: 'B', ...p1, start_time: '09:00', end_time: '12:00' },
        { id: 'C', ...p2, start_time: '14:00', end_time: '14:30' },
    ];
    const { activities: result } = optimizeDay(activities);
    assert.deepEqual(result.map((a) => a.id), ['A', 'C', 'B']);

    const travelAC = estimateTravelMinutes(1037); // ~0.01° kinh độ ở vĩ độ 21
    assert.deepEqual(result[0], { ...activities[0], start_time: '08:00', end_time: '09:00', sequence_order: 1 });
    // Vị trí 2 gốc không có khoảng nghỉ -> chỉ cộng thời gian di chuyển; C giữ thời lượng 30 phút
    assert.equal(result[1].start_time, `09:${String(travelAC).padStart(2, '0')}`);
    // Vị trí 3 gốc có khoảng nghỉ 2 tiếng (12:00 -> 14:00), lớn hơn thời gian di chuyển C -> B
    const cEnd = 9 * 60 + travelAC + 30;
    const bStart = cEnd + Math.max(120, estimateTravelMinutes(19700));
    const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    assert.equal(result[1].end_time, fmt(cEnd));
    assert.equal(result[2].start_time, fmt(bStart));
    assert.equal(result[2].end_time, fmt(bStart + 180));
});

test('báo vượt quá 24h và giới hạn giờ ở 23:59', () => {
    const [p0, p1, p2] = onLine(0, 30, 1);
    const activities = [
        { id: 'A', ...p0, start_time: '20:00', end_time: '22:00' },
        { id: 'B', ...p1, start_time: '22:00', end_time: '23:00' },
        { id: 'C', ...p2, start_time: '23:00', end_time: '23:50' },
    ];
    const result = optimizeDay(activities);
    assert.equal(result.exceedsDay, true);
    assert.ok(result.activities.every((a) => a.end_time <= '23:59'));
});

test('điểm đầu tiên luôn giữ nguyên dù đi từ đầu khác sẽ ngắn hơn', () => {
    // Điểm đầu ở giữa: đi 2 -> 3 -> 1 -> 0 (dài 4 đơn vị) thay vì 0 -> 1 -> 2 -> 3 (dài 3 nhưng phải đổi điểm đầu)
    const activities = onLine(2, 0, 3, 1).map((p, i) => ({ id: `x${i}`, ...p }));
    const result = optimizeDay(activities);
    assert.deepEqual(result.activities.map((a) => a.id), ['x0', 'x2', 'x3', 'x1']);
});
