import { normalizeProvinceName } from './regions.js';
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

const mergedInto = new Map(Object.entries(MERGED_INTO).map(([oldName, newName]) => [normalizeProvinceName(oldName), normalizeProvinceName(newName)]));

// Tìm các tỉnh trong DB ứng với tên LLM trả về. Chỉ so khớp chính xác sau khi chuẩn hóa (không so khớp một phần,
// tránh "Hà" khớp nhầm "Hải Phòng"). Tên ghép như "Lào Cai/Lai Châu" được tách thành nhiều tỉnh.
export const resolveProvinces = (rawName, provinces) => {
    const byKey = new Map(provinces.map((p) => [normalizeProvinceName(p.name), p]));
    const found = String(rawName ?? '')
        .split(/\/|,|;|&|\s+và\s+/)
        .map((part) => normalizeProvinceName(part))
        .filter(Boolean)
        .map((key) => byKey.get(mergedInto.get(key) ?? key))
        .filter(Boolean);
    return [...new Map(found.map((p) => [p.id, p])).values()];
};
