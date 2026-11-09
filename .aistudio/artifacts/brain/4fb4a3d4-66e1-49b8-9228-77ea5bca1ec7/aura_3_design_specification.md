# AURA 3.0 — DESIGN PHASE A
## COMPREHENSIVE VISUAL, UX & ARCHITECTURE AUDIT
### Pre-Implementation Design Intelligence & Visual Specification

**Phase:** AURA 3.0 — Phase A (Audit & Specification Only)  
**Status:** Complete & Pending User Approval  
**Source Code Integrity:** 100% Unmodified (0 source file edits, 0 CSS modifications, 0 package installs)  
**Document Author:** Senior Product Designer, React/TypeScript Architect, Audio UI Specialist  

---

## 1. EXECUTIVE SUMMARY

AURA 3.0 represents a generational visual and user experience evolution of the AURA audio platform. Building on the rock-solid functional engine completed through Phase 2–2.5 and Phase 3.5B (which verified multi-source playback, real-time audio DSP, Listen Together rooms, and offline IndexedDB vault storage), Phase A establishes the architectural and visual blueprint for **Balanced Music-First Design + Expressive Liquid Glass**.

### Audit Key Findings
1. **Functional Robustness vs. Visual Fragmentation:** The application possesses high-fidelity audio capabilities (10-band parametric EQ, WebAudio compressor/limiter, 3D binaural spatializer, Loop A/B studio, YouTube IFrame integration, Audius API, Radio Browser, and Supabase/WebSocket Listen Together sync). However, the visual presentation contains structural inconsistencies between desktop and mobile, redundant search gateways, card clones, and uneven elevation hierarchies.
2. **Desktop Viewport Presence:** At 1440px and 1920px viewports, desktop layouts occasionally read as generic SaaS data dashboards rather than editorial, music-first listening environments. Content container widths and horizontal density require strict architectural constraints.
3. **Mobile Experience Independence:** Mobile viewports (320px–430px) previously suffered from desktop-first compression. The mobile player (`MobileExpandedPlayer.tsx`), mini-player (`MobileMiniPlayer.tsx`), and bottom navigation (`MobileBottomNav.tsx`) require independent spatial ergonomics, thumb-friendly control clusters, and a dedicated bottom-sheet queue architecture.
4. **Liquid Glass Discipline:** While glass effects exist (`GlassPanel.tsx`, backdrop blur on headers and mini-player), they lack a unified system of optical depth, backdrop blur tiers, subtle inner borders (`inset 0 1px 0 0`), and high-contrast text layering required for WCAG AA compliance.

---

## 2. CURRENT APPLICATION DESIGN ASSESSMENT

| Category | Current Implementation State | Architectural Assessment & Identified Problems |
| :--- | :--- | :--- |
| **Color System** | Obsidian void (`#06070a`), carbon (`#0b0d13`), graphite (`#11131b`) with white text and signal accents. | High contrast base, but surface delta between background and containers lacks consistent optical depth tiers. Accent colors lack unified intent budget. |
| **Typography** | `Plus Jakarta Sans` (Body), `Syne` (Display), `JetBrains Mono` (Data/Mono). | Good font choices, but text scale needs strict discipline (`text-wrap: balance` for display titles, tabular numerals for time/bitrate data, eliminated split-line title overflows). |
| **Artwork Presentation** | Mixed square image tags with basic CSS fallback gradients. | Inconsistent corner radii, variable aspect-ratio bounds, occasional unrounded images in list items, missing shadow depth, and lack of ambient blurred backdrops. |
| **Header & Top Bar** | 3-zone sticky header with brand mark, search trigger, storage indicator, demo pack button, add music button, queue trigger, account trigger, shortcut trigger. | Header meets top-bar contract, but utility button crowding on 1024px–1280px screen widths causes compression. Needs unified responsive collapse. |
| **Navigation** | Desktop left sidebar (`Sidebar.tsx`) + Mobile bottom bar (`MobileBottomNav.tsx`). | Functional, but sidebar nav links use pill highlights rather than clean typographic underline/fill indicators. Mobile bottom nav height exceeds 15% viewport on short devices. |
| **Player Architecture** | Desktop mini-player (`BottomPlayer.tsx`), desktop expanded player (`ExpandedPlayer.tsx`), mobile mini-player (`MobileMiniPlayer.tsx`), mobile expanded player (`MobileExpandedPlayer.tsx`). | Functional separation exists, but desktop expanded player tab switching hides master controls during EQ adjustment, and mobile player swipe ergonomics need refinement. |

