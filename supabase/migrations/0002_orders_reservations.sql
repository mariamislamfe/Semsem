-- Orders and reservations submitted from the public site.
-- Visitors may only INSERT (no select/update/delete); staff read them from the
-- Supabase dashboard or a trusted server with the service-role key.

create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  -- [{ "id": "<menu_item uuid>", "name": "...", "qty": 2, "price": 25 }]
  items         jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 60),
  total         numeric(10, 2) not null check (total >= 0),
  seating       text not null check (seating in ('table', 'floor')),
  table_label   text check (char_length(table_label) <= 20),
  customer_name text check (char_length(customer_name) <= 60),
  note          text check (char_length(note) <= 300),
  status        text not null default 'new' check (status in ('new', 'preparing', 'served', 'cancelled')),
  created_at    timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);

create table public.reservations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 60),
  phone         text not null check (phone ~ '^[0-9+ ]{7,20}$'),
  party_size    integer not null check (party_size between 1 and 40),
  seating       text not null check (seating in ('table', 'floor', 'any')),
  reserved_for  timestamptz not null,
  note          text check (char_length(note) <= 300),
  status        text not null default 'new' check (status in ('new', 'confirmed', 'declined')),
  created_at    timestamptz not null default now()
);
create index reservations_for_idx on public.reservations (reserved_for);

alter table public.orders       enable row level security;
alter table public.reservations enable row level security;

create policy "public can place orders"
  on public.orders for insert
  to anon, authenticated
  with check (status = 'new');

create policy "public can request reservations"
  on public.reservations for insert
  to anon, authenticated
  with check (status = 'new');
