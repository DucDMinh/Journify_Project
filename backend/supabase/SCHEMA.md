# Schema Supabase (public)

File này được sinh tự động từ PostgREST OpenAPI của project Supabase đang liên kết (`scripts/export-schema.mjs`).
Nó mô tả bảng/cột/khóa ngoại để tái lập cấu trúc dữ liệu. **Thân của các function RPC không nằm trong đây** -
hãy chạy `supabase db dump --linked --schema public -f supabase/schema.sql` (cần Docker) để lấy bản SQL đầy đủ.

## blog_comments

| Cột | Kiểu | Bắt buộc | Mặc định | Ghi chú |
|---|---|---|---|---|
| id | uuid | có | gen_random_uuid() | PK |
| created_at | timestamp with time zone | có | now() |  |
| blog_id | uuid |  |  | FK -> blogs.id |
| user_id | uuid |  |  | FK -> users.id |
| content | text |  |  |  |

## blog_likes

| Cột | Kiểu | Bắt buộc | Mặc định | Ghi chú |
|---|---|---|---|---|
| id | uuid | có | gen_random_uuid() | PK |
| created_at | timestamp with time zone | có | now() |  |
| user_id | uuid |  |  | FK -> users.id |
| blog_id | uuid |  |  | FK -> blogs.id |

## blogs

| Cột | Kiểu | Bắt buộc | Mặc định | Ghi chú |
|---|---|---|---|---|
| id | uuid | có | gen_random_uuid() | PK |
| created_at | timestamp with time zone | có | now() |  |
| blog_image | text |  |  |  |
| likes | integer |  | 0 |  |
| comments | integer |  | 0 |  |
| shares | integer |  | 0 |  |
| content | text |  |  |  |
| location | text |  |  |  |
| user_id | uuid |  |  | FK -> users.id |
| emotion | text |  |  |  |

## itineraries

| Cột | Kiểu | Bắt buộc | Mặc định | Ghi chú |
|---|---|---|---|---|
| id | uuid | có | gen_random_uuid() | PK |
| title | text |  |  |  |
| summary | text |  |  |  |
| days | integer | có | 1 |  |
| nights | integer | có | 0 |  |
| estimated_cost | numeric |  | 0 |  |
| theme | text |  |  |  |
| image_url | text |  |  |  |
| created_at | timestamp with time zone | có | timezone('utc'::text, now()) |  |
| start_date | date |  |  |  |
| end_date | date |  |  |  |
| share | boolean |  |  |  |
| user_id | uuid |  |  | FK -> users.id |
| cloned_from_id | uuid |  |  | FK -> itineraries.id |

## itinerary_days

| Cột | Kiểu | Bắt buộc | Mặc định | Ghi chú |
|---|---|---|---|---|
| id | uuid | có | gen_random_uuid() | PK |
| itinerary_id | uuid |  |  | FK -> itineraries.id |
| day_number | integer | có |  |  |
| title | text | có |  |  |
| created_at | timestamp with time zone | có | timezone('utc'::text, now()) |  |

## itinerary_locations

| Cột | Kiểu | Bắt buộc | Mặc định | Ghi chú |
|---|---|---|---|---|
| id | uuid | có | gen_random_uuid() | PK |
| day_id | uuid |  |  | FK -> itinerary_days.id |
| location_id | uuid |  |  | FK -> locations.id |
| sequence_order | integer | có |  |  |
| activity_note | text |  |  |  |
| cost | numeric |  | 0 |  |
| created_at | timestamp with time zone | có | timezone('utc'::text, now()) |  |
| start_time | time without time zone |  |  |  |
| end_time | time without time zone |  |  |  |
| location_name | text |  |  |  |
| lat | double precision |  |  |  |
| lng | double precision |  |  |  |

## itinerary_provinces

| Cột | Kiểu | Bắt buộc | Mặc định | Ghi chú |
|---|---|---|---|---|
| itinerary_id | uuid | có |  | FK -> itineraries.id, PK |
| province_id | uuid | có |  | FK -> provinces.id, PK |

## locations

| Cột | Kiểu | Bắt buộc | Mặc định | Ghi chú |
|---|---|---|---|---|
| id | uuid | có | gen_random_uuid() | PK |
| name | text | có |  |  |
| lat | double precision |  |  |  |
| lng | double precision |  |  |  |
| img | text |  |  |  |
| description | text |  |  |  |
| difficulty_level | text |  |  |  |
| rating | numeric |  |  |  |
| created_at | timestamp with time zone |  | timezone('utc'::text, now()) |  |
| province_id | uuid |  |  | FK -> provinces.id |
| note | text |  |  |  |
| saved_count | integer |  | 0 |  |

## orders

| Cột | Kiểu | Bắt buộc | Mặc định | Ghi chú |
|---|---|---|---|---|
| id | uuid | có | gen_random_uuid() | PK |
| created_at | timestamp with time zone | có | now() |  |
| status | text | có | PENDING |  |
| user_id | uuid |  |  | FK -> users.id |
| amount | real |  | 0 |  |
| order_code | integer |  |  |  |
| description | text |  |  |  |
| counterAccountNumber | text |  |  |  |

## provinces

| Cột | Kiểu | Bắt buộc | Mặc định | Ghi chú |
|---|---|---|---|---|
| id | uuid | có | gen_random_uuid() | PK |
| name | character varying | có |  |  |
| description | text |  |  |  |
| best_time_to_visit | character varying |  |  |  |
| height | integer |  |  |  |
| created_at | timestamp with time zone |  | now() |  |
| updated_at | timestamp with time zone |  | now() |  |
| image_url | text |  |  |  |

## users

| Cột | Kiểu | Bắt buộc | Mặc định | Ghi chú |
|---|---|---|---|---|
| id | uuid | có | gen_random_uuid() | PK |
| name | text | có |  |  |
| email | text | có |  |  |
| password_hash | text | có |  |  |
| created_at | timestamp with time zone |  | timezone('utc'::text, now()) |  |
| avatar | text |  |  |  |
| phone_number | integer |  |  |  |
| role | text | có |  |  |
| status | text |  | active |  |
| background_image | text |  |  |  |
| is_premium | boolean |  | false |  |

## Function RPC (gọi qua `supabase.rpc`)

- `create_full_itinerary(payload: jsonb)`
- `get_trending_itineraries_weekly()`
- `like_blog(p_blog_id: uuid, p_user_id: uuid)`
- `unlike_blog(p_blog_id: uuid, p_user_id: uuid)`
- `update_full_itinerary(p_id: uuid, payload: jsonb)`

Các function trên được backend dùng tại: `create_full_itinerary`/`update_full_itinerary` (itineraryRepository),
`get_trending_itineraries_weekly` (itineraryRepository.getTrending), `like_blog`/`unlike_blog` (blogRepository).
