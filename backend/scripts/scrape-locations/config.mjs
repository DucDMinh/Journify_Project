// Nhiều endpoint Overpass để luân phiên khi một máy chủ quá tải / giới hạn tốc độ
export const OVERPASS_URLS = [
    'https://overpass-api.de/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
export const OVERPASS_TIMEOUT_S = 180;
// (south, west, north, east) - bao trọn lãnh thổ Việt Nam; phần dư sẽ bị loại khi gán tỉnh bằng đa giác
export const VIETNAM_BBOX = '8.2,102.1,23.5,109.6';
export const OVERPASS_DELAY_MS = 5000;
export const WIKI_BATCH_DELAY_MS = 1000;
export const WIKI_THUMB_WIDTH = 960;
export const MIN_IMAGE_WIDTH = 640;
export const NON_PHOTO_IMAGE = /(\bmap\b|bản đồ|ban do|locator|location|flag|lá cờ|logo|coat of arms|huy hiệu|huy hieu|seal|emblem|sơ đồ|so do|biểu trưng|bieu trung|diagram|\bplan\b|chart|portrait|chân dung|chan dung|\.svg$|\.png$|\.gif$)/i;
export const PHOTON_REVERSE_URL = 'https://photon.komoot.io/reverse';
export const PHOTON_DELAY_MS = 1100;
export const TRANSLATE_BATCH_SIZE = 8;

// Mỗi nhóm thẻ OSM -> loại địa điểm + điểm ưu tiên cơ bản.
// `values` = null nghĩa là chỉ cần có key; `requires` = các key bắt buộc phải có thêm (lọc chất lượng).
export const TAG_GROUPS = [
    { key: 'tourism', values: ['attraction', 'viewpoint', 'theme_park', 'zoo', 'aquarium'], category: 'tham_quan', baseScore: 2 },
    { key: 'tourism', values: ['museum'], category: 'bao_tang', baseScore: 2 },
    { key: 'natural', values: ['peak', 'volcano'], category: 'nui', baseScore: 2 },
    { key: 'waterway', values: ['waterfall'], category: 'thac', baseScore: 3 },
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

export const KIND_LABELS = {
    attraction: 'điểm tham quan',
    viewpoint: 'điểm ngắm cảnh',
    theme_park: 'khu vui chơi giải trí',
    zoo: 'vườn thú',
    aquarium: 'thủy cung',
    museum: 'bảo tàng',
    peak: 'đỉnh núi',
    volcano: 'núi lửa đã tắt',
    waterfall: 'thác nước',
    beach: 'bãi biển',
    cave_entrance: 'hang động',
    hot_spring: 'suối nước nóng',
    bay: 'vịnh',
    spring: 'mạch suối',
    arch: 'vòm đá tự nhiên',
    cliff: 'vách đá',
    national_park: 'vườn quốc gia',
    nature_reserve: 'khu bảo tồn thiên nhiên',
    monument: 'tượng đài',
    memorial: 'đài tưởng niệm',
    castle: 'thành cổ',
    fort: 'pháo đài',
    ruins: 'phế tích',
    archaeological_site: 'di chỉ khảo cổ',
    citadel: 'thành cổ',
    tomb: 'lăng mộ',
    city_gate: 'cổng thành cổ',
    temple: 'đền cổ',
    building: 'công trình lịch sử',
    manor: 'dinh thự cổ',
    battlefield: 'di tích chiến trường',
    park: 'công viên',
    garden: 'khu vườn',
    water: 'hồ nước',
    island: 'hòn đảo',
    islet: 'đảo nhỏ',
    archipelago: 'quần đảo',
};

export const RELIGION_LABELS = {
    buddhist: 'ngôi chùa',
    christian: 'nhà thờ',
    taoist: 'đền thờ',
    confucian: 'văn miếu',
    muslim: 'thánh đường Hồi giáo',
    hindu: 'đền Hindu',
    caodaist: 'thánh thất Cao Đài',
};

export const GENERIC_NAMES = new Set([
    'thac', 'thac nuoc', 'waterfall', 'bai bien', 'beach', 'dinh nui', 'nui', 'peak', 'hang', 'hang dong', 'cave', 'chua', 'den',
    'mieu', 'dinh', 'nha tho', 'cong vien', 'park', 'ho', 'lake', 'dao', 'island', 'viewpoint', 'diem ngam canh', 'view',
    'bao tang', 'museum', 'tuong dai', 'monument', 'dai tuong niem', 'memorial', 'nghia trang', 'cemetery',
]);

// Tên chung chung / không phải điểm đến -> bỏ
export const NAME_BLACKLIST = /^(khu vui chơi|sân chơi|bãi đỗ xe|bãi đậu xe|nhà vệ sinh|toilet|parking|playground|cổng|gate|trạm|đường)\b/i;

export const DEFAULTS = {
    limitPerProvince: 80,
    minScore: 2,
    dedupeRadiusMeters: 150,
};
