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
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    payos: {
        clientId: process.env.PAYOS_CLIENT_ID || '',
        apiKey: process.env.PAYOS_API_KEY || '',
        checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
    },
    nominatimUserAgent: process.env.NOMINATIM_USER_AGENT || 'TravelPlanner/1.0',
};
