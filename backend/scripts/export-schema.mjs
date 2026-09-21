import 'dotenv/config';
import { writeFileSync } from 'node:fs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
const res = await fetch(url + '/rest/v1/', { headers: { apikey: key, Authorization: 'Bearer ' + key } });
const spec = await res.json();
const defs = spec.definitions || {};

const fkPattern = /Foreign Key to `([^`]+)`/;
const lines = [];
lines.push('# Schema Supabase (public)');
lines.push('');
lines.push('File này được sinh tự động từ PostgREST OpenAPI của project Supabase đang liên kết (`scripts/export-schema.mjs`).');
lines.push('Nó mô tả bảng/cột/khóa ngoại để tái lập cấu trúc dữ liệu. **Thân của các function RPC không nằm trong đây** -');
lines.push('hãy chạy `supabase db dump --linked --schema public -f supabase/schema.sql` (cần Docker) để lấy bản SQL đầy đủ.');
lines.push('');

for (const [table, def] of Object.entries(defs).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`## ${table}`);
    lines.push('');
    lines.push('| Cột | Kiểu | Bắt buộc | Mặc định | Ghi chú |');
    lines.push('|---|---|---|---|---|');
    const required = new Set(def.required || []);
    for (const [col, meta] of Object.entries(def.properties || {})) {
        const notes = [];
        const fk = meta.description?.match(fkPattern);
        if (fk) notes.push(`FK -> ${fk[1]}`);
        if (meta.description?.includes('Primary Key')) notes.push('PK');
        lines.push(`| ${col} | ${meta.format || meta.type} | ${required.has(col) ? 'có' : ''} | ${meta.default ?? ''} | ${notes.join(', ')} |`);
    }
    lines.push('');
}

lines.push('## Function RPC (gọi qua `supabase.rpc`)');
lines.push('');
for (const [path, ops] of Object.entries(spec.paths).filter(([p]) => p.startsWith('/rpc/')).sort()) {
    const name = path.replace('/rpc/', '');
    const post = ops.post || {};
    const body = (post.parameters || []).find((p) => p.in === 'body');
    const params = body?.schema?.properties ? Object.entries(body.schema.properties).map(([k, v]) => `${k}: ${v.format || v.type}`).join(', ') : '';
    lines.push(`- \`${name}(${params})\`${post.summary ? ' — ' + post.summary : ''}`);
}
lines.push('');
lines.push('Các function trên được backend dùng tại: `create_full_itinerary`/`update_full_itinerary` (itineraryRepository),');
lines.push('`get_trending_itineraries_weekly` (itineraryRepository.getTrending), `like_blog`/`unlike_blog` (blogRepository).');

writeFileSync(process.argv[2], lines.join('\n') + '\n', 'utf8');
console.log('written', process.argv[2], Object.keys(defs).length, 'tables');
