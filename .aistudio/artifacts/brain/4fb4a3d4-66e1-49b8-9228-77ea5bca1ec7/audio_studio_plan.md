# Implementation Plan — Phase 3.5A: Audio Studio Detailed UI/UX Redesign Planning

## 1. Existing Audio Studio Component Hierarchy & Inventory

### Rendered Component Hierarchy
- **Main View (`src/components/views/StudioView.tsx`)**:
  - Header: Studio Title, `Trim & Export` launcher, `A: RAW / B: DSP` toggle button, `Simple / Pro` mode toggle button, `Reset All` button, `Full Screen` expanded player button.
  - Spectrum & Timeline Container:
    - `<AudioVisualizer />` (`src/components/visualizer/AudioVisualizer.tsx`): Spectrum, Waveform, Frequency, Vectorscope modes.
    - `<WaveformScrubber />` (`src/components/waveform/WaveformScrubber.tsx`): Peaks visualization, A/B loop highlights, cue marker indicators.
  - Navigation Tab Bar (13 tabs):
    - `soundlab` -> `<QuickSoundControls />` (`src/components/sound-lab/QuickSoundControls.tsx`)
    - `loop` -> `<LoopABController />` (`src/components/sound-lab/LoopABController.tsx`)
    - `stereo` -> `<StereoPhaseController />` (`src/components/sound-lab/StereoPhaseController.tsx`)
    - `markers` -> `<WaveformMarkersOverlay />` (`src/components/sound-lab/WaveformMarkersOverlay.tsx`)
    - `moments` -> `<AuraMomentsPanel />` (`src/components/sound-lab/AuraMomentsPanel.tsx`)
    - `eq` -> `<Equalizer10Band />` (`src/components/audio-controls/Equalizer10Band.tsx`)
    - `dynamics` -> `<DynamicsPanel />` (`src/components/audio-controls/DynamicsPanel.tsx`)
    - `spatial` -> `<SpatialAudioPanel />` (`src/components/audio-controls/SpatialAudioPanel.tsx`)
    - `effects` -> `<EffectsRackPanel />` (`src/components/audio-controls/EffectsRackPanel.tsx`)
    - `channels` -> `<ChannelMatrixPanel />` (`src/components/audio-controls/ChannelMatrixPanel.tsx`)
    - `analysis` -> `<AudioAnalysisPanel />` (`src/components/audio-controls/AudioAnalysisPanel.tsx`)
    - `presets` -> `<PresetsProfilesPanel />` (`src/components/audio-controls/PresetsProfilesPanel.tsx`)
    - `stems` -> `<StemsPlaceholderPanel />` (`src/components/audio-controls/StemsPlaceholderPanel.tsx`)
- **Drawer Modal (`src/components/audio-controls/AudioControlCenter.tsx`)**:
  - Accessible globally via `isAudioControlsOpen`.
  - Mobile: `<MobileAudioControlSheet />`.
  - Desktop Drawer: Header, A/B toggle, Pro toggle, Reset button, 8 tabs (`overview`, `eq`, `dynamics`, `spatial`, `effects`, `channels`, `analysis`, `presets`), and Tab Content Panes.
- **Export Modal (`src/components/sound-lab/TrimExportModal.tsx`)**:
  - Non-destructive trimming and Master Lossless WAV export modal.

### Existing DSP Functionality Inventory
1. **Sound Lab Macros**: 6 macro sliders (`Bass`, `Clarity`, `Warmth`, `Spatial`, `Reverb`, `Loudness`) mapped to `MusicContext` & `audioEngine`.
2. **10-Band EQ**: 10 parametric biquad filters (31Hz–16kHz) with gain (-12dB to +12dB), preamp gain, EQ presets, and real-time Web Audio API execution.
3. **Dynamics & Limiter**: Threshold, ratio, attack, release, makeup gain (`DynamicsCompressorNode`), brickwall limiter (`LimiterNode`), and LUFS loudness normalization target.
4. **Spatial 3D & HRTF**: Stereo width widening matrix (0.0x–2.0x), 3D binaural HRTF spatial panner, azimuth/elevation positioning.
5. **Effects Rack**: Convolution/algorithmic reverb (room size, decay, wet/dry), tape saturation drive, and delay/echo.
6. **Loop A/B & Cue Markers**: Precision A/B loop boundaries, timestamped markers (`WaveformMarker`), and saved `AuraMoment` notes.
7. **Stereo & Phase Correlation**: Real-time phase correlation meter (-1 to +1), L/R energy meter, mono summing, and channel monitoring modes.
8. **Analysis & Export**: LUFS integrated loudness analysis, peak metering, offline `OfflineAudioContext` rendering, WAV blob encoding, and lossless file export.

