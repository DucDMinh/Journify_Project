// Phân vùng 34 tỉnh thành (sau sáp nhập 01/07/2025). So khớp theo tên đã bỏ dấu và tiền tố "Tỉnh/Thành phố".
export const REGIONS = [
    {
        key: 'mien-bac',
        name: 'Miền Bắc',
        tagline: 'Núi non hùng vĩ, ruộng bậc thang và di sản nghìn năm',
        provinces: ['Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Bắc Ninh', 'Hưng Yên', 'Ninh Bình', 'Phú Thọ', 'Thái Nguyên',
            'Lạng Sơn', 'Cao Bằng', 'Tuyên Quang', 'Lào Cai', 'Lai Châu', 'Điện Biên', 'Sơn La'],
    },
    {
        key: 'mien-trung',
        name: 'Miền Trung',
        tagline: 'Biển xanh, cố đô và những cung đèo ven biển',
        provinces: ['Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Trị', 'Huế', 'Đà Nẵng', 'Quảng Ngãi', 'Khánh Hòa'],
    },
    {
        key: 'tay-nguyen',
        name: 'Tây Nguyên',
        tagline: 'Cao nguyên đất đỏ, thác nước và cà phê',
        provinces: ['Gia Lai', 'Đắk Lắk', 'Lâm Đồng'],
    },
    {
        key: 'mien-nam',
        name: 'Miền Nam',
        tagline: 'Sông nước miệt vườn, đảo ngọc và phố thị sôi động',
        provinces: ['Hồ Chí Minh', 'Đồng Nai', 'Tây Ninh', 'Cần Thơ', 'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Cà Mau'],
    },
];

const normalize = (name) =>
    String(name ?? '')
        .replace(/^(Tỉnh|Thành phố|TP\.?)\s+/i, '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();

const regionByProvince = new Map(REGIONS.flatMap((r) => r.provinces.map((p) => [normalize(p), r.key])));

export const regionKeyOf = (provinceName) => regionByProvince.get(normalize(provinceName)) ?? null;
