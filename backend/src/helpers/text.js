// Chuẩn hóa chuỗi tiếng Việt để so khớp: bỏ dấu, chữ thường, gộp mọi ký tự không phải chữ/số thành một khoảng trắng
export const normalizeText = (value) =>
    String(value ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