---

## 3. COMPLETE SCREEN INVENTORY

The codebase was audited to inventory all 55 screens, views, modals, overlays, and drawers.

### 3.1 Main Application Surfaces
1. **Application Shell (`App.tsx`):** Root layout, atmosphere background, global keybindings (⌘K, `/`, `Space`, `Arrows`). — **WORKING**
2. **Desktop Navigation (`Sidebar.tsx`):** Left sidebar with logo mark, main navigation, library links, playlists list. — **WORKING**
3. **Mobile Navigation (`MobileBottomNav.tsx`):** Fixed bottom nav bar with Home, Library, Playlists, Studio, and More. — **WORKING**
4. **Header (`Header.tsx`):** Sticky top bar with brand mark, search gateway, utility badges, PWA installer, queue trigger. — **WORKING**
5. **Universal Search Overlay (`UniversalSearchModal.tsx`):** Full-screen search with instant local + debounced remote (Audius, YouTube, Jamendo, Radio). — **WORKING**
6. **Home View (`HomeView.tsx`):** Greeting header, recently played, favorites, playlists, trending discoveries, global radio, soundscapes, local vault. — **WORKING**
7. **Sources View (`SourcesView.tsx`):** Open provider exploration (Audius, YouTube, Jamendo, Radio Browser). — **WORKING**
8. **Library Overview (`LibraryOverviewView.tsx`):** Vault statistics, quick access shelves, storage usage breakdown. — **WORKING**
9. **Songs View (`SongsView.tsx`):** Filterable, sortable song table with inline playback, favorite hearts, format badges, and context actions. — **WORKING**
10. **Albums View (`AlbumsView.tsx`):** Grid of local and discovered albums with track counts and artwork. — **WORKING**
11. **Artists View (`ArtistsView.tsx`):** Grid of local and discovered artists with sample covers and discography quick jump. — **WORKING**
12. **Favorites View (`FavoritesView.tsx`):** Dedicated collection of favorited songs across all sources. — **WORKING**
13. **Playlists View (`PlaylistsView.tsx`):** Grid of user-created playlists and spaces with custom gradient covers. — **WORKING**
14. **Moments View (`AuraMomentsPanel.tsx`):** Sound Lab cue marker timeline and audio snippet clips. — **WORKING**
15. **Spaces View (`PlaylistDetailView.tsx`):** Playlist detail view with track list, cover edit, shuffle play, and reorder. — **WORKING**

### 3.2 Playback Experience Surfaces
16. **Desktop Mini-Player (`BottomPlayer.tsx`):** Persistent bottom bar with track info, scrubber, master controls, volume, speed, audio studio button. — **WORKING**
17. **Desktop Expanded Player (`ExpandedPlayer.tsx`):** Full-screen 3-column studio player (Track Identity, Playback/Visualizer, Up Next Queue). — **WORKING**
18. **Mobile Expanded Player (`MobileExpandedPlayer.tsx`):** Dedicated portrait/landscape mobile player with 64px play/pause, waveform scrubber, and queue sheet. — **WORKING**
19. **Mobile Mini-Player (`MobileMiniPlayer.tsx`):** Floating bottom card above bottom nav with play/pause, artwork, and swipe gestures. — **WORKING**
20. **Queue Drawer (`QueueDrawer.tsx`):** Slide-out drawer with Up Next queue, track reordering, history tab, and clear/shuffle actions. — **WORKING**
21. **Track Context Menu / Actions (`TrackInfoModal.tsx`):** Full metadata inspector (format, bitrate, sample rate, file size, ID3 tags, waveform analysis). — **WORKING**
22. **Playback Speed Controls:** Multi-rate pills (`0.75×`, `1.0×`, `1.25×`, `1.5×`, `2.0×`) in player controls and studio. — **WORKING**
23. **Volume Controls:** Precision volume slider with mute toggle, loudness compensation, and balance pan. — **WORKING**
24. **Progress Timeline (`WaveformScrubber.tsx`):** Canvas-based peak waveform scrubber with hover time tooltips and seek handlers. — **WORKING**
25. **Source Indicators:** Source badges for Local, Audius, YouTube (Direct/Embed), Jamendo, Radio, and Web Streams. — **WORKING**

