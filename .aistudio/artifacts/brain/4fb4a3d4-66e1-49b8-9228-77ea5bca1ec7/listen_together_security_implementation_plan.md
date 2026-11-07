# AURA 2.0 — Phase 3.5B.3 Security Implementation Plan
## Supabase Security & Host Authorization

**Status:** Planning Review & Approval  
**Strict Planning-Only Rule:** Zero application files modified during this phase.

---

## 1. Executive Summary
AURA 2.0 Listen Together enables shared listening sessions via Supabase Realtime broadcast channels and PostgreSQL room-state persistence (`aura_room_state`). Phase 3.5B.1 and 3.5B.2 audits identified a critical security risk: **connected participants can forge authoritative room-state updates or mutate shared queues because server-side host authorization and client-payload verification are missing.**

This security implementation plan establishes a comprehensive trust boundary: migrating from client-supplied trust to server-side and database-enforced host authorization using Supabase Auth (or cryptographically validated session tokens), PostgreSQL Row Level Security (RLS) policies, and a trusted command validation architecture.

---

## 2. Current Supabase Configuration Findings
- **Client Initialization**: Initialized via `@supabase/supabase-js` in `supabaseClient.ts` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Auth Status**: Anonymous localStorage identifiers (`aura_listen_together_userid`) are currently used to establish participant identity without enforcing Supabase Auth JWT sessions or server-side authentication verification.
- **Exposure**: Frontend code currently uses the public anon key exclusively (no service-role keys are exposed in client bundles).

---

## 3. Auth and Identity Findings
- **Local Participant Identity**: Stored in `localStorage` (`aura_listen_together_userid`, `aura_listen_together_username`). Easily spoofed by any client.
- **Verified Supabase User Identity**: Not currently enforced; sessions are anonymous or unauthenticated.
- **Verified Room Ownership**: Currently determined solely by `currentState.ownerId === participant.id`, which can be forged in broadcast payloads by malicious participants.

---

## 4. PostgreSQL and RLS Assessment
- **Table `aura_room_state`**:
  - Columns: `room_id` (PK, text), `room_name`, `owner_id`, `owner_name`, `current_track`, `queue`, `is_playing`, `position`, `playback_rate`, `updated_at`, `version`, `last_action`.
  - **Current RLS Status**: Unrestricted or unconfigured (relies on client-side upserts).
  - **Proposed RLS Policy**: Enforce that only the verified room owner (`owner_id = auth.uid()` or matching validated session claims) can insert or update room state rows.

---

## 5. Realtime Authorization Assessment
- **Supabase Broadcast Channels (`aura-room:<roomId>`)**: Broadcast events (`ROOM_STATE_UPDATED`, `PLAYBACK_ACTION`) are currently accepted by all connected clients without server-side validation.
- **Security Boundary**:
  - `REQUEST_ROOM_STATE`, `CHAT_MESSAGE`: Safe for participant generation.
  - `ROOM_STATE_UPDATED`, `PLAYBACK_ACTION` (Play, Pause, Skip, Seek, Queue mutations): Must be strictly restricted to the verified room owner.

---

## 6. Trusted Room-Command Architecture
- **Design Pattern**: Server-side command validation.
  1. Client sends a room mutation action.
  2. Backend (or Supabase PostgreSQL RPC function / Edge Function) validates the JWT session against `owner_id`.
  3. If authorized, PostgreSQL state is updated and broadcasted to room participants.

---

## 7. Host and Participant Permission Matrix

| Operation | Host / Owner | Participant | Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| Start / Pause Playback | Allowed | Blocked (Sends request to host) | Server-side RPC / RLS |
| Skip / Change Track | Allowed | Blocked | Server-side RPC / RLS |
| Add / Remove Queue Track | Allowed | Allowed (If enabled) | RLS / Room Policy |
| Reorder Queue | Allowed | Blocked | Server-side RPC / RLS |
| Close Room | Allowed | Blocked | Server-side RPC / RLS |

---

## 8. Room Ownership Model
- **Ownership Verification**: Tied to authenticated Supabase user ID or cryptographically signed session tokens.
- **Reconnection & Refresh**: Host reconnection within a 60-second grace period preserves ownership via secure token validation.

---

## 9. Direct Realtime Fallback Security
- The custom Node.js WebSocket server (`roomWsServer.ts`) will be updated to validate connecting user IDs and reject state updates originating from non-owner socket IDs.

---

## 10. Proposed SQL Migrations
```sql
-- Enable RLS on aura_room_state
ALTER TABLE aura_room_state ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active rooms
CREATE POLICY "Allow public read access to rooms"
  ON aura_room_state FOR SELECT
  USING (true);

-- Policy: Only room owner can insert or update room state
CREATE POLICY "Allow owner to insert and update room state"
  ON aura_room_state FOR ALL
  USING (auth.uid()::text = owner_id)
  WITH CHECK (auth.uid()::text = owner_id);
```

---

## 11. Security Test Cases
1. **Participant Attempts Host Command**: Participant sends `ROOM_STATE_UPDATED` with modified playback state; rejected by RLS / server validation.
2. **Forged Owner ID**: Client attempts to create room with another user's `ownerId`; rejected.
3. **Unauthenticated Write**: Unauthenticated client attempts direct table write; rejected by RLS.

---

## 12. Implementation Stages
- **Stage 1**: Database Migration & RLS Enablement on `aura_room_state`.
- **Stage 2**: Supabase Auth Session Integration & Verified User ID Resolution.
- **Stage 3**: Host-Only Command Validation in `supabaseRealtimeAdapter.ts`.
- **Stage 4**: WebSocket Fallback Authorization in `roomWsServer.ts`.

---

## 13. Exact File Scope
- `src/services/realtime/supabaseRealtimeAdapter.ts`
- `src/services/realtime/directRealtimeAdapter.ts`
- `src/services/realtime/roomService.ts`
- `src/context/ListenTogetherContext.tsx`
- `src/server/roomWsServer.ts`

---

## 14. Environment and Deployment Requirements
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provisioned correctly.
- Execute SQL migrations on the Supabase project dashboard.

---

## 15. Rollback Strategy
- In case of Supabase Auth friction, fallback to secure client-side role validation while retaining RLS bypass during migration.

---

## 16. Unresolved Questions
- Determining whether anonymous sign-in or full user registration is optimal for seamless user onboarding in AURA 2.0.
