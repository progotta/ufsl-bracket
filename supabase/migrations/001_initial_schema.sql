-- UFSL Bracket Challenge - Database Schema
-- Run this in your Supabase SQL editor

-- ============================================
-- EXTENSIONS
-- ============================================
create extension if not exists "pgcrypto";

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate a short invite code
create or replace function generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- ============================================
-- PROFILES
-- ============================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  display_name text,
  avatar_url text,
  phone text,
  email text
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- RLS
alter table profiles enable row level security;

create policy "profiles_public_read" on profiles
  for select using (true);

create policy "profiles_own_update" on profiles
  for update using (auth.uid() = id);

-- ============================================
-- TEAMS
-- ============================================
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abbreviation text not null,
  seed int check (seed >= 1 and seed <= 16),
  region text check (region in ('East', 'West', 'South', 'Midwest')),
  logo_url text,
  primary_color text default '#1A1A1A',
  secondary_color text default '#F97316',
  is_active boolean default true
);

alter table teams enable row level security;
create policy "teams_public_read" on teams for select using (true);
create policy "teams_admin_all" on teams for all using (
  exists (select 1 from profiles where id = auth.uid() and email like '%@ufsl.net')
);

-- ============================================
-- GAMES
-- ============================================
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  round int not null check (round >= 1 and round <= 6),
  game_number int not null,
  region text check (region in ('East', 'West', 'South', 'Midwest', 'Final Four', 'Championship')),
  team1_id uuid references teams(id),
  team2_id uuid references teams(id),
  winner_id uuid references teams(id),
  team1_score int,
  team2_score int,
  scheduled_at timestamptz,
  completed_at timestamptz,
  status text default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed')),
  next_game_id uuid references games(id)
);

alter table games enable row level security;
create policy "games_public_read" on games for select using (true);
create policy "games_admin_all" on games for all using (
  exists (select 1 from profiles where id = auth.uid() and email like '%@ufsl.net')
);

-- ============================================
-- POOLS
-- ============================================
create table if not exists pools (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  name text not null,
  description text,
  commissioner_id uuid not null references profiles(id) on delete cascade,
  invite_code text unique not null default generate_invite_code(),
  is_public boolean default false,
  scoring_system jsonb default '{
    "round1": 1,
    "round2": 2,
    "round3": 4,
    "round4": 8,
    "round5": 16,
    "round6": 32
  }'::jsonb,
  locked_at timestamptz,
  status text default 'open' check (status in ('draft', 'open', 'locked', 'active', 'completed'))
);

alter table pools enable row level security;

-- Public pools visible to all; private pools only to members
create policy "pools_public_read" on pools
  for select using (is_public = true or commissioner_id = auth.uid() or
    exists (select 1 from pool_members where pool_id = pools.id and user_id = auth.uid())
  );

create policy "pools_own_insert" on pools
  for insert with check (commissioner_id = auth.uid());

create policy "pools_commissioner_update" on pools
  for update using (commissioner_id = auth.uid());

create policy "pools_commissioner_delete" on pools
  for delete using (commissioner_id = auth.uid());

-- ============================================
-- POOL MEMBERS
-- ============================================
create table if not exists pool_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  pool_id uuid not null references pools(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text default 'member' check (role in ('commissioner', 'member')),
  unique(pool_id, user_id)
);

alter table pool_members enable row level security;

create policy "pool_members_member_read" on pool_members
  for select using (
    user_id = auth.uid() or
    exists (select 1 from pool_members pm2 where pm2.pool_id = pool_members.pool_id and pm2.user_id = auth.uid())
  );

create policy "pool_members_own_insert" on pool_members
  for insert with check (user_id = auth.uid());

create policy "pool_members_commissioner_delete" on pool_members
  for delete using (
    user_id = auth.uid() or
    exists (select 1 from pools where id = pool_members.pool_id and commissioner_id = auth.uid())
  );

-- ============================================
-- BRACKETS
-- ============================================
create table if not exists brackets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  pool_id uuid not null references pools(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null default 'My Bracket',
  is_submitted boolean default false,
  score int default 0,
  max_possible_score int default 192,
  picks jsonb default '{}'::jsonb,
  unique(pool_id, user_id)
);

alter table brackets enable row level security;

create policy "brackets_pool_member_read" on brackets
  for select using (
    user_id = auth.uid() or
    exists (select 1 from pool_members where pool_id = brackets.pool_id and user_id = auth.uid())
  );

create policy "brackets_own_insert" on brackets
  for insert with check (user_id = auth.uid());

create policy "brackets_own_update" on brackets
  for update using (user_id = auth.uid());

-- ============================================
-- LEADERBOARD VIEW
-- ============================================
create or replace view leaderboard as
select
  b.pool_id,
  b.user_id,
  p.display_name,
  p.avatar_url,
  b.id as bracket_id,
  b.name as bracket_name,
  b.score,
  b.max_possible_score,
  rank() over (partition by b.pool_id order by b.score desc) as rank
from brackets b
join profiles p on p.id = b.user_id
where b.is_submitted = true;

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pools_updated_at before update on pools
  for each row execute procedure update_updated_at();

create trigger brackets_updated_at before update on brackets
  for each row execute procedure update_updated_at();

create trigger profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at();

-- ============================================
-- MOCK / SEED DATA (placeholder teams)
-- Run after schema to have data for dev
-- ============================================

