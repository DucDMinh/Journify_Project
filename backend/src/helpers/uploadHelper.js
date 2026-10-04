import multer from '@koa/multer';
import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabaseClient.js';
import { HttpError } from './httpError.js';

const BUCKET = 'image';
const EXTENSION_BY_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const uploadImageToStorage = async (file, folder) => {
    if (!file?.buffer) throw new HttpError(400, 'Không tìm thấy dữ liệu file hợp lệ!');
    if (!folder) throw new Error('uploadImageToStorage: thiếu tên thư mục');
    if (!EXTENSION_BY_MIME[file.mimetype]) throw new HttpError(400, 'Chỉ chấp nhận ảnh JPEG, PNG, WEBP hoặc GIF');
    if (file.size > MAX_SIZE_BYTES) throw new HttpError(400, 'Ảnh không được vượt quá 5MB');

    const filePath = `${folder}/${Date.now()}-${randomUUID()}.${EXTENSION_BY_MIME[file.mimetype]}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, Buffer.from(file.buffer), { contentType: file.mimetype, upsert: false });
    if (error) throw error;

    return supabase.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;
};

export const deleteImageFromStorage = async (imageUrl) => {
    const publicBase = supabase.storage.from(BUCKET).getPublicUrl('').data.publicUrl.replace(/\/?$/, '/');
    if (typeof imageUrl !== 'string' || !imageUrl.startsWith(publicBase)) return;
    const filePath = decodeURIComponent(imageUrl.slice(publicBase.length).split('?')[0]);
    if (!filePath) return;

    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (error) console.error('Không xóa được ảnh cũ trên Storage:', error.message);
};

export const createUpload = () => multer({ limits: { fileSize: MAX_SIZE_BYTES, files: 2, fields: 30 } });
