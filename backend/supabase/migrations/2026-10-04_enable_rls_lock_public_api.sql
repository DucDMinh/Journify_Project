alter table public.users enable row level security;
alter table public.provinces enable row level security;
alter table public.locations enable row level security;
alter table public.itineraries enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.itinerary_locations enable row level security;
alter table public.itinerary_provinces enable row level security;
alter table public.blogs enable row level security;
alter table public.blog_comments enable row level security;
alter table public.blog_likes enable row level security;
alter table public.orders enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