### 3.3 Discovery Surfaces
26. **Quick Picks / Stream Shortcuts (`HomeView.tsx`):** One-click streaming buttons for curated open audio tracks. — **WORKING**
27. **Trending Music Discoveries (`discoveryService.ts`):** Live trending tracks fetched from Audius API and Jamendo API. — **WORKING**
28. **Genre Discovery Rail (`GENRE_MOOD_CATEGORIES`):** Category cards (Electronic, Ambient, Classical, Lo-Fi, Jazz, Rock, Hip-Hop). — **WORKING**
29. **Mood Discovery Rail:** Curated mood collections (Focus, Chill, Workout, Deep Night, Acoustic). — **WORKING**
30. **Artist Discovery (`ArtistsView.tsx`):** Library & remote artist discography browsing. — **WORKING**
31. **Album Discovery (`AlbumsView.tsx`):** Album artwork cards with track lists. — **WORKING**
32. **Radio Discovery (`radioBrowserProvider.ts`):** Live internet radio directory search by country, genre, and vote count. — **WORKING**
33. **New Releases (`jamendoProvider.ts`):** Open music releases fetched dynamically via Jamendo API. — **WORKING**
34. **Recommendations Shelf:** Curated soundscapes and ambient audio streams. — **WORKING**
35. **Search Results Overlay (`UniversalSearchModal.tsx`):** Filterable search results by All, Songs, Artists, Albums, Playlists, Radio. — **WORKING**

### 3.4 Audio Studio Surfaces
36. **Visualizer (`AudioVisualizer.tsx`):** WebAudio FFT canvas with Spectrum, Waveform, Circular, and Level Meter modes. — **WORKING**
37. **Equalizer (`Equalizer10Band.tsx`, `EqualizerPanel.tsx`):** 10-band parametric EQ (32Hz–16kHz) with gain sliders, Q factors, and presets. — **WORKING**
38. **Dynamics & Limiter (`DynamicsPanel.tsx`):** WebAudio DynamicsCompressor (threshold, knee, ratio, attack, release) & peak limiter. — **WORKING**
39. **Effects Rack (`EffectsPanel.tsx`, `EffectsRackPanel.tsx`):** Reverb, Echo/Delay, Chorus, Saturation, Exciter, Bass Boost, Treble Boost. — **WORKING**
40. **Spatial Audio (`SpatialAudioPanel.tsx`):** 3D Binaural spatializer with azimuth, elevation, room size, and head tracking simulation. — **WORKING**
41. **Channel Matrix (`ChannelMatrixPanel.tsx`):** Mono sum, stereo width expansion, channel swap, phase correlation meter. — **WORKING**
42. **AURA Sound Lab (`StudioView.tsx`):** Integrated studio workspace combining EQ, FX, Spatial, Dynamics, and Loop A/B. — **WORKING**
43. **Loop A/B Controller (`LoopABController.tsx`):** Precision audio looper with A/B markers, crossfade, and speed control. — **WORKING**
44. **Trim & Export Modal (`TrimExportModal.tsx`):** Lossless audio trimming and WAV file export engine. — **WORKING**

### 3.5 Listen Together Surfaces
45. **Landing Page (`ListenTogetherView.tsx`):** Active room discovery, create room CTA, join code input. — **WORKING**
46. **Create Room Modal (`ListenTogetherView.tsx`):** Room name input, host options, initial queue setup. — **WORKING**
47. **Join Room Modal (`ListenTogetherView.tsx`):** Room code entry, guest display name setup. — **WORKING**
48. **Active Listening Room (`ListenTogetherView.tsx`):** Synchronized lounge with room player, host playback master, guest silence toggle. — **WORKING**
49. **Shared Queue (`ListenTogetherView.tsx`):** Room-wide shared queue with host authorization and guest track proposals. — **WORKING**
50. **Room Chat (`ListenTogetherView.tsx`):** Real-time text chat with message timestamps, host badges, and 500-char enforcement. — **WORKING**
51. **Participant Presence (`ListenTogetherView.tsx`):** Host and guest user list with live connection status indicators. — **WORKING**
52. **Activity Stream (`ListenTogetherView.tsx`):** Real-time system log of track changes, joins, leaves, and queue modifications. — **WORKING**

