import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabaseClient.js';
import { HttpError } from './httpError.js';

const BUCKET = 'image';
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const uploadImageToStorage = async (file, folder) => {
    if (!file?.buffer) throw new HttpError(400, 'Không tìm thấy dữ liệu file hợp lệ!');
    if (!folder) throw new Error('uploadImageToStorage: thiếu tên thư mục');
    if (!ALLOWED_MIME.has(file.mimetype)) throw new HttpError(400, 'Chỉ chấp nhận ảnh JPEG, PNG, WEBP hoặc GIF');
    if (file.size > MAX_SIZE_BYTES) throw new HttpError(400, 'Ảnh không được vượt quá 5MB');

    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${folder}/${Date.now()}-${randomUUID()}.${extension}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, Buffer.from(file.buffer), { contentType: file.mimetype, upsert: false });
    if (error) throw error;

    return supabase.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;
};

export const deleteImageFromStorage = async (imageUrl) => {
    if (!imageUrl) return;
    const [, filePath] = imageUrl.split(`/${BUCKET}/`);
    if (!filePath) return;

    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (error) console.error('Không xóa được ảnh cũ trên Storage:', error.message);
};