---

## 2. Proposed Information Architecture (IA)

### 3-Zone Structured Workspace Layout
Instead of 13 fragmented tab buttons in a single long scroll bar, Phase 3.5A introduces a structured 3-zone architecture:

```
+-----------------------------------------------------------------------------------+
| ZONE 1: MASTER SIGNAL & TIMELINE HEADER                                           |
| Active Track Context | Live Spectrum Visualizer | Interactive Waveform Timeline   |
| Quick Actions: Trim & Export | A/B (RAW/DSP) Toggle | Pro Mode | Reset All DSP    |
+-----------------------------------------------------------------------------------+
| ZONE 2: PRIMARY STUDIO CATEGORY NAVIGATION                                        |
| [Tuning & Tone] [EQ & Dynamics] [Spatial & FX] [Time & Cues] [Mastering & Analysis]|
+-----------------------------------------------------------------------------------+
| ZONE 3: CONTROL SURFACE CONTAINER                                                 |
| Active Module Group Content (Obsidian Liquid Glass Tactile Surfaces & Meters)     |
+-----------------------------------------------------------------------------------+
```

### Categorized Navigation Modules
1. **Tuning & Tone**: Sound Lab Macros (`QuickSoundControls`) & Instant Mood Presets.
2. **EQ & Dynamics**: 10-Band Parametric EQ (`Equalizer10Band`) & Compressor/Limiter (`DynamicsPanel`).
3. **Spatial & FX**: Spatial 3D & HRTF (`SpatialAudioPanel`), Effects Rack (`EffectsRackPanel`), Channel Matrix (`ChannelMatrixPanel`).
4. **Time & Cues**: Precision Loop A/B (`LoopABController`), Cue Markers (`WaveformMarkersOverlay`), Aura Moments (`AuraMomentsPanel`).
5. **Mastering & Analysis**: Spectrum & LUFS Analysis (`AudioAnalysisPanel`), Hardware Presets (`PresetsProfilesPanel`), Trim & WAV Export (`TrimExportModal`).

---

## 3. Detailed Screen-by-Screen Redesign Plan

### A. Sound Lab & Macro Tuning (`QuickSoundControls.tsx`)
- **Macro Controls**: 6 tactile macro dials/faders with numerical dB / % readouts.
- **Instant Mood Grid**: Clean 2x4 card grid for instant sound profiles (*Warm & Intimate*, *Crisp & Airy*, *Heavy Club Bass*, *Vocal Forward*, *Late Night Soft*, *Studio Neutral*, *Acoustic Presence*, *Cinema Immersion*).
- **A/B Comparison**: Prominent `A: ORIGINAL / B: STUDIO DSP` status badge with live pulse indicator.

### B. 10-Band Equalizer (`Equalizer10Band.tsx`)
- **Frequency Response Curve**: SVG frequency response curve derived from the actual 10 biquad filter gains and center frequencies.
- **Vertical Faders**: 10 vertical faders for 31Hz, 63Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz with gain labels (-12dB to +12dB).
- **Preamp Gain**: Dedicated master preamp slider with clipping warning indicator.
- **Presets Bar**: Preset dropdown and quick reset button.

### C. Dynamics & Limiter (`DynamicsPanel.tsx`)
- **Compressor Controls**: Sliders for Threshold (-40dB to 0dB), Ratio (1:1 to 20:1), Attack (0.1ms to 100ms), Release (10ms to 1000ms), Makeup Gain (0dB to +24dB).
- **Limiter & Loudness**: Brickwall limiter toggle and target integrated LUFS loudness normalization selector (-14 LUFS, -16 LUFS, -18 LUFS).
- **Gain Reduction Meter**: Visual gain reduction bar showing real-time compressor attenuation.

