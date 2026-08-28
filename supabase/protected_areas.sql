-- Protected water areas for environmental routing.
-- Starter dataset with APPROXIMATE positions/extents — always verify against
-- official charts and Länsstyrelsen. Not for navigation.

create table if not exists public.protected_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in (
    'bird_protection', 'seal_protection', 'natura2000',
    'nature_reserve', 'no_anchor', 'speed_limit'
  )),
  latitude double precision not null,
  longitude double precision not null,
  radius_m integer not null default 1000,
  season_start text, -- 'MM-DD', null = year-round
  season_end text,
  restriction text
);

alter table public.protected_areas enable row level security;
drop policy if exists "Protected areas are public" on public.protected_areas;
create policy "Protected areas are public" on public.protected_areas
  for select using (true);

insert into public.protected_areas
  (name, kind, latitude, longitude, radius_m, season_start, season_end, restriction) values
  ('Svenska Högarna naturreservat', 'natura2000', 59.443, 19.503, 6000, null, null, 'Känsligt ytterskärgårdsområde'),
  ('Stora Nassa fågelskyddsområde', 'bird_protection', 59.452, 19.052, 2500, '02-01', '08-15', 'Tillträdesförbud under häckning'),
  ('Bullerö naturreservat', 'nature_reserve', 59.252, 18.952, 4000, null, null, 'Visa hänsyn, begränsad framfart'),
  ('Gillöga sälskyddsområde', 'seal_protection', 59.503, 19.303, 2000, null, null, 'Tillträdesförbud året runt'),
  ('Nåttarö fågelskyddsområde', 'bird_protection', 58.872, 18.132, 1500, '02-01', '08-15', 'Tillträdesförbud under häckning'),
  ('Huvudskär naturreservat', 'nature_reserve', 58.963, 18.572, 2000, null, null, 'Visa hänsyn'),
  ('Långviksskär naturreservat', 'nature_reserve', 59.303, 19.103, 2500, null, null, 'Visa hänsyn'),
  ('Ängsö nationalpark', 'natura2000', 59.523, 18.803, 1500, null, null, 'Nationalpark — särskilda regler'),
  ('Fjärdlång naturreservat', 'nature_reserve', 59.052, 18.552, 2500, null, null, 'Visa hänsyn'),
  ('Gullmarn ålgräsäng', 'no_anchor', 58.323, 11.553, 1500, null, null, 'Undvik ankring — känslig ålgräsbotten'),
  ('Kosterhavets nationalpark', 'natura2000', 58.952, 11.052, 8000, null, null, 'Nationalpark — särskilda regler'),
  ('Vaxholms sund fartbegränsning', 'speed_limit', 59.402, 18.332, 800, null, null, 'Max 5 knop')
on conflict do nothing;