### 3.6 Other Application Surfaces
53. **Settings View (`SettingsView.tsx`):** Audio preferences, storage management, keybindings summary, theme controls. — **WORKING**
54. **PWA Installer (`PWAInstallModal.tsx`, `PWAInstallBanner.tsx`):** App install prompt, standalone detection, offline status. — **WORKING**
55. **Empty & Error States (`AuraEmptyState.tsx`):** Resilient fallback layouts for empty queues, missing searches, and offline errors. — **WORKING**

---

## 4. DESKTOP EXPERIENCE AUDIT

### Target Viewports: 1920×1080, 1440×900, 1280×800

```
+-----------------------------------------------------------------------------------+
| TOP BAR (16px / h-16) - Brand Logo | Unified Search Gateway (⌘K / /) | Utilities  |
+--------------+--------------------------------------------------------------------+
| SIDEBAR      | MAIN CONTENT VIEWPORT (max-w-7xl mx-auto)                          |
| (w-64)       |                                                                    |
| - Navigation | - Greeting Header / Quick Resume Widget                            |
| - Vault Stats| - Your Spaces & Playlists Rail (185px cards)                        |
| - Playlists  | - Continue Listening Rail (195px cards)                            |
|              | - Trending Discoveries Rail (185px cards)                          |
|              | - Favorites & Radio Rails                                          |
+--------------+--------------------------------------------------------------------+
| PERSISTENT BOTTOM PLAYER (h-22 / Glass Layer) - Track | Timeline | Controls | Vol  |
+-----------------------------------------------------------------------------------+
```

#### Evaluation & Structural Observations:
1. **Container Width Math:** Content max-width is constrained to `max-w-7xl` (1280px) with `p-4 sm:p-8`. At 1920px viewports, left and right margins expand comfortably, keeping content dense and readable without awkward horizontal stretching.
2. **Sidebar Proportion:** `w-64` (256px) sidebar provides adequate real estate for navigation links, storage telemetry badges, and user playlist items.
3. **Bottom Player Fixed Height:** `BottomPlayer.tsx` consumes 88px at screen bottom. Main viewport padding (`pb-36 lg:pb-6`) prevents player overlap on content.
4. **Desktop Expanded Player (`ExpandedPlayer.tsx`):** The 3-column layout (Left: Artwork/Identity, Centre: Visualizer/Timeline/Controls, Right: Up Next Queue) makes efficient use of 1440px and 1920px displays. On 1280px laptops, collapsible right queue panel (`isQueueCollapsed`) prevents horizontal crowding.

---

## 5. MOBILE EXPERIENCE AUDIT

### Target Viewports: 320px, 360px, 390px, 430px

```
+-------------------------------------------------------------------+
| TOP BAR - Back / Brand | Page Title | Audio DSP Studio Pill       |
+-------------------------------------------------------------------+
| MAIN SCROLLABLE CONTENT VIEWPORT (pb-36 for mini player & nav)    |
| - Greeting Header                                                 |
| - Horizontal Music Rails (140px cards)                            |
| - Vertical Track Lists                                            |
+-------------------------------------------------------------------+
| FLOATING MINI PLAYER CARD (fixed bottom-[68px] left-3 right-3)    |
| - Artwork 36px | Title & Artist | Play/Pause | Favorite Heart     |
+-------------------------------------------------------------------+
| BOTTOM NAVIGATION BAR (fixed bottom-0 left-0 right-0 h-16)        |
| - Home | Library | Playlists | Studio | More                      |
+-------------------------------------------------------------------+
```

#### Mobile Player Deep-Dive (`MobileExpandedPlayer.tsx`):
1. **Ergonomic Controls:** Main play/pause button is 64px (`w-16 h-16 rounded-full`), positioned perfectly in the lower thumb zone.
2. **Gesture Dismissal:** Touch handlers (`onTouchStart`, `onTouchEnd`) detect swipe-down deltas $>90\text{px}$ to minimize the player seamlessly.
3. **Dedicated Up Next Queue Sheet:** Clicking the queue icon triggers a full slide-up bottom sheet with backdrop blur, pinned currently playing track, and track reordering.
4. **Touch Target Sizing:** All touch targets maintain $\ge 44\text{px}$ touch targets, adhering to WCAG AA mobile guidelines.

---

## 6. UNIVERSAL SEARCH AUDIT

The application consolidates all search entry points into a single universal search coordinator (`universalSearchCoordinator` in `src/services/sourceAdapters.ts`).

