import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmail, isValidEmail, normalizePhone, isValidPhone, toCoordinate, isUuid } from './validators.js';

test('email được chuẩn hóa về chữ thường và bỏ khoảng trắng', () => {
    assert.equal(normalizeEmail('  Haui@Gmail.COM '), 'haui@gmail.com');
    assert.equal(normalizeEmail(undefined), '');
    assert.ok(isValidEmail('a.b@journify.test'));
    assert.ok(!isValidEmail('not-an-email'));
});

test('số điện thoại Việt Nam được chuẩn hóa và kiểm tra', () => {
    assert.equal(normalizePhone('0912 345 678'), '0912345678');
    assert.equal(normalizePhone('+84912345678'), '0912345678');
    assert.equal(normalizePhone('84912345678'), '0912345678');
    assert.equal(normalizePhone('912345678'), '0912345678');
    assert.equal(normalizePhone(''), null);
    assert.equal(normalizePhone(undefined), undefined);
    assert.ok(isValidPhone('0912345678'));
    assert.ok(isValidPhone(null));
    assert.ok(!isValidPhone('12123'));
    assert.ok(!isValidPhone('abc'));
    assert.ok(!isValidPhone('091234567899999'));
});

test('tọa độ ngoài phạm vi hoặc không phải số trả về NaN', () => {
    assert.equal(toCoordinate('21.0285', 90), 21.0285);
    assert.equal(toCoordinate('', 90), null);
    assert.equal(toCoordinate(undefined, 90), undefined);
    assert.ok(Number.isNaN(toCoordinate('abc', 90)));
    assert.ok(Number.isNaN(toCoordinate('120', 90)));
});

test('nhận diện uuid', () => {
    assert.ok(isUuid('a099b90f-1b55-42f9-9ad3-1341bbcff419'));
    assert.ok(!isUuid('not-a-uuid'));
});
