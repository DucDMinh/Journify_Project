const required = (name) => {
    const value = process.env[name];
    if (!value) throw new Error(`Thiếu biến môi trường bắt buộc: ${name}`);
    return value;
};

const list = (value, fallback) =>
    (value || fallback).split(',').map((s) => s.trim()).filter(Boolean);

export const env = {
    isProduction: process.env.NODE_ENV === 'production',
    port: Number(process.env.PORT) || 8000,
    corsOrigins: list(process.env.CORS_ORIGINS, 'http://localhost:3000,http://admin.localhost:3000'),
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    supabaseUrl: required('SUPABASE_URL'),
    supabaseServiceKey: required('SUPABASE_SERVICE_KEY'),
    // Nhà cung cấp AI tương thích OpenAI (mặc định Groq). Vẫn đọc GROQ_* để không phải sửa file .env cũ.
    ai: {
        baseUrl: process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1',
        apiKey: process.env.AI_API_KEY || process.env.GROQ_API_KEY || '',
        model: process.env.AI_MODEL || process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        // Mức "suy nghĩ" của model có suy luận (low/medium/high); để trống nếu nhà cung cấp/model không hỗ trợ tham số này
        reasoningEffort: process.env.AI_REASONING_EFFORT ?? 'low',
    },
    payos: {
        clientId: process.env.PAYOS_CLIENT_ID || '',
        apiKey: process.env.PAYOS_API_KEY || '',
        checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
    },
    nominatimUserAgent: process.env.NOMINATIM_USER_AGENT || 'TravelPlanner/1.0',
    valhallaUrl: process.env.VALHALLA_URL || 'https://valhalla1.openstreetmap.de/route',
};
