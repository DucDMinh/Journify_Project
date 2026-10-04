import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunkPath } from './geo.js';

const path = (n) => Array.from({ length: n }, (_, i) => i);

test('chia lộ trình thành các đoạn gối đầu nhau, không quá kích thước cho phép', () => {
    assert.deepEqual(chunkPath(path(2), 10), [[0, 1]]);
    assert.deepEqual(chunkPath(path(10), 10), [path(10)]);
    assert.deepEqual(chunkPath(path(11), 10), [path(10), [9, 10]]);
    const chunks = chunkPath(path(30), 10);
    assert.ok(chunks.every((chunk) => chunk.length <= 10 && chunk.length >= 2));
    assert.equal(chunks.reduce((sum, chunk) => sum + chunk.length - 1, 0), 29);
    chunks.slice(1).forEach((chunk, i) => assert.equal(chunk[0], chunks[i].at(-1)));
});

test('lộ trình ít hơn 2 điểm không có đoạn nào', () => {
    assert.deepEqual(chunkPath(path(1), 10), []);
    assert.deepEqual(chunkPath([], 10), []);
});

test('tách đoạn khi tổng quãng đường chim bay vượt giới hạn', () => {
    const line = Array.from({ length: 6 }, (_, i) => ({ lat: 10 + i, lng: 106 }));
    assert.deepEqual(chunkPath(line, 10, 250_000).map((chunk) => chunk.length), [3, 3, 2]);
    assert.deepEqual(chunkPath([{ lat: 10, lng: 106 }, { lat: 25, lng: 106 }], 10, 250_000).length, 1);
});