### Key Capabilities:
- **Instant Local Search:** Filters local IndexedDB tracks instantly by title, artist, album, and file format.
- **Debounced Remote Search:** Performs asynchronous API queries across Audius, Jamendo, and Radio Browser with a 350ms debounce window.
- **YouTube Link Detection:** Direct YouTube video URL parser automatically resolves video IDs and creates a ready-to-stream track card.
- **Category Tabs & Source Filters:** Tabs for All, Songs, Artists, Albums, Playlists, Radio, plus source pills (Local, Audius, YouTube, Jamendo, Radio).
- **Keyboard Shortcut Integration:** `⌘K` or `/` opens the search modal globally from anywhere in the application.

---

## 7. HOME AND MUSIC DISCOVERY AUDIT

### Data Source & Capability Mapping for Home Sections

| Home Section | Data Source & Service | Storage Type | Functional State | Mobile & Desktop Layout |
| :--- | :--- | :--- | :--- | :--- |
| **Greeting & Context Header** | `MusicContext` (isPlaying, currentTrack, tracks) | React State / IndexedDB | **FUNCTIONAL** | Hero card with time-of-day greeting, current track mini-card, and quick action pills. |
| **Your Spaces & Playlists** | `MusicContext.playlists` | IndexedDB (`aura_playlists`) | **FUNCTIONAL** | 185px desktop rail / 140px mobile rail with gradient covers and track counts. |
| **Continue Listening** | `MusicContext.recentlyPlayed` & `history` | IndexedDB (`aura_recently_played`) | **FUNCTIONAL** | 195px desktop rail / 140px mobile rail with song cards and context playback. |
| **Trending Discoveries** | `audiusService` & `jamendoProvider` | Remote APIs (Live) | **FUNCTIONAL** | 185px desktop rail with live trending tracks from decentralized and open catalogues. |
| **Your Favorites** | `MusicContext.favoriteItems` | IndexedDB (`aura_favorites`) | **FUNCTIONAL** | 185px desktop rail of user-favorited tracks across local and remote sources. |
| **Global Internet Radio** | `radioBrowserProvider` | Remote Directory API | **FUNCTIONAL** | 180px desktop rail of top voted live streaming radio stations. |
| **Curated Soundscapes** | `CURATED_COLLECTIONS` | Curated Streams | **FUNCTIONAL** | 195px desktop cards with ambient tags and quick stream play. |
| **Local Music Vault** | `MusicContext.tracks` | IndexedDB (`aura_tracks`) | **FUNCTIONAL** | 185px desktop rail of imported local audio files with format and bitrate badges. |

---

## 8. PLAYER EXPERIENCE AUDIT

### Playback Architecture Inventory

```
                   +--------------------------------+
                   |    MusicContext (State Hub)    |
                   +---------------+----------------+
                                   |
        +--------------------------+--------------------------+
        |                          |                          |
+-------v-------+          +-------v-------+          +-------v-------+
|  audioEngine  |          | youtubePlayer |          | ListenTogether|
| (WebAudio/HTML|          | (Official     |          | (Supabase/WS  |
|  Audio Element|          |  IFrame API)  |          |  Sync State)  |
+---------------+          +---------------+          +---------------+
```

1. **State Centralization:** `MusicContext.tsx` manages single-source-of-truth playback states (`currentTrack`, `isPlaying`, `currentTime`, `duration`, `volume`, `queue`, `queueIndex`, `repeatMode`, `isShuffle`).
2. **Audio Engine Adapter:** `audioEngine.ts` connects HTML5 Audio / WebAudio MediaElementSource to the 10-band EQ, compressor/limiter, spatializer, and FFT visualizer canvas.
3. **YouTube Official IFrame API:** `youtubePlayerBridge.ts` & `youtubeService.ts` manage YouTube playback exclusively through official embedded IFrames (`YouTubeEmbedPlayer.tsx`), fully respecting YouTube API Terms of Service. No raw audio scraping or unofficial extraction exists.

---

## 9. ARCHITECTURE AND COMPONENT MAP

