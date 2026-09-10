-- ==========================================================
-- AURA STUDIO: LISTEN TOGETHER — SUPABASE SCHEMA V1
-- ==========================================================
-- This script configures the tables and realtime replication
-- for AURA's server-authoritative shared listening rooms.

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

-- 2. Room State Table (Authoritative snapshot)
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

-- 4. Enable Row Level Security (RLS) with permissive read/write for shared room sessions
alter table aura_rooms enable row level security;
alter table aura_room_state enable row level security;
alter table aura_room_members enable row level security;

create policy "Allow public read of aura_rooms" on aura_rooms for select using (true);
create policy "Allow public insert of aura_rooms" on aura_rooms for insert with check (true);
create policy "Allow public update of aura_rooms" on aura_rooms for update using (true);

create policy "Allow public read of aura_room_state" on aura_room_state for select using (true);
create policy "Allow public insert of aura_room_state" on aura_room_state for insert with check (true);
create policy "Allow public update of aura_room_state" on aura_room_state for update using (true);

create policy "Allow public read of aura_room_members" on aura_room_members for select using (true);
create policy "Allow public insert of aura_room_members" on aura_room_members for insert with check (true);
create policy "Allow public update of aura_room_members" on aura_room_members for update using (true);

-- 5. Enable Realtime Publications
-- Enables Supabase Realtime to broadcast changes to connected clients
alter publication supabase_realtime add table aura_rooms;
alter publication supabase_realtime add table aura_room_state;
