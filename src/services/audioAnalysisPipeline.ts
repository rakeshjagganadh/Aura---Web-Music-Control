import { Track } from '../types';
import { audioEngine } from './audioEngine';

export type AnalysisCapabilityState =
  | 'ANALYSIS_AVAILABLE'
  | 'ANALYSIS_UNAVAILABLE'
  | 'ANALYSIS_SILENT'
  | 'ANALYSIS_INITIALIZING';

export type AnalysisSourceType =
  | 'local'
  | 'audius'
  | 'jamendo'
  | 'radiobrowser'
  | 'curated_stream'
  | 'youtube'
  | 'none';

export interface AudioAnalysisFrame {
  capability: AnalysisCapabilityState;
  sourceId: string;
  sourceType: AnalysisSourceType;
  sourceLabel: string;
  unavailableReason: string | null;
  frequencyBins: Uint8Array;
  timeDomain: Float32Array;
  bands: Float32Array;
  bandPeaks: Float32Array;
  bandCenterHz: Float32Array;
  waveformPoints: Float32Array;
  rms: number;
  peak: number;
  lowEnergy: number;
  midEnergy: number;
  highEnergy: number;
  waveformGain: number;
  sampleRate: number;
  isPlaying: boolean;
}

const BAND_COUNT = 64;
const FFT_BIN_COUNT = 1024; // fftSize = 2048
const TIME_DOMAIN_SAMPLES = 2048;
const WAVEFORM_POINT_COUNT = 256;
const WAVEFORM_WINDOW_SAMPLES = 768;
const MIN_FREQ_HZ = 28;
const MAX_FREQ_HZ = 16000;

interface BandBinRange {
  exactStart: number;
  exactEnd: number;
  weight: number;
  centerHz: number;
}

function normalizeSourceType(track: Track | null): AnalysisSourceType {
  if (!track) return 'none';
  switch (track.source) {
    case 'youtube':
      return 'youtube';
    case 'audius':
      return 'audius';
    case 'jamendo':
      return 'jamendo';
    case 'radio':
    case 'radiobrowser':
      return 'radiobrowser';
    case 'curated_stream':
    case 'web_stream':
      return 'curated_stream';
    case 'local':
    default:
      return 'local';
  }
}

function getSourceLabel(sourceType: AnalysisSourceType): string {
  switch (sourceType) {
    case 'local':
      return 'LOCAL';
    case 'audius':
      return 'AUDIUS';
    case 'jamendo':
      return 'JAMENDO';
    case 'radiobrowser':
      return 'RADIO';
    case 'curated_stream':
      return 'STREAM';
    case 'youtube':
      return 'YOUTUBE EMBED';
    default:
      return 'STANDBY';
  }
}

class SharedAudioAnalysisPipeline {
  private rawFreqBins = new Uint8Array(FFT_BIN_COUNT);
  private rawTimeDomain = new Float32Array(TIME_DOMAIN_SAMPLES);
  private bands = new Float32Array(BAND_COUNT);
  private bandPeaks = new Float32Array(BAND_COUNT);
  private bandPeakHoldTimers = new Float32Array(BAND_COUNT);
  private bandCenterHz = new Float32Array(BAND_COUNT);
  private waveformPoints = new Float32Array(WAVEFORM_POINT_COUNT);

  private cachedRanges: BandBinRange[] = [];
  private cachedSampleRate = 0;
  private cachedBinCount = 0;

  private lastSourceId = '';
  private lastSampleTimeMs = 0;
  private silentDurationMs = 0;
  private startupGraceMs = 0;
  private waveformGain = 1.4;

  private frame: AudioAnalysisFrame = {
    capability: 'ANALYSIS_SILENT',
    sourceId: 'none',
    sourceType: 'none',
    sourceLabel: 'STANDBY',
    unavailableReason: null,
    frequencyBins: this.rawFreqBins,
    timeDomain: this.rawTimeDomain,
    bands: this.bands,
    bandPeaks: this.bandPeaks,
    bandCenterHz: this.bandCenterHz,
    waveformPoints: this.waveformPoints,
    rms: 0,
    peak: 0,
    lowEnergy: 0,
    midEnergy: 0,
    highEnergy: 0,
    waveformGain: 1.4,
    sampleRate: 44100,
    isPlaying: false,
  };

  constructor() {
    this.rebuildBandTable(44100, FFT_BIN_COUNT);
  }

