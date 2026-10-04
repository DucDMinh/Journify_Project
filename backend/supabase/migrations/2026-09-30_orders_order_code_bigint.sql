alter table public.orders alter column order_code type bigint;
create unique index if not exists orders_order_code_key on public.orders (order_code);
