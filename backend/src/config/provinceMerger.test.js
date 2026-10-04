import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveProvinces, destinationsIn, destinationsMentioned, destinationProvinceName } from './provinceMerger.js';

// Tên giống hệt bảng provinces trong DB (có "Thành phố", "Hoà" kiểu cũ)
const provinces = ['Tuyên Quang', 'Lào Cai', 'Lai Châu', 'Thành phố Hải Phòng', 'Thành phố Hồ Chí Minh', 'Thành phố Huế', 'Khánh Hoà', 'An Giang', 'Thành phố Đà Nẵng', 'Lâm Đồng']
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

test('điểm du lịch nổi tiếng được quy về tỉnh chứa nó', () => {
    assert.deepEqual(names('Đà Lạt'), ['Lâm Đồng']);
    assert.deepEqual(names('Sapa'), ['Lào Cai']);
    assert.deepEqual(names('Hội An'), ['Thành phố Đà Nẵng']);
    assert.deepEqual(names('Phú Quốc'), ['An Giang']);
    assert.deepEqual(names('Nha Trang / Đà Lạt'), ['Khánh Hoà', 'Lâm Đồng']);
});

test('nhận ra tên điểm du lịch để khoanh vùng địa lý', () => {
    assert.deepEqual(destinationsIn('Đà Lạt'), ['Đà Lạt']);
    assert.deepEqual(destinationsIn('Lâm Đồng'), []);
    assert.deepEqual(destinationsIn('Sa Pa, Lào Cai'), ['Sa Pa']);
});

test('tìm tên điểm du lịch được nhắc trong câu yêu cầu (nguyên từ, không dấu)', () => {
    assert.deepEqual(destinationsMentioned('Đi Đà Lạt 2 ngày, thích cà phê').map((d) => d.name), ['Đà Lạt']);
    assert.deepEqual(destinationsMentioned('di da lat roi xuong mui ne').map((d) => d.name), ['Đà Lạt', 'Mũi Né']);
    assert.deepEqual(destinationsMentioned('Sapa mùa lúa chín').map((d) => d.province), ['lao cai']);
    assert.deepEqual(destinationsMentioned('Đi biển cuối tuần'), []);
});

test('tỉnh của điểm du lịch lấy từ bảng tra, không phụ thuộc AI', () => {
    assert.equal(destinationProvinceName('Đà Lạt'), 'Lâm Đồng');
    assert.equal(destinationProvinceName('phu quoc'), 'An Giang');
    assert.equal(destinationProvinceName('Lâm Đồng'), null);
});
