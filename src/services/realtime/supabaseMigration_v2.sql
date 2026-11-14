-- ==========================================================
-- AURA STUDIO: SAFE NON-DESTRUCTIVE MIGRATION V1 -> V2
-- ==========================================================
-- Preserves all existing aura_rooms, aura_room_state, and aura_room_members rows.
-- Backfills any orphan aura_room_state rows into aura_rooms before enforcing FK integrity.

begin;

-- 1. Backfill missing parent rows in aura_rooms if any legacy state rows exist without parents
insert into public.aura_rooms (id, name, owner_id, owner_name, created_at, updated_at, status)
select
  s.room_id,
  coalesce(nullif(s.room_name, ''), 'AURA Listening Room'),
  s.owner_id,
  coalesce(nullif(s.owner_name, ''), 'Host'),
  s.updated_at,
  s.updated_at,
  'active'
from public.aura_room_state s
where not exists (
  select 1 from public.aura_rooms r where r.id = s.room_id
);

-- 2. Add moderation bans table if not already present
create table if not exists public.aura_room_bans (
  room_id text references public.aura_rooms(id) on delete cascade,
  participant_id text not null,
  banned_at bigint not null,
  primary key (room_id, participant_id)
);

-- 3. Install helper functions
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

-- 4. Enable RLS & replace legacy permissive policies
alter table public.aura_rooms enable row level security;
alter table public.aura_room_state enable row level security;
alter table public.aura_room_members enable row level security;
alter table public.aura_room_bans enable row level security;

drop policy if exists "Allow public read of aura_rooms" on public.aura_rooms;
drop policy if exists "Allow public insert of aura_rooms" on public.aura_rooms;
drop policy if exists "Allow public update of aura_rooms" on public.aura_rooms;
drop policy if exists "Allow public read of aura_room_state" on public.aura_room_state;
drop policy if exists "Allow public insert of aura_room_state" on public.aura_room_state;
drop policy if exists "Allow public update of aura_room_state" on public.aura_room_state;
drop policy if exists "Allow public read of aura_room_members" on public.aura_room_members;
drop policy if exists "Allow public insert of aura_room_members" on public.aura_room_members;
drop policy if exists "Allow public update of aura_room_members" on public.aura_room_members;

drop policy if exists "aura_rooms_select_authenticated" on public.aura_rooms;
drop policy if exists "aura_rooms_insert_owner" on public.aura_rooms;
drop policy if exists "aura_rooms_update_owner" on public.aura_rooms;
drop policy if exists "aura_rooms_delete_owner" on public.aura_rooms;

create policy "aura_rooms_select_authenticated"
  on public.aura_rooms for select
  using (auth.uid() is not null and not public.is_aura_room_banned(id));

create policy "aura_rooms_insert_owner"
  on public.aura_rooms for insert
  with check (auth.uid() is not null and owner_id = auth.uid()::text);

create policy "aura_rooms_update_owner"
  on public.aura_rooms for update
  using (owner_id = auth.uid()::text)
  with check (owner_id = auth.uid()::text);

create policy "aura_rooms_delete_owner"
  on public.aura_rooms for delete
  using (owner_id = auth.uid()::text);

drop policy if exists "aura_room_state_select_member_or_owner" on public.aura_room_state;
drop policy if exists "aura_room_state_insert_owner" on public.aura_room_state;
drop policy if exists "aura_room_state_update_owner" on public.aura_room_state;

create policy "aura_room_state_select_member_or_owner"
  on public.aura_room_state for select
  using (
    auth.uid() is not null
    and not public.is_aura_room_banned(room_id)
    and (public.is_aura_room_member(room_id) or public.is_aura_room_owner(room_id))
  );

create policy "aura_room_state_insert_owner"
  on public.aura_room_state for insert
  with check (public.is_aura_room_owner(room_id));

create policy "aura_room_state_update_owner"
  on public.aura_room_state for update
  using (public.is_aura_room_owner(room_id))
  with check (public.is_aura_room_owner(room_id));

drop policy if exists "aura_room_members_select_member_or_owner" on public.aura_room_members;
drop policy if exists "aura_room_members_insert_self" on public.aura_room_members;
drop policy if exists "aura_room_members_update_self" on public.aura_room_members;
drop policy if exists "aura_room_members_delete_self_or_owner" on public.aura_room_members;

create policy "aura_room_members_select_member_or_owner"
  on public.aura_room_members for select
  using (
    auth.uid() is not null
    and (
      participant_id = auth.uid()::text
      or public.is_aura_room_member(room_id)
      or public.is_aura_room_owner(room_id)
    )
  );

create policy "aura_room_members_insert_self"
  on public.aura_room_members for insert
  with check (
    auth.uid() is not null
    and participant_id = auth.uid()::text
    and not public.is_aura_room_banned(room_id)
  );

create policy "aura_room_members_update_self"
  on public.aura_room_members for update
  using (participant_id = auth.uid()::text)
  with check (participant_id = auth.uid()::text);

create policy "aura_room_members_delete_self_or_owner"
  on public.aura_room_members for delete
  using (participant_id = auth.uid()::text or public.is_aura_room_owner(room_id));

drop policy if exists "aura_room_bans_select" on public.aura_room_bans;
drop policy if exists "aura_room_bans_insert_owner" on public.aura_room_bans;
drop policy if exists "aura_room_bans_delete_owner" on public.aura_room_bans;

create policy "aura_room_bans_select"
  on public.aura_room_bans for select
  using (participant_id = auth.uid()::text or public.is_aura_room_owner(room_id));

create policy "aura_room_bans_insert_owner"
  on public.aura_room_bans for insert
  with check (public.is_aura_room_owner(room_id) and participant_id <> auth.uid()::text);

create policy "aura_room_bans_delete_owner"
  on public.aura_room_bans for delete
  using (public.is_aura_room_owner(room_id));

commit;