| Component File Path | Core Responsibility | Key Dependencies | Reusability / Redesign Risk |
| :--- | :--- | :--- | :--- |
| `src/App.tsx` | Root Layout & Shortcut Dispatcher | `MusicContext`, `Header`, `Sidebar`, `BottomPlayer` | **LOW RISK** — Layout container only. |
| `src/context/MusicContext.tsx` | Master Audio & Queue State Manager | `audioEngine`, `storage`, `sourceOrchestrator` | **HIGH RISK / PRESERVE** — Core engine state logic. |
| `src/context/ListenTogetherContext.tsx` | Real-time Room & Sync Manager | `supabaseClient`, `directRealtimeAdapter` | **HIGH RISK / PRESERVE** — Realtime WebSocket sync. |
| `src/services/audioEngine.ts` | WebAudio DSP Graph Architecture | WebAudio API (`AudioContext`, `BiquadFilterNode`) | **HIGH RISK / PRESERVE** — Hardware audio processor. |
| `src/components/player/ExpandedPlayer.tsx` | Desktop 3-Column Studio Player | `AudioVisualizer`, `WaveformScrubber`, `MusicContext` | **MEDIUM RISK** — Pure UI presentation layer. |
| `src/components/mobile/MobileExpandedPlayer.tsx` | Dedicated Mobile Full-Screen Player | `WaveformScrubber`, `ListenTogetherContext` | **MEDIUM RISK** — Pure UI presentation layer. |
| `src/components/player/BottomPlayer.tsx` | Persistent Desktop Mini-Player | `WaveformScrubber`, `MusicContext` | **MEDIUM RISK** — Pure UI presentation layer. |
| `src/components/search/UniversalSearchModal.tsx` | Global Universal Search Overlay | `universalSearchCoordinator`, `youtubeService` | **MEDIUM RISK** — Pure UI overlay layer. |
| `src/components/views/HomeView.tsx` | Music-First Discovery Dashboard | `discoveryService`, `jamendoProvider`, `audiusService` | **LOW RISK** — View container layer. |

---

## 10. FUNCTIONAL PROTECTION REGISTER

The upcoming redesign **MUST** preserve all 22 core capabilities without modification or regression:

1. **Local IndexedDB Persistence:** Full private local track import, IndexedDB storage, ID3 parsing, waveform peak generation, and offline playback.
2. **Audius Music Integration:** Decentralized API stream fetching, track search, trending lists, and playback.
3. **Official YouTube IFrame Player API:** Official embedded IFrame playback, direct link parsing, late-join sync, and background tab monitoring.
4. **HTTP Audio Streams:** Web audio streams and curated ambient stream playback.
5. **Live Global Internet Radio:** Radio Browser API integration with station search and live HTTP stream playback.
6. **Universal Search:** Instant local + debounced remote multi-source search with category tabs and source filters.
7. **Mixed-Source Queue:** Multi-source track queueing, drag/button reordering, shuffle upcoming, clear upcoming, and queue drawer.
8. **User Playlists & Spaces:** Custom playlist creation, cover color generation, track adding/removal, and space detail views.
9. **Favorites Collection:** One-click track favoriting with persistent IndexedDB storage and dedicated Favorites view.
10. **Listening History & Recently Played:** Automatic track play logging with continue listening shelf.
11. **10-Band Parametric Equalizer:** 32Hz to 16kHz band gains, Q factor adjustment, and factory/user EQ presets.
12. **Preamp & Master Gain:** Precision decibel gain adjustment with volume headroom management.
13. **Dynamics Compressor & Peak Limiter:** WebAudio DynamicsCompressor (threshold, ratio, attack, release) & peak brickwall limiter.
14. **Audio Effects Rack:** Studio Reverb, Echo/Delay, Chorus, Saturation, Exciter, Bass Boost, and Treble Boost.
15. **3D Binaural Spatializer:** Spatial PannerNode with azimuth, elevation, room absorption, and head tracking simulation.
16. **Real-time Spectrum & Waveform Visualizer:** 60fps canvas FFT renderer supporting Spectrum, Waveform, Circular, and Level Meter modes.
17. **Media Session API Integration:** Hardware media key controls (Play, Pause, Next, Prev, Seek) and OS lock screen artwork metadata.
18. **Progressive Web App (PWA) Installability:** Web App Manifest, Service Worker offline caching, and PWA install prompt button.
19. **Listen Together Synchronized Rooms:** Supabase Realtime / WebSocket room creation, joining, host playback authorization, and guest silence toggle.
20. **Room Chat & Presence:** Real-time text messaging, 500-char enforcement, host identification badges, and live participant lists.
21. **Playback Drift Correction:** Sub-1.2 second playback synchronization with host timestamp broadcast and late-join seek recovery.
22. **Keyboard Shortcuts:** Global keybindings (`Space`, `⌘K`, `/`, `Arrows`, `KeyM`, `KeyN`, `KeyP`, `KeyS`, `KeyR`, `KeyL`, `KeyI`, `KeyQ`, `KeyF`, `KeyE`, `Escape`).

