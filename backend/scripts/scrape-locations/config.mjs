// Nhiều endpoint Overpass để luân phiên khi một máy chủ quá tải / giới hạn tốc độ
export const OVERPASS_URLS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
];
export const OVERPASS_TIMEOUT_S = 180;
// (south, west, north, east) - bao trọn lãnh thổ Việt Nam; phần dư sẽ bị loại khi gán tỉnh bằng đa giác
export const VIETNAM_BBOX = '8.2,102.1,23.5,109.6';
export const OVERPASS_DELAY_MS = 5000;
export const WIKI_BATCH_DELAY_MS = 300;
export const WIKI_THUMB_WIDTH = 800;

// Mỗi nhóm thẻ OSM -> loại địa điểm + điểm ưu tiên cơ bản.
// `values` = null nghĩa là chỉ cần có key; `requires` = các key bắt buộc phải có thêm (lọc chất lượng).
export const TAG_GROUPS = [
    { key: 'tourism', values: ['attraction', 'viewpoint', 'theme_park', 'zoo', 'aquarium'], category: 'tham_quan', baseScore: 2 },
    { key: 'tourism', values: ['museum'], category: 'bao_tang', baseScore: 2 },
    { key: 'natural', values: ['peak', 'volcano'], category: 'nui', baseScore: 2 },
    { key: 'natural', values: ['waterfall'], category: 'thac', baseScore: 3 },
    { key: 'natural', values: ['beach'], category: 'bai_bien', baseScore: 3 },
    { key: 'natural', values: ['cave_entrance', 'hot_spring', 'bay', 'spring', 'arch', 'cliff'], category: 'thien_nhien', baseScore: 2 },
    { key: 'boundary', values: ['national_park'], category: 'vuon_quoc_gia', baseScore: 3 },
    { key: 'leisure', values: ['nature_reserve'], category: 'khu_bao_ton', baseScore: 2 },
    { key: 'historic', values: ['monument', 'memorial', 'castle', 'fort', 'ruins', 'archaeological_site', 'citadel', 'tomb', 'city_gate', 'temple', 'building', 'manor', 'battlefield'], category: 'di_tich', baseScore: 2 },
    // Chùa/nhà thờ/công viên/hồ rất nhiều - chỉ lấy nơi có bài Wikipedia để giữ chất lượng
    { key: 'amenity', values: ['place_of_worship'], requires: ['wikipedia'], category: 'tam_linh', baseScore: 2 },
    { key: 'leisure', values: ['park', 'garden'], requires: ['wikipedia'], category: 'cong_vien', baseScore: 1 },
    { key: 'natural', values: ['water'], requires: ['wikipedia'], category: 'ho', baseScore: 2 },
    { key: 'place', values: ['island', 'islet', 'archipelago'], category: 'dao', baseScore: 2 },
];

export const groupSelector = (g) => {
    const value = g.values ? (g.values.length === 1 ? `="${g.values[0]}"` : `~"^(${g.values.join('|')})$"`) : '';
    const requires = (g.requires ?? []).map((k) => `["${k}"]`).join('');
    return `["${g.key}"${value}]${requires}["name"]`;
};

export const groupMatches = (g, tags) =>
    (g.values ? g.values.includes(tags[g.key]) : tags[g.key] !== undefined) && (g.requires ?? []).every((k) => tags[k] !== undefined);

export const CATEGORY_LABELS = {
    tham_quan: 'Điểm tham quan',
    bao_tang: 'Bảo tàng',
    nui: 'Núi / đỉnh',
    thac: 'Thác nước',
    bai_bien: 'Bãi biển',
    thien_nhien: 'Thiên nhiên',
    vuon_quoc_gia: 'Vườn quốc gia',
    khu_bao_ton: 'Khu bảo tồn',
    di_tich: 'Di tích lịch sử',
    tam_linh: 'Chùa / đền / nhà thờ',
    cong_vien: 'Công viên',
    ho: 'Hồ',
    dao: 'Đảo',
};

export const DIFFICULTY_BY_CATEGORY = {
    nui: 'Khó',
    thac: 'Trung Bình',
    thien_nhien: 'Trung Bình',
    vuon_quoc_gia: 'Trung Bình',
    khu_bao_ton: 'Trung Bình',
};
export const DEFAULT_DIFFICULTY = 'Dễ';

// Tên chung chung / không phải điểm đến -> bỏ
export const NAME_BLACKLIST = /^(khu vui chơi|sân chơi|bãi đỗ xe|bãi đậu xe|nhà vệ sinh|toilet|parking|playground|cổng|gate|trạm|đường)\b/i;

export const DEFAULTS = {
    limitPerProvince: 80,
    minScore: 2,
    dedupeRadiusMeters: 150,
};
