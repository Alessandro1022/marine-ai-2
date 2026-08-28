-- =====================================================
-- Empire Marine AI — Database schema
-- © Aetos Systems
-- Run this in Supabase SQL Editor (one time)
-- =====================================================

-- ---------- PROFILES (users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null,
  language text not null default 'sv' check (language in ('sv', 'en')),
  subscription_plan text not null default 'free' check (subscription_plan in ('free', 'pro', 'premium')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- BOATS ----------
create table if not exists public.boats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  boat_type text not null check (boat_type in ('motorboat', 'sailboat', 'fishing_boat', 'pwc')),
  manufacturer text,
  model text,
  year int,
  engine_type text,
  fuel_capacity_liters numeric,
  cruise_speed_knots numeric,
  fuel_level_percent numeric not null default 100,
  notes text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.boats enable row level security;
create policy "Users manage own boats" on public.boats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- TRIPS (logbook) ----------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  boat_id uuid references public.boats(id) on delete set null,
  trip_date date not null default current_date,
  start_location text not null,
  destination text not null,
  distance_nm numeric,
  duration_minutes int,
  fuel_used_liters numeric,
  weather_summary text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.trips enable row level security;
create policy "Users manage own trips" on public.trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- MAINTENANCE ----------
create table if not exists public.maintenance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  boat_id uuid references public.boats(id) on delete cascade,
  maintenance_type text not null check (maintenance_type in (
    'oil_change', 'engine_service', 'battery_replacement',
    'impeller_replacement', 'hull_cleaning', 'winter_storage', 'other'
  )),
  title text not null,
  due_date date,
  completed_at timestamptz,
  notes text,
  remind boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.maintenance enable row level security;
create policy "Users manage own maintenance" on public.maintenance
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- MARINAS (public read, admin write) ----------
create table if not exists public.marinas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  has_fuel boolean not null default false,
  has_restaurant boolean not null default false,
  has_electricity boolean not null default false,
  is_guest_harbor boolean not null default false,
  has_water boolean not null default false,
  has_wifi boolean not null default false,
  region text
);

alter table public.marinas enable row level security;
create policy "Marinas are public" on public.marinas
  for select using (true);

-- ---------- FAVORITE MARINAS ----------
create table if not exists public.favorite_marinas (
  user_id uuid not null references auth.users(id) on delete cascade,
  marina_id uuid not null references public.marinas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, marina_id)
);

alter table public.favorite_marinas enable row level security;
create policy "Users manage own favorites" on public.favorite_marinas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- SAVED LOCATIONS ----------
create table if not exists public.saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  kind text not null default 'favorite' check (kind in ('favorite', 'fuel_station', 'anchorage', 'custom')),
  created_at timestamptz not null default now()
);

alter table public.saved_locations enable row level security;
create policy "Users manage own locations" on public.saved_locations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- WEATHER LOGS ----------
create table if not exists public.weather_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  payload jsonb not null,
  risk text not null check (risk in ('green', 'yellow', 'red')),
  created_at timestamptz not null default now()
);

alter table public.weather_logs enable row level security;
create policy "Users manage own weather logs" on public.weather_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- CHAT MESSAGES (AI history, private via RLS) ----------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;
create policy "Users manage own chat" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- SUBSCRIPTIONS ----------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free', 'pro', 'premium')),
  provider text, -- 'revenuecat' | 'stripe' | 'manual'
  status text not null default 'active' check (status in ('active', 'canceled', 'expired')),
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
create policy "Users read own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ---------- NOTIFICATIONS ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('maintenance', 'weather', 'safety', 'subscription', 'trip')),
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
create policy "Users manage own notifications" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- SETTINGS ----------
create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notify_maintenance boolean not null default true,
  notify_weather boolean not null default true,
  notify_safety boolean not null default true,
  notify_subscription boolean not null default true,
  notify_trips boolean not null default true,
  fuel_price_sek_per_liter numeric not null default 25,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;
create policy "Users manage own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- SEED: Swedish marinas (starter data) ----------
insert into public.marinas (name, latitude, longitude, has_fuel, has_restaurant, has_electricity, is_guest_harbor, has_water, has_wifi, region) values
  ('Sandhamn Gästhamn', 59.2890, 18.9180, true, true, true, true, true, true, 'Stockholms skärgård'),
  ('Vaxholm Gästhamn', 59.4030, 18.3510, true, true, true, true, true, false, 'Stockholms skärgård'),
  ('Nynäshamn Gästhamn', 58.9020, 17.9470, true, true, true, true, true, true, 'Stockholms skärgård'),
  ('Utö Gruvbryggan', 58.9710, 18.3190, false, true, true, true, true, false, 'Stockholms skärgård'),
  ('Grinda Gästhamn', 59.4080, 18.5640, false, true, true, true, true, false, 'Stockholms skärgård'),
  ('Arkösund Gästhamn', 58.4840, 16.9320, true, true, true, true, true, false, 'Östergötland'),
  ('Visby Gästhamn', 57.6390, 18.2880, true, true, true, true, true, true, 'Gotland'),
  ('Marstrand Gästhamn', 57.8870, 11.5870, true, true, true, true, true, true, 'Västkusten'),
  ('Smögen Gästhamn', 58.3540, 11.2270, true, true, true, true, true, true, 'Västkusten'),
  ('Käringön Gästhamn', 58.1110, 11.3680, false, true, true, true, true, false, 'Västkusten')
on conflict do nothing;