-- These will be replaced with real Selection Sunday data March 16
insert into teams (name, abbreviation, seed, region, primary_color) values
  -- East Region
  ('Duke Blue Devils', 'DUKE', 1, 'East', '#012169'),
  ('Kentucky Wildcats', 'UK', 2, 'East', '#0033A0'),
  ('Gonzaga Bulldogs', 'GONZ', 3, 'East', '#002161'),
  ('Tennessee Volunteers', 'TENN', 4, 'East', '#FF8200'),
  ('Michigan State Spartans', 'MSU', 5, 'East', '#18453B'),
  ('Creighton Bluejays', 'CRE', 6, 'East', '#005CA9'),
  ('Xavier Musketeers', 'XAV', 7, 'East', '#0C2340'),
  ('Florida Atlantic Owls', 'FAU', 8, 'East', '#003366'),
  ('Memphis Tigers', 'MEM', 9, 'East', '#003087'),
  ('Utah State Aggies', 'USU', 10, 'East', '#003263'),
  ('Providence Friars', 'PROV', 11, 'East', '#002147'),
  ('Oral Roberts Golden Eagles', 'ORU', 12, 'East', '#5C2D91'),
  ('Louisiana Ragin Cajuns', 'ULL', 13, 'East', '#CE181E'),
  ('Montana State Bobcats', 'MTST', 14, 'East', '#003875'),
  ('Vermont Catamounts', 'UVM', 15, 'East', '#154734'),
  ('Howard Bison', 'HOW', 16, 'East', '#003A63'),
  -- West Region
  ('Kansas Jayhawks', 'KU', 1, 'West', '#0051A5'),
  ('Arizona Wildcats', 'ARIZ', 2, 'West', '#CC0033'),
  ('Baylor Bears', 'BAY', 3, 'West', '#1B3A5C'),
  ('Virginia Cavaliers', 'UVA', 4, 'West', '#232D4B'),
  ('San Diego State Aztecs', 'SDSU', 5, 'West', '#CC0033'),
  ('TCU Horned Frogs', 'TCU', 6, 'West', '#4D1979'),
  ('Missouri Tigers', 'MIZ', 7, 'West', '#F1B82D'),
  ('Maryland Terrapins', 'MD', 8, 'West', '#E03A3E'),
  ('West Virginia Mountaineers', 'WVU', 9, 'West', '#002855'),
  ('Utah Utes', 'UTAH', 10, 'West', '#CC0000'),
  ('NC State Wolfpack', 'NCST', 11, 'West', '#CC0000'),
  ('College of Charleston Cougars', 'COFC', 12, 'West', '#532281'),
  ('Iona Gaels', 'IONA', 13, 'West', '#7B0000'),
  ('Grand Canyon Antelopes', 'GCU', 14, 'West', '#512D6D'),
  ('UNC Asheville Bulldogs', 'UNCA', 15, 'West', '#002868'),
  ('Texas Southern Tigers', 'TXSO', 16, 'West', '#4B1869'),
  -- South Region
  ('Alabama Crimson Tide', 'ALA', 1, 'South', '#9E1B32'),
  ('Marquette Golden Eagles', 'MU', 2, 'South', '#003087'),
  ('Purdue Boilermakers', 'PUR', 3, 'South', '#CEB888'),
  ('Indiana Hoosiers', 'IND', 4, 'South', '#990000'),
  ('Miami Hurricanes', 'MIA', 5, 'South', '#005030'),
  ('Iowa State Cyclones', 'ISU', 6, 'South', '#C8102E'),
  ('Texas A&M Aggies', 'TAMU', 7, 'South', '#500000'),
  ('Iowa Hawkeyes', 'IOWA', 8, 'South', '#FFCD00'),
  ('Auburn Tigers', 'AUB', 9, 'South', '#0C2340'),
  ('Penn State Nittany Lions', 'PSU', 10, 'South', '#041E42'),
  ('Pittsburgh Panthers', 'PITT', 11, 'South', '#003594'),
  ('Drake Bulldogs', 'DRKE', 12, 'South', '#00447C'),
  ('Kent State Golden Flashes', 'KENT', 13, 'South', '#002664'),
  ('Kennesaw State Owls', 'KENN', 14, 'South', '#FDBB30'),
  ('Colgate Raiders', 'COLG', 15, 'South', '#B3222A'),
  ('Southeast Missouri State Redhawks', 'SEMO', 16, 'South', '#C8102E'),
  -- Midwest Region
  ('Houston Cougars', 'HOU', 1, 'Midwest', '#C8102E'),
  ('Texas Longhorns', 'TEX', 2, 'Midwest', '#BF5700'),
  ('Xavier Musketeers', 'XAV2', 3, 'Midwest', '#0C2340'),
  ('Indiana Hoosiers', 'IU', 4, 'Midwest', '#990000'),
  ('Miami (OH) RedHawks', 'MIOH', 5, 'Midwest', '#C3142D'),
  ('Iowa Hawkeyes', 'IOWA2', 6, 'Midwest', '#FFCD00'),
  ('Texas A&M Aggies', 'TAMU2', 7, 'Midwest', '#500000'),
  ('Arkansas Razorbacks', 'ARK', 8, 'Midwest', '#9D2235'),
  ('Illinois Fighting Illini', 'ILL', 9, 'Midwest', '#E84A27'),
  ('Penn State Nittany Lions', 'PSU2', 10, 'Midwest', '#041E42'),
  ('Arizona State Sun Devils', 'ASU', 11, 'Midwest', '#8C1D40'),
  ('VCU Rams', 'VCU', 12, 'Midwest', '#FFB300'),
  ('Furman Paladins', 'FUR', 13, 'Midwest', '#582C83'),
  ('UC Santa Barbara Gauchos', 'UCSB', 14, 'Midwest', '#003660'),
  ('Princeton Tigers', 'PRIN', 15, 'Midwest', '#FF8F00'),
  ('Northern Kentucky Norse', 'NKU', 16, 'Midwest', '#B0B7BC')
on conflict do nothing;
