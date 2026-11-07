# AURA 2.0 — Phase 3.5B.2 Implementation Plan
## Listen Together — Complete UI/UX & Architecture Redesign

**Status:** Planning Review & Approval  
**Target Execution:** Phase 3.5B.3 through Phase 3.5B.8  
**Strict Planning-Only Rule:** Zero application files modified during this phase.

---

## 1. Executive Summary
AURA 2.0 Listen Together enables shared listening lounges where participants sync music playback in real time. Following the Phase 3.5B.1 architecture audit which identified security vulnerabilities (lack of server-side host authorization, potential state forgery) and queue desynchronization risks, Phase 3.5B.2 establishes a robust, secure, and visually breathtaking UI/UX and architectural redesign plan. 

The redesigned experience adopts AURA's **Obsidian Solid Matter + Restrained Liquid Glass + Editorial Music Experience** design system, transforming Listen Together into a private listening lounge while prioritizing secure state ownership, graceful synchronization, and strict source compatibility.

---

## 2. Current Architecture Summary
- **Primary Transport**: Supabase Realtime (Broadcast channels `aura-room:<roomId>` and Presence).
- **Persistence**: PostgreSQL `aura_room_state` table for room state storage.
- **Fallback Transport**: Custom Node.js/Express WebSocket server (`roomWsServer.ts` & `DirectRealtimeAdapter.ts`).
- **State Model**: Host-authoritative broadcasting with local clock-skew anchor (`localSyncAnchor`) and drift correction thresholds.

---

## 3. Existing UI Component Inventory
- `ListenTogetherView.tsx`: Main view container handling unjoined landing state, room creation/joining forms, active room waiting state, and the active lounge UI.
- `ListenTogetherContext.tsx`: React context orchestrating real-time adapter events, participant lists, chat, and playback synchronization loops.
- `roomService.ts`: Singleton manager handling adapter instantiation, identity generation, and URL sanitization.

---

## 4. Complete User Journeys
1. **Landing & Discovery**: User navigates to Listen Together via sidebar. Greeted by a polished lounge introduction with "Create Room" and "Join Room" entry points.
2. **Room Creation**: User specifies room name and optional initial track. Room code is generated (e.g. `aura-8f2k9a`), and user enters the active lounge as Host (`isOwner: true`).
3. **Joining via Invite Link**: User opens `https://app.aura.io/listen/aura-8f2k9a`. App extracts room code, prompts for display name if unset, and connects to the active session.
4. **Active Listening**: Participants enjoy synchronized playback, view the shared queue, chat in real time, and monitor participant presence.

---

## 5. Proposed Screen-by-Screen Layouts
- **Lounge Landing Screen**: Centered editorial typography, glass card for room creation, and direct code entry input with instant validation.
- **Active Listening Lounge (Desktop)**:
  - *Left Panel (30%)*: Participants list, chat drawer, and room invite tools.
  - *Center Focus (45%)*: Large album artwork with live audio visualizer ring, track title/artist, and host status indicator.
  - *Right Panel (25%)*: Shared Up Next queue with drag/drop reordering and source compatibility badges.
- **Active Listening Lounge (Mobile)**: Segmented tab bar allowing seamless toggling between *Now Playing*, *Queue*, and *Chat*.

---

## 6. Desktop, Tablet and Mobile Behavior
- **Desktop**: 3-column spatial layout with persistent bottom player and dedicated audio studio integration.
- **Tablet**: 2-column reflow with collapsable chat/participants sidebar.
- **Mobile**: Single-column vertical stack with touch-optimized controls ($\ge 44\text{px}$ targets) and safe-area padding.

---

## 7. Supabase Architecture
- **Realtime Channels**: Maintain `aura-room:<roomId>` broadcast and presence channels.
- **Broadcast Events**: `ROOM_STATE_UPDATED`, `REQUEST_ROOM_STATE`, `PLAYBACK_ACTION`, `CHAT_MESSAGE`.
- **Presence**: Track active connection timestamps and participant metadata.

---

## 8. PostgreSQL Data Model Assessment
- Existing table `aura_room_state`:
  - `room_id` (PK, text)
  - `room_name` (text)
  - `owner_id` (text)
  - `owner_name` (text)
  - `current_track` (jsonb)
  - `queue` (jsonb)
  - `is_playing` (boolean)
  - `position` (numeric)
  - `playback_rate` (numeric)
  - `updated_at` (bigint)
  - `version` (bigint)
  - `last_action` (jsonb)
- *Assessment*: Sufficient for current state sync; will require Row Level Security (RLS) policy enforcement in subsequent phases.

---

## 9. Security and Authorization Design
- **Host Authorization Enforcement**:
  - Implement server-side or cryptographically validated ownership checks so that only the verified `ownerId` can broadcast authoritative `ROOM_STATE_UPDATED` events or mutate room queues.
  - Restrict Supabase write access on `aura_room_state` using RLS policies verifying that `auth.uid() = owner_id` or matching validated room owner tokens.

---

## 10. Playback Synchronization Design
- **Clock-Skew Mitigation**: Maintain local arrival anchor timestamps to compensate for device clock drift.
- **Drift Thresholds**:
  - $< 350\text{ms}$: No correction (imperceptible).
  - $350\text{ms} - 1.2\text{s}$: Gentle playback rate nudging.
  - $> 1.2\text{s}$: Hard seek to host position.
- **Queue Mutation Protection**: Explicitly guard queue additions/removals so they never trigger unintended playback restarts or seeks on currently playing tracks.

---

## 11. Shared Music-Source Compatibility Policy
- **Shareable Sources**: Audius, Official YouTube, Radio Browser streams, Web streams, Curated streams.
- **Restricted Sources**: Local IndexedDB files and private blobs (cannot be shared across devices).
- **UI Policy**: Non-shareable local files display a clear indicator ("Local files cannot be shared in Listen Together") and require streaming alternatives before queue insertion.

---

## 12. Participant and Chat Experience
- Real-time chat with sender identity, timestamps, and auto-scroll.
- Live participant list with host badge and presence indicators.

---

## 13. Room Lifecycle and Reconnection Design
- Automatic reconnection with exponential backoff on WebSocket/Realtime disconnects.
- 60-second grace period for host reconnections before room hibernation.

---

## 14. Proposed Implementation Phases
- **Phase 3.5B.3**: Security & Host Authorization Guard Rails.
- **Phase 3.5B.4**: Listen Together Landing & Room Creation Flow Redesign.
- **Phase 3.5B.5**: Active Listening Lounge UI & Shared Queue Redesign.
- **Phase 3.5B.6**: Chat & Participant Presence UI Polish.
- **Phase 3.5B.7**: Playbank Synchronization Hardening & Drift Tuning.
- **Phase 3.5B.8**: Comprehensive Regression Audit & Multi-Session Testing.

---

## 15. Exact File Scope for Implementation Phases
- `src/components/views/ListenTogetherView.tsx`
- `src/context/ListenTogetherContext.tsx`
- `src/services/realtime/roomService.ts`
- `src/services/realtime/supabaseRealtimeAdapter.ts`
- `src/services/realtime/directRealtimeAdapter.ts`

---

## 16. Acceptance Criteria
1. Zero TypeScript compilation errors (`tsc --noEmit` passes).
2. Secure host authorization prevents unauthorized state tampering.
3. Queue additions/removals do not restart playing tracks.
4. Obsidian Liquid Glass design language perfectly executed across all Listen Together screens.

---

## 17. Risks and Unresolved Questions
- Supabase anonymous authentication constraints require careful participant token handling.
- Cross-device network latency variations require ongoing drift threshold tuning.
