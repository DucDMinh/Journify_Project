import { normalizeProvinceName } from './regions.js';
import { normalizeText } from '../helpers/text.js';
const MERGED_INTO = {
    'Hà Giang': 'Tuyên Quang',
    'Yên Bái': 'Lào Cai',
    'Bắc Kạn': 'Thái Nguyên',
    'Vĩnh Phúc': 'Phú Thọ',
    'Hòa Bình': 'Phú Thọ',
    'Bắc Giang': 'Bắc Ninh',
    'Thái Bình': 'Hưng Yên',
    'Hải Dương': 'Hải Phòng',
    'Hà Nam': 'Ninh Bình',
    'Nam Định': 'Ninh Bình',
    'Quảng Bình': 'Quảng Trị',
    'Quảng Nam': 'Đà Nẵng',
    'Kon Tum': 'Quảng Ngãi',
    'Bình Định': 'Gia Lai',
    'Ninh Thuận': 'Khánh Hòa',
    'Đắk Nông': 'Lâm Đồng',
    'Bình Thuận': 'Lâm Đồng',
    'Phú Yên': 'Đắk Lắk',
    'Bà Rịa - Vũng Tàu': 'Hồ Chí Minh',
    'Bình Dương': 'Hồ Chí Minh',
    'Bình Phước': 'Đồng Nai',
    'Long An': 'Tây Ninh',
    'Sóc Trăng': 'Cần Thơ',
    'Hậu Giang': 'Cần Thơ',
    'Bến Tre': 'Vĩnh Long',
    'Trà Vinh': 'Vĩnh Long',
    'Tiền Giang': 'Đồng Tháp',
    'Bạc Liêu': 'Cà Mau',
    'Kiên Giang': 'An Giang',
    // Tên gọi khác hay gặp
    'Thừa Thiên Huế': 'Huế',
    'Vũng Tàu': 'Hồ Chí Minh',
    'Sài Gòn': 'Hồ Chí Minh',
    'HCM': 'Hồ Chí Minh',
};

const DESTINATIONS = {
    'Đà Lạt': 'Lâm Đồng',
    'Bảo Lộc': 'Lâm Đồng',
    'Mũi Né': 'Lâm Đồng',
    'Phan Thiết': 'Lâm Đồng',
    'Sa Pa': 'Lào Cai',
    'Sapa': 'Lào Cai',
    'Mù Cang Chải': 'Lào Cai',
    'Y Tý': 'Lào Cai',
    'Đồng Văn': 'Tuyên Quang',
    'Mèo Vạc': 'Tuyên Quang',
    'Mã Pí Lèng': 'Tuyên Quang',
    'Hạ Long': 'Quảng Ninh',
    'Cô Tô': 'Quảng Ninh',
    'Cát Bà': 'Hải Phòng',
    'Tam Cốc': 'Ninh Bình',
    'Tràng An': 'Ninh Bình',
    'Mộc Châu': 'Sơn La',
    'Tà Xùa': 'Sơn La',
    'Mai Châu': 'Phú Thọ',
    'Tam Đảo': 'Phú Thọ',
    'Phong Nha': 'Quảng Trị',
    'Hội An': 'Đà Nẵng',
    'Bà Nà': 'Đà Nẵng',
    'Cù Lao Chàm': 'Đà Nẵng',
    'Lý Sơn': 'Quảng Ngãi',
    'Măng Đen': 'Quảng Ngãi',
    'Quy Nhơn': 'Gia Lai',
    'Pleiku': 'Gia Lai',
    'Buôn Ma Thuột': 'Đắk Lắk',
    'Tuy Hòa': 'Đắk Lắk',
    'Nha Trang': 'Khánh Hòa',
    'Cam Ranh': 'Khánh Hòa',
    'Phan Rang': 'Khánh Hòa',
    'Côn Đảo': 'Hồ Chí Minh',
    'Phú Quốc': 'An Giang',
    'Hà Tiên': 'An Giang',
    'Châu Đốc': 'An Giang',
    'Đất Mũi': 'Cà Mau',
};

const toKeyMap = (entries) => new Map(Object.entries(entries).map(([from, to]) => [normalizeProvinceName(from), normalizeProvinceName(to)]));

const mergedInto = toKeyMap(MERGED_INTO);
const destinationProvince = toKeyMap(DESTINATIONS);

const splitNames = (rawName) =>
    String(rawName ?? '')
        .split(/\/|,|;|&|\s+và\s+/)
        .map((part) => part.trim())
        .filter(Boolean);

// Tìm các tỉnh trong DB ứng với tên LLM trả về. Chỉ so khớp chính xác sau khi chuẩn hóa (không so khớp một phần,
// tránh "Hà" khớp nhầm "Hải Phòng"). Tên ghép như "Lào Cai/Lai Châu" được tách thành nhiều tỉnh.
export const resolveProvinces = (rawName, provinces) => {
    const byKey = new Map(provinces.map((p) => [normalizeProvinceName(p.name), p]));
    const found = splitNames(rawName)
        .map((part) => normalizeProvinceName(part))
        .map((key) => byKey.get(mergedInto.get(key) ?? destinationProvince.get(key) ?? key))
        .filter(Boolean);
    return [...new Map(found.map((p) => [p.id, p])).values()];
};

const DESTINATION_PROVINCE_NAMES = new Map(Object.entries(DESTINATIONS).map(([name, province]) => [normalizeProvinceName(name), province]));

export const destinationProvinceName = (name) => DESTINATION_PROVINCE_NAMES.get(normalizeProvinceName(name)) ?? null;

export const destinationsIn = (rawName) =>
    splitNames(rawName).filter((part) => destinationProvince.has(normalizeProvinceName(part)));

export const destinationsMentioned = (text) => {
    const haystack = ` ${normalizeText(text)} `;
    return Object.entries(DESTINATIONS)
        .filter(([name]) => haystack.includes(` ${normalizeProvinceName(name)} `))
        .map(([name, province]) => ({ name, province: normalizeProvinceName(province) }));
};
