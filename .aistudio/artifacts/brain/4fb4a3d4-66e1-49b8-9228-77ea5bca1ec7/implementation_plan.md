# Implementation Plan — Phase 3.4E: Queue Management & Playback Queue Experience

## 1. Existing Architecture Audit

### Audit Summary
A comprehensive audit of the AURA 2.0 queue management system was conducted across:
- `src/components/queue/QueueDrawer.tsx`
- `src/components/player/BottomPlayer.tsx`
- `src/components/mobile/MobileExpandedPlayer.tsx`
- `src/context/MusicContext.tsx`
- `src/context/ListenTogetherContext.tsx`
- `src/types/index.ts`

### Findings
1. **Queue State & Actions (`MusicContext.tsx`)**:
   - `queue: Track[]` and `queueIndex: number` track the current playback session.
   - `history: Track[]` records previously played tracks (up to 30 items).
   - Core functions: `addToQueue(track)`, `playNext(track)`, `removeFromQueue(index)`, `reorderQueue(fromIndex, toIndex)`, `clearQueue()`, `playTrack(track, queue)`.

2. **Current Queue Drawer (`QueueDrawer.tsx`)**:
   - Already provides tabs for "Up Next" (`queue.slice(queueIndex + 1)`) and "Recently Played" (`history`).
   - Includes basic reorder up/down buttons (`reorderQueue`), remove track, and clear queue.
   - Already integrated into `App.tsx` and triggered via bottom player queue buttons, header buttons, and keyboard shortcut (`KeyQ`).

3. **Gaps & Enhancements for Phase 3.4E**:
   - **Visual Polish**: Elevate to AURA's approved Obsidian Liquid Glass design system (`bg-[#0c0d11]/95`, border `white/[0.08]`, backdrop blur, refined typography).
   - **Remaining Queue Duration**: Calculate and display total remaining playback time for the "Up Next" queue.
   - **Shuffle Upcoming Tracks**: Add a dedicated "Shuffle Up Next" action button in the queue drawer header.
   - **Source Badges**: Display clean source indicators (Local, Jamendo, Audius, YouTube, Curated Stream) on queue track items.
   - **Listen Together Compatibility**: Verify that queue mutations work correctly when in a Listen Together room without breaking synchronization protocols.

---

## 2. Exact Files to Modify

### Modified Files:
1. `src/components/queue/QueueDrawer.tsx`
   - Redesign container with Obsidian Liquid Glass aesthetic.
   - Add remaining queue duration calculation and header statistics.
   - Add "Shuffle Up Next" button to randomize upcoming tracks without disrupting the currently playing track.
   - Enhance track rows with source badges, smoother reordering, and polished hover interactions.
   - Ensure mobile responsiveness and touch-friendly targets.

### Protected Files (MUST NOT MODIFY):
- `src/services/audioEngine.ts`
- `src/context/MusicContext.tsx`
- `src/context/ListenTogetherContext.tsx`
- `src/services/storage.ts`
- `src/types/index.ts`
- Background audio keepalive, YouTube bridge, Media Session, IndexedDB schemas.

---

## 3. Detailed Feature Plan for Queue Management

### A. Now Playing & Up Next Header
- **Queue Count & Runtime**: Display total item count and cumulative remaining duration (e.g. `14 tracks • 48 min remaining`).
- **Shuffle Up Next**: A button that takes `queue.slice(queueIndex + 1)`, applies Fisher-Yates shuffle, and splices it back into the queue right after `queueIndex`.

### B. Up Next List & Reordering
- **Reordering**: Uses existing `reorderQueue(actualIdx, actualIdx - 1)` / `reorderQueue(actualIdx, actualIdx + 1)`.
- **Boundary Safeguards**: Move Up disabled for the first item in Up Next; Move Down disabled for the last item.
- **Track Removal**: `removeFromQueue(actualIdx)` safely removes the item without interrupting playback.

### C. Source Badges
- Render subtle source pills (`Local`, `Audius`, `Jamendo`, `YouTube`, `Stream`) based on track `source` metadata.

### D. Listen Together Separation & Compatibility
- Queue actions in `QueueDrawer` operate on local queue state.
- When participating in a Listen Together room, room queue synchronization is handled by `ListenTogetherContext.tsx`. Local queue operations remain fully compatible.

---

## 4. Desktop and Mobile Layouts

- **Desktop**:
  - Right-side sliding drawer (max-w-md) with frosted glass backdrop and smooth animations.
- **Mobile**:
  - Full-height bottom sheet / side drawer with safe area padding (`pb-safe`) ensuring zero overlap with mobile navigation or mini-player.

---

## 5. Testing and Acceptance Criteria

1. **Queue Drawer UI**: Verify Obsidian Liquid Glass styling, tabs, and open/close states.
2. **Up Next Management**: Verify reordering, individual track removal, clear upcoming queue, and shuffle upcoming tracks.
3. **Runtime Calculation**: Verify correct remaining duration calculation for queued tracks.
4. **Build & Lint**: `compile_applet` and `lint_applet` pass with 0 errors.

---

## 6. Proposed Implementation Subphases

- **Subphase 3.4E.1**: QueueDrawer Redesign & Up Next Enhancements (`QueueDrawer.tsx`).
- **Subphase 3.4E.2**: Build Verification, Linting, and Regression Audit.