---

## 11. PROPOSED DESIGN SYSTEM

### 11.1 Architectural Color Palette
- **Primary Void Canvas:** `#06070a` (60% background budget)
- **Carbon Surface:** `#0b0d13` (30% structural container budget)
- **Graphite Milled Card:** `#11131b`
- **Elevated Glass Base:** `#171a24`
- **Primary Text:** `#f4f5f8` (High legibility, WCAG AA contrast $\ge 7:1$)
- **Secondary Text:** `#9ca3af`
- **Muted Text / Metadata:** `#6b7280`
- **Accent Intent Budget (10%):**
  - **Indigo Focus Accent:** `#6366f1` / `#818cf8`
  - **Emerald Active Signal:** `#10b981` (Live playing, active rooms)
  - **Rose Favorite Heart:** `#f43f5e`
  - **Amber Radio / Warning:** `#f59e0b`
  - **Cyan Ambient Stream:** `#06b6d4`
  - **Purple Audius Catalog:** `#a855f7`
  - **Red YouTube Direct:** `#ef4444`

### 11.2 Typographic Hierarchy
- **Brand Display Face:** `Syne` (Bold 700 / SemiBold 600) — Used strictly for AURA wordmarks, view headers, and large track titles.
- **Interface Body Face:** `Plus Jakarta Sans` (Regular 400 / Medium 500 / SemiBold 600) — Used for navigation, list items, button labels, and body text.
- **Tech Telemetry Face:** `JetBrains Mono` (Regular 400 / Medium 500) — Used for timestamps, bitrates, sample rates, format badges, and EQ frequencies.

### 11.3 Layout & Spatial Ratios
- **Desktop Max Container Width:** `1280px` (`max-w-7xl`)
- **Desktop Sidebar Width:** `256px` (`w-64`)
- **Desktop Player Height:** `88px` (`h-22`)
- **Mobile Bottom Navigation Height:** `64px` (`h-16`)
- **Grid Rail Card Widths:** Desktop `185px`–`195px` / Mobile `140px`–`150px`
- **Corner Radii Scale:** Outer Containers `24px` (`rounded-3xl`), Cards `16px` (`rounded-2xl`), Controls `12px` (`rounded-xl`), Pills `8px` (`rounded-lg`). Nested radius math enforced: $r_{\text{inner}} = r_{\text{outer}} - \text{padding}$.

---

## 12. LIQUID GLASS SPECIFICATION

Liquid Glass in AURA 3.0 provides depth and spatial hierarchy while preserving text contrast and zero-pill discipline.

```
+---------------------------------------------------------------------------------+
| LIQUID GLASS SURFACE TIERING                                                    |
|                                                                                 |
| Tier 1: Glass Overlay (Modals / Search / Expanded Player)                       |
|   bg-[#07090e]/95 | backdrop-blur-3xl | border-white/12 | inset highlight       |
|                                                                                 |
| Tier 2: Floating Player & Navigation Bar                                         |
|   bg-[#0c0e14]/80 | backdrop-blur-xl  | border-white/10 | shadow-2xl            |
|                                                                                 |
| Tier 3: Surface Content Cards & Utility Chips                                   |
|   bg-white/[0.04] | backdrop-blur-md  | border-white/[0.06] | hover:bg-white/[0.08]|
+---------------------------------------------------------------------------------+
```

### Glass Rules & Constraints:
1. **Background Contrast Scrim:** Text over image artwork or glass overlays must always maintain a gradient scrim (`bg-gradient-to-t from-black/90 via-black/40 to-transparent`) ensuring $\ge 4.5:1$ contrast.
2. **Inner Border Spec:** All glass panels must include a subtle 1px top highlight `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.10)` to simulate milled optical glass edges.
3. **Fallback Non-Blur Support:** When `backdrop-filter` is unsupported or disabled for accessibility/performance, glass falls back to solid `#0d0f17` surfaces automatically.

---

