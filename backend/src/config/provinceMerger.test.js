import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveProvinces } from './provinceMerger.js';

// Tên giống hệt bảng provinces trong DB (có "Thành phố", "Hoà" kiểu cũ)
const provinces = ['Tuyên Quang', 'Lào Cai', 'Lai Châu', 'Thành phố Hải Phòng', 'Thành phố Hồ Chí Minh', 'Thành phố Huế', 'Khánh Hoà', 'An Giang', 'Thành phố Đà Nẵng']
    .map((name, i) => ({ id: `p${i}`, name }));
const names = (raw) => resolveProvinces(raw, provinces).map((p) => p.name);

test('tên tỉnh cũ trước sáp nhập được quy đổi sang tỉnh mới', () => {
    assert.deepEqual(names('Hà Giang'), ['Tuyên Quang']);
    assert.deepEqual(names('Tỉnh Hà Giang'), ['Tuyên Quang']);
    assert.deepEqual(names('Yên Bái'), ['Lào Cai']);
    assert.deepEqual(names('Quảng Nam'), ['Thành phố Đà Nẵng']);
    assert.deepEqual(names('Kiên Giang'), ['An Giang']);
    assert.deepEqual(names('Bà Rịa – Vũng Tàu'), ['Thành phố Hồ Chí Minh']);
});

test('không phân biệt dấu, tiền tố và cách viết', () => {
    assert.deepEqual(names('tuyen quang'), ['Tuyên Quang']);
    assert.deepEqual(names('Khánh Hòa'), ['Khánh Hoà']);
    assert.deepEqual(names('TP.HCM'), ['Thành phố Hồ Chí Minh']);
    assert.deepEqual(names('Thừa Thiên Huế'), ['Thành phố Huế']);
});

test('tên ghép được tách thành nhiều tỉnh, bỏ trùng', () => {
    assert.deepEqual(names('Lào Cai/Lai Châu'), ['Lào Cai', 'Lai Châu']);
    assert.deepEqual(names('Hà Giang, Tuyên Quang'), ['Tuyên Quang']);
});

test('không so khớp một phần tên (tránh "Hà" ra Hải Phòng)', () => {
    assert.deepEqual(names('Hà'), []);
    assert.deepEqual(names(''), []);
    assert.deepEqual(names(undefined), []);
});