  private rebuildBandTable(sampleRate: number, binCount: number): void {
    const nyquist = sampleRate * 0.5;
    const binHz = nyquist / binCount;
    const fMax = Math.min(MAX_FREQ_HZ, nyquist * 0.92);
    const ratio = fMax / MIN_FREQ_HZ;

    this.cachedRanges = new Array(BAND_COUNT);
    for (let i = 0; i < BAND_COUNT; i++) {
      const fLow = MIN_FREQ_HZ * Math.pow(ratio, i / BAND_COUNT);
      const fHigh = MIN_FREQ_HZ * Math.pow(ratio, (i + 1) / BAND_COUNT);
      const centerHz = Math.sqrt(fLow * fHigh);

      // Gentle perceptual spectral tilt compensation:
      // prevents sub-bass from dominating while keeping mids detailed & highs crisp
      const octavesFrom1k = Math.log2(centerHz / 1000);
      const tiltWeight =
        centerHz < 110
          ? 0.78 + ((centerHz - MIN_FREQ_HZ) / 82) * 0.12
          : centerHz < 1000
          ? 0.9 + ((centerHz - 110) / 890) * 0.1
          : Math.min(1.32, 1.0 + octavesFrom1k * 0.085);

      this.bandCenterHz[i] = centerHz;
      this.cachedRanges[i] = {
        exactStart: Math.max(0.5, fLow / binHz),
        exactEnd: Math.min(binCount - 1, fHigh / binHz),
        weight: tiltWeight,
        centerHz,
      };
    }

    this.cachedSampleRate = sampleRate;
    this.cachedBinCount = binCount;
  }

  public reset(): void {
    this.rawFreqBins.fill(0);
    this.rawTimeDomain.fill(0);
    this.bands.fill(0);
    this.bandPeaks.fill(0);
    this.bandPeakHoldTimers.fill(0);
    this.waveformPoints.fill(0);
    this.waveformGain = 1.4;
    this.silentDurationMs = 0;
    this.startupGraceMs = 0;
    this.frame.rms = 0;
    this.frame.peak = 0;
    this.frame.lowEnergy = 0;
    this.frame.midEnergy = 0;
    this.frame.highEnergy = 0;
  }

  private decayBuffers(dt: number, rate: number): void {
    const decayFactor = Math.exp(-dt * rate);
    for (let i = 0; i < BAND_COUNT; i++) {
      this.bands[i] *= decayFactor;
      if (this.bands[i] < 0.002) this.bands[i] = 0;
      this.bandPeaks[i] = Math.max(this.bands[i], this.bandPeaks[i] * Math.exp(-dt * (rate * 0.55)));
      if (this.bandPeaks[i] < 0.002) this.bandPeaks[i] = 0;
    }
    for (let i = 0; i < WAVEFORM_POINT_COUNT; i++) {
      this.waveformPoints[i] *= decayFactor;
      if (Math.abs(this.waveformPoints[i]) < 0.0015) this.waveformPoints[i] = 0;
    }
    this.frame.rms *= decayFactor;
    this.frame.peak *= decayFactor;
    this.frame.lowEnergy *= decayFactor;
    this.frame.midEnergy *= decayFactor;
    this.frame.highEnergy *= decayFactor;
  }

  private findTriggerOffset(): number {
    const searchLimit = Math.min(TIME_DOMAIN_SAMPLES - WAVEFORM_WINDOW_SAMPLES - 1, 1024);
    let bestIdx = 0;
    let bestSlope = 0;

    for (let i = 2; i < searchLimit; i++) {
      const prev = this.rawTimeDomain[i - 1];
      const curr = this.rawTimeDomain[i];
      if (prev < 0 && curr >= 0) {
        const slope = curr - prev;
        // Prefer first clean positive-going zero crossing with solid slope
        if (slope > 0.003 && this.rawTimeDomain[i + 2] > 0) {
          return i;
        }
        if (slope > bestSlope) {
          bestSlope = slope;
          bestIdx = i;
        }
      }
    }
    return bestIdx;
  }

