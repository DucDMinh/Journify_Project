import { supabase } from '../config/supabaseClient.js';

export const uploadImageToStorage = async (file, name) => {
    try {
        if (!file || !file.buffer) {
            throw new Error("Không tìm thấy dữ liệu file hợp lệ!");
        }

        const fileExtension = file.originalname.split('.').pop();
        const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExtension}`;
        const filePath = `${name}/${uniqueFileName}`;
        const cleanBuffer = Buffer.from(file.buffer);

        const { data, error } = await supabase.storage
            .from('image')
            .upload(filePath, cleanBuffer, {
                contentType: file.mimetype,
                duplex: 'half',
                upsert: false
            });

        if (error) {
            console.error("Lỗi từ Supabase Storage:", error.message);
            throw error;
        }

        const { data: publicUrlData } = supabase.storage
            .from('image')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;

    } catch (error) {
        console.error("Lỗi chi tiết trong hàm uploadImageToStorage:", error);
        throw error;
    }
};

export const deleteImageFromStorage = async (imageUrl) => {
    if (!imageUrl) return;

    try {
        const BUCKET_NAME = 'image';
        const pathParts = imageUrl.split(`${BUCKET_NAME}/`);

        if (pathParts.length === 2) {
            const filePath = pathParts[1];
            const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

            if (error) {
                console.error("Lỗi khi xóa ảnh trên Supabase:", error.message);
            } else {
                console.log("Đã dọn dẹp ảnh cũ trên Storage thành công!");
            }
        }
    } catch (error) {
        console.error("Lỗi ở hàm deleteImageFromStorage:", error);
    }
};