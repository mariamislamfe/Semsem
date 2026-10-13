-- Semsem — initial schema
-- Run with the Supabase CLI (`supabase db push`) or paste into the SQL editor.

create extension if not exists "pgcrypto";

-- Shared trigger to keep updated_at fresh -----------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Categories -----------------------------------------------------------------
create table public.menu_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_ar     text not null check (char_length(name_ar) between 1 and 80),
  name_en     text,
  blurb_ar    text,
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index menu_categories_sort_idx on public.menu_categories (sort_order);

-- Items ----------------------------------------------------------------------
create table public.menu_items (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid not null references public.menu_categories (id) on delete cascade,
  name_ar         text not null check (char_length(name_ar) between 1 and 120),
  name_en         text,
  description_ar  text,
  -- NULL = price not announced yet. EGP, two decimals.
  price           numeric(10, 2) check (price is null or price >= 0),
  image_url       text,
  sort_order      integer not null default 0,
  is_available    boolean not null default true,
  tags            text[] not null default '{}',
  -- Flags placeholder rows so they are never mistaken for the real menu.
  is_demo         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index menu_items_category_sort_idx on public.menu_items (category_id, sort_order);
create index menu_items_tags_idx on public.menu_items using gin (tags);

-- Settings (key/value, JSON) ---------------------------------------------------
-- Keys read by the site: menuIsSample, locationText, mapsUrl, hoursText,
-- phone, whatsapp, instagram. Values are JSON (strings, booleans or null).
create table public.site_settings (
  key         text primary key,
  value       jsonb,
  updated_at  timestamptz not null default now()
);

-- updated_at triggers ----------------------------------------------------------
create trigger menu_categories_updated before update on public.menu_categories
  for each row execute function public.set_updated_at();
create trigger menu_items_updated before update on public.menu_items
  for each row execute function public.set_updated_at();
create trigger site_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

-- Row Level Security -------------------------------------------------------------
-- Visitors (anon/authenticated) may only READ. All writes go through the
-- Supabase dashboard or a trusted server using the service-role key, which
-- bypasses RLS and must never be shipped to the browser.
alter table public.menu_categories enable row level security;
alter table public.menu_items      enable row level security;
alter table public.site_settings   enable row level security;

create policy "public read visible categories"
  on public.menu_categories for select
  to anon, authenticated
  using (is_visible);

create policy "public read items of visible categories"
  on public.menu_items for select
  to anon, authenticated
  using (exists (
    select 1 from public.menu_categories c
    where c.id = menu_items.category_id and c.is_visible
  ));

create policy "public read settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

-- Storage bucket for dish photography (public read) ---------------------------------
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;