### D. Spatial 3D & Effects (`SpatialAudioPanel.tsx` & `EffectsRackPanel.tsx`)
- **Spatial 3D Panner**: Interactive 2D azimuth/elevation panner pad for HRTF positioning.
- **Stereo Width**: Slider for 0.0x (mono) to 2.0x (ultra-wide stereo widening).
- **Effects Chain**: Reverb (Room Size, Decay Time, Wet/Dry Mix) and Tape Saturation Drive slider.
- **Capability Badges**: Clear badges identifying browser-dependent vs hardware-accelerated effects.

### E. Time, Cues & Loop A/B (`LoopABController.tsx`, `WaveformMarkersOverlay.tsx`, `AuraMomentsPanel.tsx`)
- **A/B Loop Controller**: Precise Set A, Set B, Loop Toggle, and Loop Count indicator.
- **Cue Markers Overlay**: Timestamped marker timeline with color badges, custom labels, and jump-to-marker buttons.
- **Aura Moments**: Saved timestamped listening notes with quick jump and delete options.

### F. Mastering, Analysis & Export (`AudioAnalysisPanel.tsx` & `TrimExportModal.tsx`)
- **Phase Correlation Bar**: Real-time phase meter (-1.0 out of phase to +1.0 in phase) and L/R energy meter.
- **LUFS Analysis**: Integrated LUFS measurement, peak level, and frequency distribution profile.
- **Master Lossless WAV Export**: Modal with trim start/end handles, fade-in/fade-out sliders, DSP snapshot toggle, and 24-bit/44.1kHz WAV export button.

---

## 4. Design Language & Visual Identity

- **Obsidian Solid Matter**: Deep obsidian backgrounds (`#08090d`, `#0b0d13`).
- **Restrained Liquid Glass**: Frosted container cards (`bg-[#0b0d13]/70`, `border-white/[0.08]`, `backdrop-blur-2xl`).
- **Editorial Typography**: `JetBrains Mono` for precise frequency, dB, and timestamp values; clean sans for category headings.
- **Tactile Controls**: Minimalist faders, knobs, and toggle buttons with subtle cyan/indigo accent glows.

---

## 5. Responsive Behavior

- **Desktop (1280px+)**:
  - Full 3-zone layout with side-by-side visualizer and dual-column control modules.
- **Tablet (768px–1024px)**:
  - Stacked visualizer header with responsive 2-column control grid.
- **Mobile (<768px)**:
  - Mobile sheet drawer (`MobileAudioControlSheet.tsx`).
  - Single-column touch faders with minimum 44px touch targets and bottom navigation clearance (`pb-28`).

---

## 6. Protected Systems & Integration Boundaries

- **Protected Files (MUST NOT MODIFY)**:
  - `audioEngine.ts`
  - `MusicContext.tsx`
  - `storage.ts`
  - IndexedDB schemas
  - Background audio keepalive
  - YouTube player bridge
  - Media Session integration
- **Integrity**: All Phase 3.5A UI enhancements operate strictly through existing context methods and component state without altering underlying Web Audio graph nodes or IndexedDB stores.

---

## 7. Recommended Subphases for Phase 3.5A Implementation

- **Phase 3.5A.1**: UI/UX Redesign Planning (Completed & Report Generated).
- **Phase 3.5A.2**: Studio Navigation & Sound Lab / EQ Polish (`StudioView.tsx`, `QuickSoundControls.tsx`, `Equalizer10Band.tsx`).
- **Phase 3.5A.3**: Dynamics, Spatial & Effects Rack Polish (`DynamicsPanel.tsx`, `SpatialAudioPanel.tsx`, `EffectsRackPanel.tsx`).
- **Phase 3.5A.4**: Loop A/B, Markers, Analysis & Export Polish (`LoopABController.tsx`, `AudioAnalysisPanel.tsx`, `TrimExportModal.tsx`).
- **Phase 3.5A.5**: Verification, Compilation & Static Audit (`compile_applet`, `lint_applet`).
