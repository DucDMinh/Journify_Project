# Journify – Nền tảng lập kế hoạch du lịch Việt Nam

Đồ án tốt nghiệp. Ứng dụng cho phép người dùng xây dựng lộ trình du lịch theo ngày (kéo-thả địa điểm, bản đồ),
tạo lộ trình tự động bằng AI dựa trên dữ liệu địa điểm thật trong hệ thống, chia sẻ lộ trình/blog với cộng đồng
và nâng cấp Premium qua PayOS. Có khu vực quản trị riêng cho admin.

## Kiến trúc

```
backend/   Koa 3 + Supabase (Postgres, Storage) – REST API, JWT, PayOS, Groq AI
frontend/  Next.js 16 (App Router) + React 19 + Tailwind – 2 khu vực: /user và /admin
```

### Backend (`backend/src`)

| Thư mục | Vai trò |
|---|---|
| `routes/` | Khai báo endpoint + middleware (auth, upload) cho từng domain |
| `controllers/` | Nhận request, whitelist trường đầu vào, kiểm tra quyền, trả response |
| `services/` | Nghiệp vụ phức tạp: `aiService` (planner 2 tầng), `paymentService` (PayOS + webhook), `mapService` |
| `repositories/` | Truy vấn Supabase; contract thống nhất: trả dữ liệu, `throw` khi lỗi |
| `middleware/` | `errorHandler` (bắt lỗi tập trung), `verifyToken` / `optionalAuth` / `requireAdmin` / `requirePremium` |
| `helpers/` | `response.ok/created`, `auth` (hash/sign token), `object.pick`, upload Storage |
| `config/` | `env.js` (đọc và validate biến môi trường), Supabase client |

Mọi response có dạng `{ success, message?, data, ...extra }`; lỗi có dạng `{ success: false, message, code? }`.

### Frontend (`frontend/src`)

- `proxy.ts` – phân luồng theo host: `admin.localhost` → `/admin/*` (bắt buộc role ADMIN), host thường → `/user/*`; xác thực cookie JWT tại edge.
- `lib/apiClient.ts` – wrapper `fetch` duy nhất, tự gắn Bearer token, generic theo kiểu dữ liệu trả về.
- `hooks/` – logic màn hình tách khỏi UI (`useItineraryBuilder`, `useItinerarySetup`, `useLocationsAdmin`, `AuthContext`).
- `interface.ts` – kiểu dữ liệu domain dùng chung.
- `utils/` – hàm thuần (`googleMaps.ts`, `text.ts`), Supabase client chỉ dùng cho Realtime.

## Chạy dự án

Yêu cầu: Node.js ≥ 20, một project Supabase (schema xem `backend/supabase/SCHEMA.md`), tài khoản Groq và PayOS.

```bash
# 1. Backend
cd backend
cp .env.example .env        # điền SUPABASE_*, JWT_SECRET, GROQ_API_KEY, PAYOS_*
npm install
npm run dev                 # http://localhost:8000

# 2. Frontend
cd frontend
cp .env.example .env        # JWT_SECRET phải trùng với backend
npm install
npm run dev                 # http://localhost:3000 (user) và http://admin.localhost:3000 (admin)
```

`admin.localhost` được trình duyệt hiện đại tự trỏ về 127.0.0.1; nếu không, thêm dòng `127.0.0.1 admin.localhost` vào file hosts.

Webhook PayOS cần URL công khai trỏ tới `POST /payments/webhook` (dùng ngrok khi chạy local).

## API chính

| Method | Endpoint | Quyền | Ghi chú |
|---|---|---|---|
| POST | `/auth/register`, `/auth/login` | public | Trả `token` + `user` |
| GET | `/auth/refresh-token` | user | Cấp token mới (sau khi lên Premium) |
| GET | `/provinces`, `/provinces/:id`, `/locations` | public | `/locations` phân trang: `page, limit, search, province_id, trending` |
| POST/PATCH/DELETE | `/provinces`, `/locations` | admin | multipart, ảnh ở field `image` |
| GET | `/itineraries` | public/admin | Public chỉ thấy `share=true`; admin thấy tất cả; `?trending=weekly` |
| GET | `/itineraries/me` | user | Lộ trình của tôi |
| POST/PATCH/DELETE | `/itineraries` | chủ sở hữu hoặc admin | JSON; `user_id` lấy từ token |
| GET/POST/PATCH/DELETE | `/blogs`, `/blogs/:id/like`, `/unlike` | user (sửa/xóa: chủ sở hữu) | |
| POST | `/ai/planner` | premium | `{ prompt, days_count }` |
| POST | `/payments/premium` | user | `{ planId: 1\|3\|6\|12, returnUrl }` – giá do server quyết định |
| POST | `/payments/webhook` | PayOS | Xác thực chữ ký, idempotent |
| GET | `/orders` | admin | PATCH `/orders/:id` – user chỉ được hủy đơn PENDING của mình |
| GET | `/users` | admin | `/users/:id` – chính chủ hoặc admin |
| GET | `/map/extract`, `/map/province-from-coords` | admin | Chỉ chấp nhận link Google Maps |

## Kiểm thử

```bash
cd frontend
npx tsc --noEmit && npm run lint      # kiểu + lint (0 lỗi)
npm run build                         # build production
CYPRESS_TEST_USER_EMAIL=... CYPRESS_TEST_USER_PASSWORD=... npx cypress run   # E2E đăng nhập
```

## Cơ sở dữ liệu

`backend/supabase/SCHEMA.md` mô tả bảng, cột, khóa ngoại và danh sách RPC (sinh bằng `node scripts/export-schema.mjs supabase/SCHEMA.md`).
Để có bản SQL đầy đủ (kể cả thân function RPC), chạy `supabase db dump --linked --schema public -f supabase/schema.sql` (cần Docker Desktop).

## Bảo mật – các nguyên tắc đã áp dụng

- Mọi trường ghi vào DB đều qua whitelist (`pick`); `user_id`, giá tiền, quyền không bao giờ lấy từ body.
- Kiểm tra chủ sở hữu (`isOwnerOrAdmin`) cho itinerary, blog, order, user.
- CORS chỉ cho origin trong `CORS_ORIGINS`; lỗi 5xx không lộ chi tiết khi `NODE_ENV=production`.
- Upload ảnh giới hạn MIME và 5MB; endpoint scrape chỉ nhận domain Google Maps (chống SSRF).