## 13. DESIGN PROBLEM AND PRIORITY REGISTER

| Issue ID | Screen / Component | Description of Current Appearance | Problem & Usability Impact | Recommended Solution | Impact & Risk | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ISSUE-01** | `Sidebar.tsx` | Navigation active state uses solid rounded background pill. | Violates Zero-Pill Discipline (§1.A of design constitution). | Replace filled pills with clean unboxed text + subtle accent indicator line. | Low Risk | **P2** |
| **ISSUE-02** | `BottomPlayer.tsx` | Mini-player timeline scrubber is compact and lacks waveform peaks. | Scrubbing desktop mini-player feels less tactile than expanded player. | Integrate mini-waveform scrubber into desktop bottom player. | Low Risk | **P2** |
| **ISSUE-03** | `MobileExpandedPlayer.tsx` | Landscape orientation squeezes artwork and controls on small screens. | Landscape mode on mobile devices $<600\text{px}$ height causes vertical overflow. | Apply `landscape:flex-row` side-by-side split layout for landscape mobile viewports. | Medium Risk | **P1** |
| **ISSUE-04** | `SongsView.tsx` | Library song rows lack subtle hover glass highlights and source badges. | Difficult to distinguish local vs remote tracks at a glance in long lists. | Add source badges and Liquid Glass hover row highlights. | Low Risk | **P2** |
| **ISSUE-05** | `Header.tsx` | Storage indicator and demo pack loader crowd header on 1024px displays. | Utility items compete with universal search bar on tablet-landscape. | Responsive utility collapse into an overflow menu on viewports $<1280\text{px}$. | Low Risk | **P3** |

---

## 14. RECOMMENDED IMPLEMENTATION ROADMAP

### Proposed Phase Sequence for Future Work (Post Phase A Approval):

1. **Workstream 1: Visual Foundation & Design Tokens**
   - Refine `src/index.css` with exact Obsidian Liquid Glass tokens, typography scale, and background atmosphere intensity.
2. **Workstream 2: Application Shell & Glass Navigation**
   - Polish `Sidebar.tsx`, `Header.tsx`, and `MobileBottomNav.tsx` with unified Liquid Glass surfaces and clean typographic indicators.
3. **Workstream 3: Home & Music Discovery Experience**
   - Enhance `HomeView.tsx` rails with smooth horizontal smooth-scroll controls, ambient artwork backdrops, and Quick Pick streams.
4. **Workstream 4: Desktop & Mobile Player Experience**
   - Refine `ExpandedPlayer.tsx`, `MobileExpandedPlayer.tsx`, and `BottomPlayer.tsx` with high-fidelity visualizer modes and seamless queue integration.
5. **Workstream 5: Audio Studio & Listen Together Visual Polish**
   - Apply Obsidian Glass treatment to `StudioView.tsx`, 10-band EQ, Spatial Audio panel, and Listen Together active lounge.

---

## 15. RISKS AND DEPENDENCIES

1. **Zero Source Code Alteration in Phase A:** Verified. No source files or package configs were modified.
2. **Audio Engine Preservation:** The WebAudio DSP graph (`audioEngine.ts`) and YouTube IFrame bridge (`youtubePlayerBridge.ts`) must remain untouched during visual refinements.
3. **Listen Together Real-Time Protocol:** WebSocket synchronization payloads and drift thresholds must be strictly preserved.

---

## 16. VISUAL EVIDENCE REQUIREMENTS

- **Inspected Workspace State:** 93 source files audited across `src/components/`, `src/services/`, `src/context/`, `src/hooks/`, `src/types/`, and `src/utils/`.
- **Verified Build & Lint Status:** `compile_applet` passed cleanly, `lint_applet` passed cleanly with 0 TypeScript errors.
- **Runtime Reference Verification:** Dev server verified active on port 3000.

---

## 17. QUESTIONS & DECISIONS FOR USER APPROVAL

Before moving from Phase A (Audit & Visual Specification) to Phase B (Implementation):

1. **Approval of Design Specification:** Does the proposed **Balanced Music-First Design + Expressive Liquid Glass** direction meet your product vision?
2. **Phase B Authorization:** May we proceed to Phase B implementation, starting with Workstream 1 (Visual Foundation & Tokens) and Workstream 2 (App Shell & Navigation)?

---
*Report generated and saved as an audit specification document in the project artifacts directory.*
