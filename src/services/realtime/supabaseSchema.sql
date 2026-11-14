-- ==========================================================
-- AURA STUDIO: LISTEN TOGETHER — SUPABASE SCHEMA V2 (SCOPED RLS)
-- ==========================================================
-- Requires Supabase Anonymous or Authenticated Auth enabled so auth.uid()
-- identifies each participant cleanly on the server.
-- Safe, idempotent setup script.

-- 1. Rooms Table
create table if not exists aura_rooms (
  id text primary key,
  name text not null,
  owner_id text not null,
  owner_name text not null,
  created_at bigint not null,
  updated_at bigint not null,
  status text not null default 'active'
);

-- 2. Room State Table (Authoritative snapshot; FK references aura_rooms(id))
create table if not exists aura_room_state (
  room_id text primary key references aura_rooms(id) on delete cascade,
  room_name text not null default 'AURA Room',
  owner_id text not null default '',
  owner_name text not null default '',
  current_track jsonb,
  queue jsonb not null default '[]'::jsonb,
  is_playing boolean not null default false,
  position double precision not null default 0,
  playback_rate double precision not null default 1,
  updated_at bigint not null,
  version bigint not null default 1,
  last_action jsonb
);

-- 3. Room Members Table
create table if not exists aura_room_members (
  room_id text references aura_rooms(id) on delete cascade,
  participant_id text not null,
  display_name text not null,
  joined_at bigint not null,
  last_seen bigint not null,
  primary key (room_id, participant_id)
);

-- 4. Room Bans Table (Host Moderation)
create table if not exists aura_room_bans (
  room_id text references aura_rooms(id) on delete cascade,
  participant_id text not null,
  banned_at bigint not null,
  primary key (room_id, participant_id)
);

-- 5. Helper SECURITY DEFINER functions (avoids infinite RLS recursion)
create or replace function public.is_aura_room_owner(p_room_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.aura_rooms r
    where r.id = p_room_id and r.owner_id = auth.uid()::text
  );
$$;

create or replace function public.is_aura_room_member(p_room_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.aura_room_members m
    where m.room_id = p_room_id and m.participant_id = auth.uid()::text
  );
$$;

create or replace function public.is_aura_room_banned(p_room_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.aura_room_bans b
    where b.room_id = p_room_id and b.participant_id = auth.uid()::text
  );
$$;

-- 6. Scoped Row Level Security (RLS)
alter table aura_rooms enable row level security;
alter table aura_room_state enable row level security;
alter table aura_room_members enable row level security;
alter table aura_room_bans enable row level security;

-- Drop any legacy unrestricted policies safely
drop policy if exists "Allow public read of aura_rooms" on aura_rooms;
drop policy if exists "Allow public insert of aura_rooms" on aura_rooms;
drop policy if exists "Allow public update of aura_rooms" on aura_rooms;
drop policy if exists "Allow public read of aura_room_state" on aura_room_state;
drop policy if exists "Allow public insert of aura_room_state" on aura_room_state;
drop policy if exists "Allow public update of aura_room_state" on aura_room_state;
drop policy if exists "Allow public read of aura_room_members" on aura_room_members;
drop policy if exists "Allow public insert of aura_room_members" on aura_room_members;
drop policy if exists "Allow public update of aura_room_members" on aura_room_members;

-- aura_rooms policies
create policy "aura_rooms_select_authenticated"
  on aura_rooms for select
  using (auth.uid() is not null and not public.is_aura_room_banned(id));

create policy "aura_rooms_insert_owner"
  on aura_rooms for insert
  with check (auth.uid() is not null and owner_id = auth.uid()::text);

create policy "aura_rooms_update_owner"
  on aura_rooms for update
  using (owner_id = auth.uid()::text)
  with check (owner_id = auth.uid()::text);

create policy "aura_rooms_delete_owner"
  on aura_rooms for delete
  using (owner_id = auth.uid()::text);

-- aura_room_state policies (Host-authoritative writes; members can read)
create policy "aura_room_state_select_member_or_owner"
  on aura_room_state for select
  using (
    auth.uid() is not null
    and not public.is_aura_room_banned(room_id)
    and (public.is_aura_room_member(room_id) or public.is_aura_room_owner(room_id))
  );

create policy "aura_room_state_insert_owner"
  on aura_room_state for insert
  with check (public.is_aura_room_owner(room_id));

create policy "aura_room_state_update_owner"
  on aura_room_state for update
  using (public.is_aura_room_owner(room_id))
  with check (public.is_aura_room_owner(room_id));

-- aura_room_members policies
create policy "aura_room_members_select_member_or_owner"
  on aura_room_members for select
  using (
    auth.uid() is not null
    and (
      participant_id = auth.uid()::text
      or public.is_aura_room_member(room_id)
      or public.is_aura_room_owner(room_id)
    )
  );

create policy "aura_room_members_insert_self"
  on aura_room_members for insert
  with check (
    auth.uid() is not null
    and participant_id = auth.uid()::text
    and not public.is_aura_room_banned(room_id)
  );

create policy "aura_room_members_update_self"
  on aura_room_members for update
  using (participant_id = auth.uid()::text)
  with check (participant_id = auth.uid()::text);

create policy "aura_room_members_delete_self_or_owner"
  on aura_room_members for delete
  using (participant_id = auth.uid()::text or public.is_aura_room_owner(room_id));

-- aura_room_bans policies (Host-only moderation + self check)
create policy "aura_room_bans_select"
  on aura_room_bans for select
  using (participant_id = auth.uid()::text or public.is_aura_room_owner(room_id));

create policy "aura_room_bans_insert_owner"
  on aura_room_bans for insert
  with check (public.is_aura_room_owner(room_id) and participant_id <> auth.uid()::text);

create policy "aura_room_bans_delete_owner"
  on aura_room_bans for delete
  using (public.is_aura_room_owner(room_id));

-- 7. Realtime Publications (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'aura_rooms'
  ) then
    alter publication supabase_realtime add table aura_rooms;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'aura_room_state'
  ) then
    alter publication supabase_realtime add table aura_room_state;
  end if;
end $$;
