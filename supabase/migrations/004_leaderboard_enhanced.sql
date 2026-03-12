-- ============================================
-- LEADERBOARD ENHANCEMENTS
-- Migration 004
-- ============================================

-- Add correct_picks column to brackets (updated alongside score)
alter table brackets add column if not exists correct_picks int default 0;

-- ============================================
-- LEADERBOARD SNAPSHOTS
-- Tracks rank per user per pool per round for movement indicators
-- ============================================
create table if not exists leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  pool_id uuid not null references pools(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  bracket_id uuid not null references brackets(id) on delete cascade,
  round int not null,
  score int default 0,
  correct_picks int default 0,
  rank int,
  unique(pool_id, user_id, round)
);

alter table leaderboard_snapshots enable row level security;

create policy "leaderboard_snapshots_pool_member_read" on leaderboard_snapshots
  for select using (
    user_id = auth.uid() or
    exists (select 1 from pool_members where pool_id = leaderboard_snapshots.pool_id and user_id = auth.uid())
  );

-- Admins/system can insert/update
create policy "leaderboard_snapshots_admin_write" on leaderboard_snapshots
  for all using (
    exists (select 1 from profiles where id = auth.uid() and email like '%@ufsl.net')
  );

-- ============================================
-- ENHANCED LEADERBOARD VIEW (pool-scoped)
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
  b.correct_picks,
  b.max_possible_score,
  rank() over (partition by b.pool_id order by b.score desc, b.correct_picks desc) as rank
from brackets b
join profiles p on p.id = b.user_id
where b.is_submitted = true;

-- ============================================
-- GLOBAL LEADERBOARD VIEW
-- One entry per user, aggregated across all pools
-- ============================================
create or replace view global_leaderboard as
select
  b.user_id,
  p.display_name,
  p.avatar_url,
  sum(b.score) as total_score,
  sum(b.correct_picks) as total_correct_picks,
  count(b.id) as bracket_count,
  max(b.score) as best_score,
  rank() over (order by sum(b.score) desc, sum(b.correct_picks) desc) as rank
from brackets b
join profiles p on p.id = b.user_id
where b.is_submitted = true
group by b.user_id, p.display_name, p.avatar_url;

-- ============================================
-- FUNCTION: snapshot current rankings
-- Call this after each round completes
-- ============================================
create or replace function snapshot_leaderboard(p_round int)
returns void
language plpgsql
security definer
as $$
begin
  insert into leaderboard_snapshots (pool_id, user_id, bracket_id, round, score, correct_picks, rank)
  select
    pool_id,
    user_id,
    bracket_id,
    p_round,
    score,
    correct_picks,
    rank
  from leaderboard
  on conflict (pool_id, user_id, round)
  do update set
    score = excluded.score,
    correct_picks = excluded.correct_picks,
    rank = excluded.rank;
end;
$$;