  public sample(track: Track | null, isPlaying: boolean, nowMs: number = performance.now()): AudioAnalysisFrame {
    const dt = this.lastSampleTimeMs > 0 ? Math.min(0.08, Math.max(0.001, (nowMs - this.lastSampleTimeMs) / 1000)) : 0.016;
    this.lastSampleTimeMs = nowMs;

    const sourceId = track?.id || 'none';
    const sourceType = normalizeSourceType(track);
    const sourceLabel = getSourceLabel(sourceType);
    const engineState = audioEngine.getAnalysisSourceState();

    if (sourceId !== this.lastSourceId) {
      this.reset();
      this.lastSourceId = sourceId;
    }

    if (
      engineState.sampleRate > 0 &&
      (engineState.sampleRate !== this.cachedSampleRate || engineState.binCount !== this.cachedBinCount)
    ) {
      this.rebuildBandTable(engineState.sampleRate, Math.min(FFT_BIN_COUNT, engineState.binCount));
    }

    this.frame.sourceId = sourceId;
    this.frame.sourceType = sourceType;
    this.frame.sourceLabel = sourceLabel;
    this.frame.sampleRate = engineState.sampleRate;
    this.frame.isPlaying = isPlaying;

    // 1. No active track
    if (!track || sourceType === 'none') {
      this.decayBuffers(dt, 20);
      this.frame.capability = 'ANALYSIS_SILENT';
      this.frame.unavailableReason = null;
      return this.frame;
    }

    // 2. YouTube official IFrame isolation (no raw PCM / AnalyserNode access allowed by cross-origin IFrame)
    if (sourceType === 'youtube') {
      this.reset();
      this.frame.capability = 'ANALYSIS_UNAVAILABLE';
      this.frame.unavailableReason = 'Official YouTube IFrame isolates raw audio from browser analysis.';
      return this.frame;
    }

    // 3. Cross-origin stream fallback where remote server blocked CORS headers
    if (engineState.isDirectStreaming) {
      this.reset();
      this.frame.capability = 'ANALYSIS_UNAVAILABLE';
      this.frame.unavailableReason = 'Stream server restricts CORS Web Audio access.';
      return this.frame;
    }

    // 4. Paused or stopped playback
    if (!isPlaying) {
      this.decayBuffers(dt, 18);
      this.silentDurationMs = 0;
      this.startupGraceMs = 0;
      this.frame.capability = 'ANALYSIS_SILENT';
      this.frame.unavailableReason = null;
      return this.frame;
    }

    // 5. AudioContext or track load still initializing / resuming
    if (
      engineState.contextState === 'uninitialized' ||
      engineState.contextState === 'suspended' ||
      engineState.activeTrackId !== track.id ||
      !engineState.isEnginePlaying
    ) {
      this.decayBuffers(dt, 14);
      this.startupGraceMs += dt * 1000;
      this.frame.capability = 'ANALYSIS_INITIALIZING';
      this.frame.unavailableReason = null;
      return this.frame;
    }

    // 6. Read real 2048-sample time-domain and 1024-bin frequency-domain data
    const hasFreq = audioEngine.getVisualizerFrequencyData(this.rawFreqBins);
    const hasTime = audioEngine.getVisualizerFloatTimeDomainData(this.rawTimeDomain);

    if (!hasFreq || !hasTime) {
      this.decayBuffers(dt, 16);
      this.frame.capability = 'ANALYSIS_INITIALIZING';
      this.frame.unavailableReason = null;
      return this.frame;
    }

    // Compute exact RMS and Peak over time-domain buffer
    let sumSq = 0;
    let peak = 0;
    for (let i = 0; i < TIME_DOMAIN_SAMPLES; i++) {
      const s = this.rawTimeDomain[i];
      const abs = s < 0 ? -s : s;
      if (abs > peak) peak = abs;
      sumSq += s * s;
    }
    const rms = Math.sqrt(sumSq / TIME_DOMAIN_SAMPLES);

    // Check genuine audio silence (e.g., muted element, intro silence, silent file)
    const isBelowSilenceFloor = rms < 0.0008 && peak < 0.0022;
    if (isBelowSilenceFloor || engineState.isAudioMuted) {
      this.silentDurationMs += dt * 1000;
      this.decayBuffers(dt, 16);
      this.frame.rms = rms;
      this.frame.peak = peak;
      this.frame.capability =
        engineState.isAudioMuted || this.silentDurationMs > 280
          ? 'ANALYSIS_SILENT'
          : 'ANALYSIS_INITIALIZING';
      this.frame.unavailableReason = null;
      return this.frame;
    }

    this.silentDurationMs = 0;
    this.frame.capability = 'ANALYSIS_AVAILABLE';
    this.frame.unavailableReason = null;
    this.frame.rms = rms;
    this.frame.peak = peak;

    // 7. Compute 64 logarithmically distributed spectrum bands with asymmetric attack/decay smoothing
    const attackAlpha = 1 - Math.exp(-dt * 28);
    const releaseAlpha = 1 - Math.exp(-dt * 11);

    let lowSum = 0;
    let midSum = 0;
    let highSum = 0;

    for (let b = 0; b < BAND_COUNT; b++) {
      const range = this.cachedRanges[b];
      const idxStart = Math.floor(range.exactStart);
      const idxEnd = Math.floor(range.exactEnd);

      let rawVal = 0;
      if (idxEnd <= idxStart) {
        // Interpolate low-frequency bands cleanly across adjacent FFT bins
        const frac = range.exactStart - idxStart;
        const v0 = this.rawFreqBins[idxStart] || 0;
        const v1 = this.rawFreqBins[Math.min(FFT_BIN_COUNT - 1, idxStart + 1)] || v0;
        rawVal = (v0 + (v1 - v0) * frac) / 255;
      } else {
        let sum = 0;
        let maxBin = 0;
        let count = 0;
        const clampedEnd = Math.min(FFT_BIN_COUNT - 1, idxEnd);
        for (let k = idxStart; k <= clampedEnd; k++) {
          const val = this.rawFreqBins[k];
          sum += val;
          if (val > maxBin) maxBin = val;
          count++;
        }
        const meanVal = count > 0 ? sum / count : 0;
        rawVal = (maxBin * 0.65 + meanVal * 0.35) / 255;
      }

      // Noise floor trim + perceptual spectral balance
      const trimmed = Math.max(0, (rawVal - 0.025) / 0.975);
      const target = Math.min(1, Math.pow(trimmed, 0.92) * range.weight);

      const prev = this.bands[b];
      const alpha = target > prev ? attackAlpha : releaseAlpha;
      const next = prev + (target - prev) * alpha;
      this.bands[b] = next < 0.002 ? 0 : next;

      // Peak hold with brief dwell before gravity release
      if (this.bands[b] >= this.bandPeaks[b]) {
        this.bandPeaks[b] = this.bands[b];
        this.bandPeakHoldTimers[b] = 0.14;
      } else if (this.bandPeakHoldTimers[b] > 0) {
        this.bandPeakHoldTimers[b] -= dt;
      } else {
        this.bandPeaks[b] = Math.max(this.bands[b], this.bandPeaks[b] - dt * 0.45);
      }

      if (b < 16) lowSum += this.bands[b];
      else if (b < 43) midSum += this.bands[b];
      else highSum += this.bands[b];
    }

    this.frame.lowEnergy = Math.min(1, lowSum / 16);
    this.frame.midEnergy = Math.min(1, midSum / 27);
    this.frame.highEnergy = Math.min(1, highSum / 21);

    // 8. Compute trigger-locked, dynamically scaled time-domain oscilloscope waveform
    const desiredGain = Math.min(6.0, Math.max(1.0, 0.72 / Math.max(peak, rms * 1.9, 0.045)));
    const gainAlpha = 1 - Math.exp(-dt * 5.2);
    this.waveformGain += (desiredGain - this.waveformGain) * gainAlpha;
    this.frame.waveformGain = this.waveformGain;

    const triggerOffset = this.findTriggerOffset();
    const step = (WAVEFORM_WINDOW_SAMPLES - 1) / (WAVEFORM_POINT_COUNT - 1);
    const waveBlend = 1 - Math.exp(-dt * 34);

    for (let i = 0; i < WAVEFORM_POINT_COUNT; i++) {
      const samplePos = triggerOffset + i * step;
      const idx0 = Math.floor(samplePos);
      const idx1 = Math.min(TIME_DOMAIN_SAMPLES - 1, idx0 + 1);
      const frac = samplePos - idx0;
      const interp = this.rawTimeDomain[idx0] + (this.rawTimeDomain[idx1] - this.rawTimeDomain[idx0]) * frac;

      const scaled = interp * this.waveformGain;
      // Soft peak saturation above 0.9 to preserve dynamic detail without hard clipping
      const shaped = Math.abs(scaled) > 0.85 ? Math.tanh(scaled * 0.95) : scaled;
      const clamped = Math.max(-1, Math.min(1, shaped));
      this.waveformPoints[i] = this.waveformPoints[i] + (clamped - this.waveformPoints[i]) * waveBlend;
    }

    return this.frame;
  }
}

export const audioAnalysisPipeline = new SharedAudioAnalysisPipeline();
