# AURA 2.0 — Phase 3.5A.3 Implementation Plan
## Dynamics, Spatial 3D & Effects Rack Redesign

**Status:** Planning Review & Approval  
**Target Execution:** Phase 3.5A.3.2 through Phase 3.5A.3.5  
**Strictly Prohibited:** Modifying protected systems (`audioEngine.ts`, `MusicContext.tsx`, `ListenTogetherContext.tsx`, `storage.ts`, IndexedDB schemas, background keep-alive, Media Session, YouTube bridge).

---

## 1. Existing Component Hierarchy & DSP Audit

### A. Dynamics & Limiter (`DynamicsPanel.tsx`)
- **State & Context Hooks**: `compressor`, `limiter`, `loudness`, `updateCompressor`, `resetCompressor`, `updateLimiter`, `resetLimiter`, `updateLoudness`, `currentTrackAnalysis`, `isAdvancedMode`.
- **DSP Mapping**:
  - Compressor: `DynamicsCompressorNode` (`threshold`, `ratio`, `attack`, `release`, `knee`, makeup gain).
  - Limiter: Brickwall peak limiter / ceiling (`ceiling`, `threshold`).
  - Loudness: ITU-R BS.1770 / EBU R128 target normalization (`targetLufs`, -14, -16, -23 LUFS).
- **Gain Reduction Metering**: Real-time requestAnimationFrame polling via `audioEngine.getCompressorReduction()`.

### B. Spatial 3D & Immersive Audio (`SpatialAudioPanel.tsx`)
- **State & Context Hooks**: `spatial`, `updateSpatial`, `resetSpatial`, `immersive`, `updateImmersive`, `isAdvancedMode`.
- **DSP Mapping**:
  - Spatial Modes: `off`, `3d`, `stereo_wide`, `cinema`, `headphones`.
  - 2D Soundstage Radar: Interactive pointer tracking mapping (X, Y) to `positionX`, `positionY`, and `angle`.
  - Soundstage Width & Depth: Stereo width matrix (`width`), acoustic depth (`depth`), and virtual room reflections (`room`).
  - Immersion Enhancers: Speech clarity and sub-bass enhancement.

### C. Modular DSP Effects Rack (`EffectsRackPanel.tsx`)
- **State & Context Hooks**: `effects`, `updateEffects`, `resetEffects`.
- **DSP Mapping**:
  - Reverb: `ConvolverNode` (`wet`, `decay`, room size).
  - Tape Echo / Delay: `DelayNode` with feedback loop and damping filter (`delayTime`, `feedback`).
  - Stereo Chorus: LFO modulated delay (`rate`, `depth`).
  - Analog Saturation: `WaveShaperNode` with curve shaping types (`tape`, `tube`, `warm`, `drive`).
  - HF Air Exciter: Highpass filter + saturation (`frequency`, `amount`).
  - Noise Gate: Threshold-based gain gating (`threshold`).

### D. Channel Matrix & Pitch / Speed Studio (`ChannelMatrixPanel.tsx`)
- **State & Context Hooks**: `channel`, `updateChannels`, `balance`, `setBalance`, `pitchTempo`, `updatePitchTempo`, `resetPitchTempo`, `playbackRate`, `setPlaybackRate`.
- **DSP Mapping**:
  - Channel Routing: Stereo, Mono Sum (L+R), Swap L/R, Invert Left Phase (Ø), Invert Right Phase (Ø).
  - Balance Pan: Stereo pan balance (-1 to +1).
  - Pitch & Speed: Semitone transposition (-12 to +12 st), playback tempo rate (0.25× to 2.5×), and Key Lock (preserve pitch vs varispeed).

---

## 2. Redesign Objectives & UI/UX Guidelines

Adhering strictly to the **Obsidian Solid Matter + Restrained Liquid Glass + Editorial Music Experience** design system:
- **Zero Pill / Clean Typography**: Eliminate generic bordered candy badges; use clean tabular numerical readouts and editorial labels.
- **Micro-Interaction Budget**: $\le 200\text{ms}$ settling curves, hover states, and smooth range sliders.
- **Precision Telemetry**: Real-time gain reduction meters, soundstage radar coordinates, and frequency readouts.

---

## 3. Implementation Subphases & File Scope

### Phase 3.5A.3.1 — Architecture Audit & Planning (Current Turn)
- Finalize this planning document.

### Phase 3.5A.3.2 — Dynamics & Limiter UI Polish
- **Authorized File**: `src/components/audio-controls/DynamicsPanel.tsx`
- **Scope**: Refine compressor control cards, gain reduction meter responsiveness, pro vs. simple intensity slider, true peak limiter ceiling controls, and EBU R128 LUFS normalization selector.

### Phase 3.5A.3.3 — Spatial 3D & Channel Matrix UI Polish
- **Authorized File**: `src/components/audio-controls/SpatialAudioPanel.tsx`, `src/components/audio-controls/ChannelMatrixPanel.tsx`
- **Scope**: Polish the 2D interactive soundstage radar, azimuth/elevation readouts, stereo width slider, channel routing selector, and pitch/speed transposition controls.

### Phase 3.5A.3.4 — Effects Rack UI Polish
- **Authorized File**: `src/components/audio-controls/EffectsRackPanel.tsx`
- **Scope**: Polish modular effect cards (Reverb, Tape Echo, Chorus, Saturation, Exciter, Noise Gate) with active/bypass state distinction and tactile macro sliders.

### Phase 3.5A.3.5 — Verification & Regression Audit
- Compile applet (`compile_applet`), lint codebase (`lint_applet`), and perform end-to-end regression audit across all five studio categories.

---

## 4. Protected Systems & Integration Boundaries
- **Protected Files (Strictly Untouched)**:
  - `src/services/audioEngine.ts`
  - `src/context/MusicContext.tsx`
  - `src/context/ListenTogetherContext.tsx`
  - `src/utils/storage.ts`
  - IndexedDB schemas, background keep-alive, Media Session, YouTube bridge, and provider architecture.
- All new UI refinements will consume existing context hooks and methods without expanding state contracts.

---

## 5. Acceptance Criteria
1. Zero TypeScript compilation errors (`tsc --noEmit` passes).
2. All dynamics, spatial, channel matrix, and effects controls remain fully wired to existing audio context functions.
3. Mobile and desktop layouts adhere to safe-area spacing and responsive grid boundaries.
4. Zero regressions in audio playback or existing sound lab/EQ features.
