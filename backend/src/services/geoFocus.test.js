import { test } from 'node:test';
import assert from 'node:assert/strict';
import { focusAround, keywordAnchors } from './geoFocus.js';

const lamDong = [
    { id: 'bau-trang', name: 'Bau Trang · Hoa Thang, Lam Dong', lat: 11.064, lng: 108.423 },
    { id: 'tuyen-lam', name: 'Tuyền Lâm Lake · Xuan Huong - Da Lat, Lam Dong', lat: 11.9, lng: 108.43 },
    { id: 'lam-vien', name: 'Quảng trường Lâm Viên · Xuan Huong - Da Lat, Lam Dong', lat: 11.939, lng: 108.445 },
    { id: 'doi-cat', name: 'Red Sand Dunes · 01 Hòn Rơm, ĐT716, Mũi Né, Lâm Đồng', lat: 10.949, lng: 108.296 },
    { id: 'datanla', name: 'Khu du lịch Thác Datanla · QL20 Đèo Prenn, Xuân Hương - Đà Lạt, Lâm Đồng', lat: 11.903, lng: 108.45 },
    { id: 'lang-biang', name: 'Lang Biang - Da Lat · Lang Biang - Da Lat, Lam Dong', lat: 12.051, lng: 108.239 },
];
const ids = (list) => list.map((loc) => loc.id).sort();

test('địa danh "Đà Lạt" lấy điểm neo từ tên/địa chỉ, không phân biệt dấu', () => {
    assert.equal(keywordAnchors(lamDong, ['Đà Lạt']).length, 4);
    assert.equal(keywordAnchors(lamDong, ['da lat']).length, 4);
    assert.deepEqual(keywordAnchors(lamDong, ['ab']), []);
});

test('khoanh vùng quanh Đà Lạt loại các điểm ở Mũi Né cách hơn 100km', () => {
    const focused = focusAround(lamDong, keywordAnchors(lamDong, ['Đà Lạt']), 8);
    assert.deepEqual(ids(focused), ['datanla', 'lam-vien', 'lang-biang', 'tuyen-lam']);
});

test('không có điểm neo hoặc quá ít điểm gần thì giữ nguyên danh sách', () => {
    assert.equal(focusAround(lamDong, [], 4).length, 6);
    assert.equal(focusAround(lamDong, [{ lat: 21.03, lng: 105.85 }], 4).length, 6);
});

test('chọn bán kính nhỏ nhất đủ số điểm cần', () => {
    const anchors = [{ lat: 11.94, lng: 108.44 }];
    assert.deepEqual(ids(focusAround(lamDong, anchors, 3)), ['datanla', 'lam-vien', 'lang-biang', 'tuyen-lam']);
});
