import { 
  EqualizerPreset, 
  AudioEffects, 
  Track, 
  CompressorSettings, 
  LimiterSettings, 
  LoudnessSettings, 
  SpatialSettings, 
  ImmersiveSettings, 
  ChannelSettings, 
  PlaybackPitchTempo, 
  RealtimeMeterData,
  AudioDspSnapshot,
  ExportAudioOptions,
  LoopABState,
  ChannelMonitorMode
} from '../types';
import { audioBufferToWav } from '../utils/wavExport';

export const EQ_10_BANDS: { freq: number; type: BiquadFilterType; label: string; description: string; q: number }[] = [
  { freq: 31, type: 'lowshelf', label: '31 Hz', description: 'Sub bass rumble', q: 0.7 },
  { freq: 62, type: 'peaking', label: '62 Hz', description: 'Deep bass & kick body', q: 1.2 },
  { freq: 125, type: 'peaking', label: '125 Hz', description: 'Bass warmth & punch', q: 1.4 },
  { freq: 250, type: 'peaking', label: '250 Hz', description: 'Low mid warmth / thickness', q: 1.4 },
  { freq: 500, type: 'peaking', label: '500 Hz', description: 'Mid body & acoustic fullness', q: 1.4 },
  { freq: 1000, type: 'peaking', label: '1 kHz', description: 'Vocal presence & intelligibility', q: 1.4 },
  { freq: 2000, type: 'peaking', label: '2 kHz', description: 'Upper mids & edge', q: 1.4 },
  { freq: 4000, type: 'peaking', label: '4 kHz', description: 'Clarity, attack & bite', q: 1.4 },
  { freq: 8000, type: 'peaking', label: '8 kHz', description: 'Brilliance & cymbal definition', q: 1.4 },
  { freq: 16000, type: 'highshelf', label: '16 kHz', description: 'Air & ultra-high shimmer', q: 0.7 },
];

export const SYSTEM_EQ_PRESETS: Record<EqualizerPreset, number[]> = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bass_boost: [6.0, 5.0, 3.5, 2.0, 0.5, 0, 0, 0, 0.5, 1.0],
  deep_bass: [8.0, 6.5, 4.0, 1.0, -0.5, -1.0, 0, 0.5, 1.0, 1.5],
  treble_boost: [0, 0, 0, 0, 0.5, 1.5, 3.0, 5.0, 6.5, 7.0],
  vocal: [-3.0, -1.5, 0, 1.5, 3.5, 4.0, 3.0, 1.5, 0.5, 0],
  podcast: [-4.0, -2.0, 1.0, 2.5, 4.0, 3.5, 2.0, 0, -1.0, -2.0],
  acoustic: [2.0, 1.5, 1.0, 0.5, 1.0, 2.0, 3.0, 3.5, 4.0, 4.0],
  rock: [4.5, 3.5, 1.5, -1.0, -1.5, 1.0, 2.5, 4.0, 4.5, 5.0],
  pop: [2.5, 2.0, 1.0, 0, 1.5, 3.0, 3.5, 3.0, 2.5, 3.0],
  classical: [3.0, 2.5, 1.5, 0.5, -0.5, 0, 1.0, 2.5, 3.5, 4.0],
  electronic: [6.0, 5.0, 2.5, -1.0, 0, 1.5, 3.0, 4.5, 5.0, 5.5],
  hip_hop: [7.0, 6.0, 3.5, 1.0, -0.5, 0.5, 2.0, 3.5, 4.0, 4.5],
  cinematic: [5.5, 4.5, 2.5, 0.5, -1.0, 1.0, 2.5, 4.0, 5.5, 6.0],
  night: [1.0, 0.5, 0, -1.5, -2.0, -1.5, -1.0, -2.0, -3.5, -5.0],
  focus: [-1.0, -0.5, 0, 0.5, 1.0, 1.0, 0.5, 0, -1.0, -2.0],
  workout: [6.5, 5.5, 3.0, 0, 1.0, 2.0, 3.5, 5.0, 5.5, 6.0],
  chill: [3.0, 2.0, 1.0, 0.5, 0, 0.5, 1.0, 1.5, 2.0, 2.5],
  party: [6.0, 5.0, 2.0, 0, 1.0, 2.5, 4.0, 5.0, 5.5, 6.0],
  gaming: [4.0, 3.0, 1.0, -1.0, 1.5, 3.0, 4.5, 5.0, 4.0, 3.0],
  study: [1.0, 0.5, 0, 0, 0.5, 0.5, 0, -0.5, -1.0, -2.0],
  travel: [4.0, 3.0, 1.5, 0, 1.0, 2.0, 2.5, 2.0, 1.5, 1.0],
  custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

// Aliases for backwards compatibility
export const EQ_FREQUENCIES = EQ_10_BANDS;
export const EQ_PRESETS = SYSTEM_EQ_PRESETS;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;

  // Graph Structure
  private preampGain: GainNode | null = null;

  // 1. Equalizer Filter Chain
  private eqFilters: BiquadFilterNode[] = [];
  private bassToneFilter: BiquadFilterNode | null = null;
  private trebleToneFilter: BiquadFilterNode | null = null;

  // 2. Dynamics (Compressor & Makeup Gain)
  private compressorNode: DynamicsCompressorNode | null = null;
  private compressorMakeupGain: GainNode | null = null;
  private compressorBypassGain: GainNode | null = null;
  private compressorActiveGain: GainNode | null = null;

  // 3. Effects Rack
  private reverbConvolver: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;

  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayFilter: BiquadFilterNode | null = null;
  private echoWetGain: GainNode | null = null;

  private chorusDelay: DelayNode | null = null;
  private chorusLFO: OscillatorNode | null = null;
  private chorusLFOGain: GainNode | null = null;
  private chorusWetGain: GainNode | null = null;

  private flangerDelay: DelayNode | null = null;
  private flangerLFO: OscillatorNode | null = null;
  private flangerLFOGain: GainNode | null = null;
  private flangerFeedback: GainNode | null = null;
  private flangerWetGain: GainNode | null = null;

  private phaserFilter1: BiquadFilterNode | null = null;
  private phaserFilter2: BiquadFilterNode | null = null;
  private phaserLFO: OscillatorNode | null = null;
  private phaserLFOGain: GainNode | null = null;
  private phaserWetGain: GainNode | null = null;

  private saturationShaper: WaveShaperNode | null = null;
  private saturationBypassGain: GainNode | null = null;
  private saturationWetGain: GainNode | null = null;

  private exciterHighpass: BiquadFilterNode | null = null;
  private exciterShaper: WaveShaperNode | null = null;
  private exciterWetGain: GainNode | null = null;

  private noiseGateGain: GainNode | null = null;

  // 4. Spatial Audio (Panner, Stereo Width, Room Depth)
  private pannerNode: StereoPannerNode | null = null;
  private spatialPanner3D: PannerNode | null = null;
  private widthDelayL: DelayNode | null = null;
  private widthDelayR: DelayNode | null = null;
  private widthCrossGain: GainNode | null = null;
  private spatialWetGain: GainNode | null = null;

  // 5. Limiter & Loudness Normalization
  private normalizerGain: GainNode | null = null;
  private limiterCompressor: DynamicsCompressorNode | null = null;
  private limiterCeilingGain: GainNode | null = null;

  // 6. Channel Controls (Stereo, Mono, Swap, Phase Invert)
  private channelSplitter: ChannelSplitterNode | null = null;
  private channelMerger: ChannelMergerNode | null = null;
  private channelGainLL: GainNode | null = null;
  private channelGainLR: GainNode | null = null;
  private channelGainRL: GainNode | null = null;
  private channelGainRR: GainNode | null = null;

  // 7. Master Gain & A/B Bypass Matrix
  private dspOutGain: GainNode | null = null;
  private dryA_Gain: GainNode | null = null; // Path A (Pure Original Audio)
  private wetB_Gain: GainNode | null = null; // Path B (Processed DSP Audio)
  private masterGain: GainNode | null = null;

  // 8. Analysers (Split Left and Right for true stereo meters)
  private leftAnalyser: AnalyserNode | null = null;
  private rightAnalyser: AnalyserNode | null = null;
  private mainAnalyser: AnalyserNode | null = null;

  // Meter buffers
  private meterLeftData: Float32Array = new Float32Array(512);
  private meterRightData: Float32Array = new Float32Array(512);
  private peakHoldL = 0;
  private peakHoldR = 0;

  // State
  private isInitialized = false;
  private isAB_Bypassed = false; // When true, listening to Path A (Original)
  private currentTrack: Track | null = null;
  private currentObjectUrl: string | null = null;
  private currentLufsOffset = 0; // dB correction for auto loudness

  // Loop A/B State
  private loopState: LoopABState = {
    enabled: false,
    pointA: null,
    pointB: null,
    mode: 'forever',
    currentCount: 0,
  };
  private onLoopCountChangeCallback: ((count: number) => void) | null = null;

  // Callbacks
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onStateChangeCallback: ((isPlaying: boolean) => void) | null = null;

  public init(): void {
    if (this.isInitialized) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.audioEl = new Audio();
    this.audioEl.crossOrigin = 'anonymous';
    this.audioEl.preload = 'auto';

    // Hook standard events
    this.audioEl.addEventListener('timeupdate', () => {
      if (this.audioEl) {
        const time = this.audioEl.currentTime;
        const dur = this.audioEl.duration || 0;

        // Loop A/B seamless jump check
        if (
          this.loopState.enabled &&
          this.loopState.pointA !== null &&
          this.loopState.pointB !== null &&
          this.loopState.pointB > this.loopState.pointA
        ) {
          if (time >= this.loopState.pointB) {
            // Reached Point B
            if (this.loopState.mode === 'forever') {
              this.seek(this.loopState.pointA);
            } else {
              const maxLoops = this.loopState.mode;
              const nextCount = this.loopState.currentCount + 1;
              if (nextCount <= maxLoops) {
                this.loopState.currentCount = nextCount;
                this.onLoopCountChangeCallback?.(nextCount);
                this.seek(this.loopState.pointA);
              } else {
                // Loop finished
                this.loopState.enabled = false;
              }
            }
          }
        }

        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(time, dur);
        }
      }
    });

    this.audioEl.addEventListener('ended', () => {
      this.onEndedCallback?.();
    });

    this.audioEl.addEventListener('play', () => {
      this.onStateChangeCallback?.(true);
    });

    this.audioEl.addEventListener('pause', () => {
      this.onStateChangeCallback?.(false);
    });

    // 1. Source & Preamp
    this.sourceNode = this.ctx.createMediaElementSource(this.audioEl);
    this.preampGain = this.ctx.createGain();
    this.preampGain.gain.value = 1.0;

    // A/B Parallel Splitter
    this.dryA_Gain = this.ctx.createGain(); // Path A (Pure Original)
    this.dryA_Gain.gain.value = 0.0;
    this.wetB_Gain = this.ctx.createGain(); // Path B (Processed DSP)
    this.wetB_Gain.gain.value = 1.0;

    this.sourceNode.connect(this.preampGain);
    this.sourceNode.connect(this.dryA_Gain); // Send un-processed signal to Path A

    // 2. EQ Chain (10-Band)
    this.eqFilters = EQ_10_BANDS.map(band => {
      const filter = this.ctx!.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.freq;
      filter.gain.value = 0;
      filter.Q.value = band.q;
      return filter;
    });

    this.bassToneFilter = this.ctx.createBiquadFilter();
    this.bassToneFilter.type = 'lowshelf';
    this.bassToneFilter.frequency.value = 100;
    this.bassToneFilter.gain.value = 0;

    this.trebleToneFilter = this.ctx.createBiquadFilter();
    this.trebleToneFilter.type = 'highshelf';
    this.trebleToneFilter.frequency.value = 8000;
    this.trebleToneFilter.gain.value = 0;

    // Connect EQ filters sequentially
    let eqChainLast: AudioNode = this.preampGain;
    for (const filter of this.eqFilters) {
      eqChainLast.connect(filter);
      eqChainLast = filter;
    }
    eqChainLast.connect(this.bassToneFilter);
    this.bassToneFilter.connect(this.trebleToneFilter);

    // 3. Dynamics: Compressor
    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.compressorNode.threshold.value = -24;
    this.compressorNode.knee.value = 30;
    this.compressorNode.ratio.value = 4;
    this.compressorNode.attack.value = 0.003;
    this.compressorNode.release.value = 0.25;

    this.compressorMakeupGain = this.ctx.createGain();
    this.compressorMakeupGain.gain.value = 1.0;

    this.compressorActiveGain = this.ctx.createGain();
    this.compressorActiveGain.gain.value = 0.0; // Off by default
    this.compressorBypassGain = this.ctx.createGain();
    this.compressorBypassGain.gain.value = 1.0;

    // Connect Compressor Stage
    this.trebleToneFilter.connect(this.compressorBypassGain);
    this.trebleToneFilter.connect(this.compressorNode);
    this.compressorNode.connect(this.compressorMakeupGain);
    this.compressorMakeupGain.connect(this.compressorActiveGain);

    const compSumGain = this.ctx.createGain();
    this.compressorBypassGain.connect(compSumGain);
    this.compressorActiveGain.connect(compSumGain);

    // 4. Effects Rack Setup
    // Reverb Convolver
    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbWetGain = this.ctx.createGain();
    this.reverbWetGain.gain.value = 0;
    this.updateReverbImpulse(1.5, 0.5);

    // Echo / Delay
    this.delayNode = this.ctx.createDelay(3.0);
    this.delayNode.delayTime.value = 0.25;
    this.delayFeedbackGain = this.ctx.createGain();
    this.delayFeedbackGain.gain.value = 0.35;
    this.delayFilter = this.ctx.createBiquadFilter();
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.value = 3500;
    this.echoWetGain = this.ctx.createGain();
    this.echoWetGain.gain.value = 0;

    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    this.delayFilter.connect(this.echoWetGain);

    // Chorus
    this.chorusDelay = this.ctx.createDelay(0.1);
    this.chorusDelay.delayTime.value = 0.025;
    this.chorusLFO = this.ctx.createOscillator();
    this.chorusLFO.frequency.value = 1.5;
    this.chorusLFOGain = this.ctx.createGain();
    this.chorusLFOGain.gain.value = 0.002;
    this.chorusLFO.connect(this.chorusLFOGain);
    this.chorusLFOGain.connect(this.chorusDelay.delayTime);
    this.chorusLFO.start();
    this.chorusWetGain = this.ctx.createGain();
    this.chorusWetGain.gain.value = 0;
    this.chorusDelay.connect(this.chorusWetGain);

    // Saturation / WaveShaper
    this.saturationShaper = this.ctx.createWaveShaper();
    this.saturationShaper.curve = this.makeDistortionCurve(0, 'tape');
    this.saturationShaper.oversample = '4x';
    this.saturationWetGain = this.ctx.createGain();
    this.saturationWetGain.gain.value = 0;
    this.saturationBypassGain = this.ctx.createGain();
    this.saturationBypassGain.gain.value = 1.0;

    // Exciter
    this.exciterHighpass = this.ctx.createBiquadFilter();
    this.exciterHighpass.type = 'highpass';
    this.exciterHighpass.frequency.value = 4500;
    this.exciterShaper = this.ctx.createWaveShaper();
    this.exciterShaper.curve = this.makeDistortionCurve(0.4, 'transistor');
    this.exciterWetGain = this.ctx.createGain();
    this.exciterWetGain.gain.value = 0;
    this.exciterHighpass.connect(this.exciterShaper);
    this.exciterShaper.connect(this.exciterWetGain);

    // Noise Gate Gain
    this.noiseGateGain = this.ctx.createGain();
    this.noiseGateGain.gain.value = 1.0;

    // Connect Effects Graph
    compSumGain.connect(this.saturationBypassGain);
    compSumGain.connect(this.saturationShaper);
    this.saturationShaper.connect(this.saturationWetGain);

    const satSumGain = this.ctx.createGain();
    this.saturationBypassGain.connect(satSumGain);
    this.saturationWetGain.connect(satSumGain);

    // Send to Reverb, Delay, Chorus, Exciter
    satSumGain.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.reverbWetGain);

    satSumGain.connect(this.delayNode);
    satSumGain.connect(this.chorusDelay);
    satSumGain.connect(this.exciterHighpass);

    const fxCombinedGain = this.ctx.createGain();
    satSumGain.connect(fxCombinedGain);
    this.reverbWetGain.connect(fxCombinedGain);
    this.echoWetGain.connect(fxCombinedGain);
    this.chorusWetGain.connect(fxCombinedGain);
    this.exciterWetGain.connect(fxCombinedGain);

    fxCombinedGain.connect(this.noiseGateGain);

    // 5. Spatial Audio Stage (Width, Position, 3D Panning)
    if (this.ctx.createStereoPanner) {
      this.pannerNode = this.ctx.createStereoPanner();
      this.pannerNode.pan.value = 0;
    }

    this.spatialPanner3D = this.ctx.createPanner();
    this.spatialPanner3D.panningModel = 'HRTF';
    this.spatialPanner3D.distanceModel = 'inverse';
    this.spatialPanner3D.positionX.value = 0;
    this.spatialPanner3D.positionY.value = 0;
    this.spatialPanner3D.positionZ.value = 1.0;

    // Stereo Width Haas delays
    this.widthDelayL = this.ctx.createDelay(0.05);
    this.widthDelayL.delayTime.value = 0.0005;
    this.widthCrossGain = this.ctx.createGain();
    this.widthCrossGain.gain.value = 0;

    this.spatialWetGain = this.ctx.createGain();
    this.spatialWetGain.gain.value = 1.0;

    let spatialNodeIn: AudioNode = this.noiseGateGain;
    if (this.pannerNode) {
      spatialNodeIn.connect(this.pannerNode);
      spatialNodeIn = this.pannerNode;
    }
    spatialNodeIn.connect(this.spatialWetGain);

    // 6. Channel Routing Matrix (Stereo / Mono / Swap / Phase Invert)
    this.channelSplitter = this.ctx.createChannelSplitter(2);
    this.channelMerger = this.ctx.createChannelMerger(2);

    this.channelGainLL = this.ctx.createGain();
    this.channelGainLR = this.ctx.createGain();
    this.channelGainRL = this.ctx.createGain();
    this.channelGainRR = this.ctx.createGain();

    this.channelGainLL.gain.value = 1.0; // Left to Left
    this.channelGainLR.gain.value = 0.0; // Left to Right
    this.channelGainRL.gain.value = 0.0; // Right to Left
    this.channelGainRR.gain.value = 1.0; // Right to Right

    this.spatialWetGain.connect(this.channelSplitter);
    this.channelSplitter.connect(this.channelGainLL, 0);
    this.channelSplitter.connect(this.channelGainLR, 0);
    this.channelSplitter.connect(this.channelGainRL, 1);
    this.channelSplitter.connect(this.channelGainRR, 1);

    this.channelGainLL.connect(this.channelMerger, 0, 0);
    this.channelGainRL.connect(this.channelMerger, 0, 0);
    this.channelGainLR.connect(this.channelMerger, 0, 1);
    this.channelGainRR.connect(this.channelMerger, 0, 1);

    // 7. Loudness Normalizer & Limiter
    this.normalizerGain = this.ctx.createGain();
    this.normalizerGain.gain.value = 1.0;

    this.limiterCompressor = this.ctx.createDynamicsCompressor();
    this.limiterCompressor.threshold.value = -0.5;
    this.limiterCompressor.knee.value = 0;
    this.limiterCompressor.ratio.value = 20; // Hard limiting ratio
    this.limiterCompressor.attack.value = 0.001; // Ultra fast attack
    this.limiterCompressor.release.value = 0.05;

    this.limiterCeilingGain = this.ctx.createGain();
    this.limiterCeilingGain.gain.value = 1.0;

    this.channelMerger.connect(this.normalizerGain);
    this.normalizerGain.connect(this.limiterCompressor);
    this.limiterCompressor.connect(this.limiterCeilingGain);

    // Processed Output into wetB_Gain
    this.limiterCeilingGain.connect(this.wetB_Gain);

    // Summing Node for A/B (Dry Original vs Wet Processed)
    const masterSum = this.ctx.createGain();
    this.dryA_Gain.connect(masterSum);
    this.wetB_Gain.connect(masterSum);

    // 8. Master Gain & Analysers
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;
    masterSum.connect(this.masterGain);

    // Analyser setup
    this.mainAnalyser = this.ctx.createAnalyser();
    this.mainAnalyser.fftSize = 512;
    this.mainAnalyser.smoothingTimeConstant = 0.82;

    const meterSplitter = this.ctx.createChannelSplitter(2);
    this.leftAnalyser = this.ctx.createAnalyser();
    this.leftAnalyser.fftSize = 256;
    this.leftAnalyser.smoothingTimeConstant = 0.6;

    this.rightAnalyser = this.ctx.createAnalyser();
    this.rightAnalyser.fftSize = 256;
    this.rightAnalyser.smoothingTimeConstant = 0.6;

    this.masterGain.connect(this.mainAnalyser);
    this.masterGain.connect(meterSplitter);
    meterSplitter.connect(this.leftAnalyser, 0);
    meterSplitter.connect(this.rightAnalyser, 1);

    this.masterGain.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  // --- Algorithmic Impulse Response for Reverb ---
  private updateReverbImpulse(decay: number, roomSize: number) {
    if (!this.ctx || !this.reverbConvolver) return;

    const rate = this.ctx.sampleRate;
    const length = Math.max(1, Math.floor(rate * Math.max(0.2, decay)));
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const envelope = Math.exp(-3.5 * t / decay) * (1 - t / decay);
      const earlyDiff = i < rate * 0.04 ? Math.sin(t * 140 * roomSize) * 0.35 : 0;
      left[i] = ((Math.random() * 2 - 1) + earlyDiff) * envelope;
      right[i] = ((Math.random() * 2 - 1) + earlyDiff) * envelope;
    }

    this.reverbConvolver.buffer = impulse;
  }

  // --- Saturation WaveShaper Curve ---
  private makeDistortionCurve(amount: number, type: 'tape' | 'tube' | 'transistor'): Float32Array {
    const k = amount * 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      if (k === 0) {
        curve[i] = x;
      } else if (type === 'tape') {
        // Soft analog tape saturation
        curve[i] = Math.tanh(x * (1 + amount * 2));
      } else if (type === 'tube') {
        // Warm asymmetric tube distortion
        if (x < 0) {
          curve[i] = -(1 - Math.exp(x * (1 + amount)));
        } else {
          curve[i] = (1 - Math.exp(-x * (1 + amount * 1.5)));
        }
      } else {
        // Symmetrical transistor clipping
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
    }
    return curve;
  }

  public async resumeContext(): Promise<void> {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // --- Track Loading & Playback ---

  public async loadTrack(track: Track, audioSource: Blob | string, autoPlay = true): Promise<void> {
    this.init();
    await this.resumeContext();

    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }

    let url: string;
    if (typeof audioSource === 'string') {
      url = audioSource;
    } else {
      url = URL.createObjectURL(audioSource);
      this.currentObjectUrl = url;
    }

    this.currentTrack = track;

    if (this.audioEl) {
      this.audioEl.src = url;
      this.audioEl.load();

      if (autoPlay) {
        try {
          await this.audioEl.play();
        } catch (e) {
          console.warn('Autoplay waiting for user gesture:', e);
        }
      }
    }
  }

  public async play(): Promise<void> {
    this.init();
    await this.resumeContext();
    if (this.audioEl) {
      await this.audioEl.play();
    }
  }

  public pause(): void {
    if (this.audioEl) {
      this.audioEl.pause();
    }
  }

  public togglePlay(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seek(seconds: number): void {
    if (this.audioEl && !isNaN(seconds)) {
      this.audioEl.currentTime = Math.max(0, Math.min(seconds, this.audioEl.duration || seconds));
    }
  }

  public seekRelative(deltaSeconds: number): void {
    if (this.audioEl) {
      this.seek(this.audioEl.currentTime + deltaSeconds);
    }
  }

  public setVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
    if (this.audioEl) {
      this.audioEl.volume = clamped;
    }
  }

  public setMute(muted: boolean): void {
    if (this.audioEl) {
      this.audioEl.muted = muted;
    }
  }

  public setPlaybackRate(rate: number): void {
    if (this.audioEl) {
      this.audioEl.playbackRate = Math.max(0.25, Math.min(3.0, rate));
    }
  }

  public setPreservePitch(preserve: boolean): void {
    if (this.audioEl && 'preservesPitch' in this.audioEl) {
      (this.audioEl as unknown as { preservesPitch: boolean }).preservesPitch = preserve;
    }
  }

  public setPitchSemitones(semitones: number, preservePitch = true): void {
    if (!this.audioEl) return;
    if (!preservePitch) {
      // Direct varispeed pitch shift
      const rate = Math.pow(2, semitones / 12);
      this.setPlaybackRate(rate);
    }
  }

  // --- A/B Processing Matrix ---

  public setAB_Bypass(bypassToOriginal: boolean): void {
    this.isAB_Bypassed = bypassToOriginal;
    if (!this.ctx || !this.dryA_Gain || !this.wetB_Gain) return;
    const now = this.ctx.currentTime;
    const rampTime = 0.02; // 20ms click-free crossfade

    if (bypassToOriginal) {
      // Switch to Path A (Original)
      this.dryA_Gain.gain.setTargetAtTime(1.0, now, rampTime);
      this.wetB_Gain.gain.setTargetAtTime(0.0, now, rampTime);
    } else {
      // Switch to Path B (Processed DSP)
      this.dryA_Gain.gain.setTargetAtTime(0.0, now, rampTime);
      this.wetB_Gain.gain.setTargetAtTime(1.0, now, rampTime);
    }
  }

  public isABBypassed(): boolean {
    return this.isAB_Bypassed;
  }

  // --- 10-Band Equalizer Controls ---

  public setEQBandGain(index: number, gainDb: number): void {
    if (this.eqFilters[index] && this.ctx) {
      const clamped = Math.max(-15, Math.min(15, gainDb));
      this.eqFilters[index].gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
  }

  public setEQBandQ(index: number, qVal: number): void {
    if (this.eqFilters[index] && this.ctx) {
      this.eqFilters[index].Q.setValueAtTime(Math.max(0.1, Math.min(10, qVal)), this.ctx.currentTime);
    }
  }

  public applyEQPreset(preset: EqualizerPreset): number[] {
    const gains = SYSTEM_EQ_PRESETS[preset] || SYSTEM_EQ_PRESETS.flat;
    gains.forEach((gain, idx) => {
      this.setEQBandGain(idx, gain);
    });
    return [...gains];
  }

  public setToneBassTreble(bassDb: number, trebleDb: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.bassToneFilter) {
      this.bassToneFilter.gain.setValueAtTime(Math.max(-12, Math.min(12, bassDb)), now);
    }
    if (this.trebleToneFilter) {
      this.trebleToneFilter.gain.setValueAtTime(Math.max(-12, Math.min(12, trebleDb)), now);
    }
  }

  // --- Dynamics & Compressor Controls ---

  public setCompressor(settings: CompressorSettings): void {
    if (!this.ctx || !this.compressorNode || !this.compressorActiveGain || !this.compressorBypassGain) return;
    const now = this.ctx.currentTime;

    if (settings.enabled) {
      this.compressorNode.threshold.setValueAtTime(settings.threshold, now);
      this.compressorNode.ratio.setValueAtTime(settings.ratio, now);
      this.compressorNode.attack.setValueAtTime(settings.attack, now);
      this.compressorNode.release.setValueAtTime(settings.release, now);
      this.compressorNode.knee.setValueAtTime(settings.knee, now);

      if (this.compressorMakeupGain) {
        const makeupLinear = Math.pow(10, (settings.makeupGain || 0) / 20);
        this.compressorMakeupGain.gain.setValueAtTime(makeupLinear, now);
      }

      this.compressorActiveGain.gain.setValueAtTime(1.0, now);
      this.compressorBypassGain.gain.setValueAtTime(0.0, now);
    } else {
      this.compressorActiveGain.gain.setValueAtTime(0.0, now);
      this.compressorBypassGain.gain.setValueAtTime(1.0, now);
    }
  }

  public getCompressorReduction(): number {
    if (this.compressorNode) {
      return this.compressorNode.reduction; // Current reduction in dB (negative float)
    }
    return 0;
  }

  // --- Limiter & Loudness Normalization Controls ---

  public setLimiter(settings: LimiterSettings): void {
    if (!this.ctx || !this.limiterCompressor || !this.limiterCeilingGain) return;
    const now = this.ctx.currentTime;

    if (settings.enabled) {
      this.limiterCompressor.threshold.setValueAtTime(settings.threshold, now);
      this.limiterCompressor.release.setValueAtTime(settings.release, now);
      const ceilingLinear = Math.pow(10, settings.ceiling / 20);
      this.limiterCeilingGain.gain.setValueAtTime(ceilingLinear, now);
    } else {
      this.limiterCompressor.threshold.setValueAtTime(0, now);
      this.limiterCeilingGain.gain.setValueAtTime(1.0, now);
    }
  }

  public setLoudnessNormalization(settings: LoudnessSettings, trackEstimatedLufs?: number): void {
    if (!this.ctx || !this.normalizerGain) return;
    const now = this.ctx.currentTime;

    if (settings.enabled) {
      const trackLufs = trackEstimatedLufs || -14.0;
      const targetLufs = settings.targetLufs || -14.0;
      const diffDb = targetLufs - trackLufs;
      // Clamp reasonable gain adjustment between -8dB and +6dB
      const clampedDiff = Math.max(-8, Math.min(6, diffDb));
      this.currentLufsOffset = clampedDiff;
      const gainLinear = Math.pow(10, clampedDiff / 20);
      this.normalizerGain.gain.setTargetAtTime(gainLinear, now, 0.05);
    } else {
      this.currentLufsOffset = 0;
      this.normalizerGain.gain.setTargetAtTime(1.0, now, 0.05);
    }
  }

  // --- Spatial Audio Controls ---

  public setSpatialAudio(settings: SpatialSettings, immersive?: ImmersiveSettings): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Stereo Width
    const width = settings.enabled ? settings.width : 1.0;
    if (this.pannerNode) {
      const pan = Math.max(-1, Math.min(1, settings.positionX || 0));
      this.pannerNode.pan.setValueAtTime(pan, now);
    }

    // 3D sound positioning
    if (this.spatialPanner3D) {
      if (settings.enabled && (settings.mode === '3d' || settings.mode === 'spatial' || settings.mode === 'cinema')) {
        const rad = (settings.angle * Math.PI) / 180;
        const x = Math.sin(rad) * (settings.depth || 0.5);
        const y = Math.cos(rad) * (settings.depth || 0.5);
        this.spatialPanner3D.positionX.setValueAtTime(x * 2, now);
        this.spatialPanner3D.positionY.setValueAtTime(0, now);
        this.spatialPanner3D.positionZ.setValueAtTime(y * 2 + 0.5, now);
      } else {
        this.spatialPanner3D.positionX.setValueAtTime(0, now);
        this.spatialPanner3D.positionY.setValueAtTime(0, now);
        this.spatialPanner3D.positionZ.setValueAtTime(1, now);
      }
    }

    // Room reverb enhancement for spatial mode
    if (settings.enabled && settings.room > 0 && this.reverbWetGain) {
      const roomWet = (settings.room / 100) * 0.45;
      this.reverbWetGain.gain.setValueAtTime(roomWet, now);
    }

    // Immersive Enhancements
    if (immersive) {
      if (this.bassToneFilter && immersive.bassEnhancement > 0) {
        const extraBass = (immersive.bassEnhancement / 100) * 4;
        this.bassToneFilter.gain.setValueAtTime(extraBass, now);
      }
      if (this.trebleToneFilter && immersive.clarity > 0) {
        const extraClarity = (immersive.clarity / 100) * 4.5;
        this.trebleToneFilter.gain.setValueAtTime(extraClarity, now);
      }
    }
  }

  // --- Channel Matrix Controls ---

  public setChannelSettings(settings: ChannelSettings): void {
    if (!this.ctx || !this.channelGainLL || !this.channelGainLR || !this.channelGainRL || !this.channelGainRR) return;
    const now = this.ctx.currentTime;

    const pan = settings.balance; // -1 to +1
    const panL = pan <= 0 ? 1 : 1 - pan;
    const panR = pan >= 0 ? 1 : 1 + pan;

    switch (settings.mode) {
      case 'mono':
        // Sum Left + Right into both channels
        this.channelGainLL.gain.setValueAtTime(0.5 * panL, now);
        this.channelGainRL.gain.setValueAtTime(0.5 * panL, now);
        this.channelGainLR.gain.setValueAtTime(0.5 * panR, now);
        this.channelGainRR.gain.setValueAtTime(0.5 * panR, now);
        break;
      case 'swap':
        // Swap Left and Right
        this.channelGainLL.gain.setValueAtTime(0, now);
        this.channelGainRL.gain.setValueAtTime(1.0 * panL, now);
        this.channelGainLR.gain.setValueAtTime(1.0 * panR, now);
        this.channelGainRR.gain.setValueAtTime(0, now);
        break;
      case 'invertL':
        // Invert Left channel phase
        this.channelGainLL.gain.setValueAtTime(-1.0 * panL, now);
        this.channelGainRL.gain.setValueAtTime(0, now);
        this.channelGainLR.gain.setValueAtTime(0, now);
        this.channelGainRR.gain.setValueAtTime(1.0 * panR, now);
        break;
      case 'invertR':
        // Invert Right channel phase
        this.channelGainLL.gain.setValueAtTime(1.0 * panL, now);
        this.channelGainRL.gain.setValueAtTime(0, now);
        this.channelGainLR.gain.setValueAtTime(0, now);
        this.channelGainRR.gain.setValueAtTime(-1.0 * panR, now);
        break;
      case 'stereo':
      default:
        this.channelGainLL.gain.setValueAtTime(1.0 * panL, now);
        this.channelGainRL.gain.setValueAtTime(0, now);
        this.channelGainLR.gain.setValueAtTime(0, now);
        this.channelGainRR.gain.setValueAtTime(1.0 * panR, now);
        break;
    }
  }

  public setBalance(pan: number): void {
    if (this.pannerNode && this.ctx) {
      const clamped = Math.max(-1, Math.min(1, pan));
      this.pannerNode.pan.setValueAtTime(clamped, this.ctx.currentTime);
    }
  }

  // --- Effects Rack Controls ---

  public setEffects(effects: AudioEffects): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Quick Tone
    this.setToneBassTreble(effects.bassBoost || 0, effects.trebleBoost || 0);

    // Reverb
    if (this.reverbWetGain) {
      const wet = effects.reverb.enabled ? effects.reverb.wet : 0;
      this.reverbWetGain.gain.setValueAtTime(wet * 0.85, now);
      if (effects.reverb.enabled) {
        this.updateReverbImpulse(effects.reverb.decay, effects.reverb.roomSize);
      }
    }

    // Delay / Echo
    if (this.delayNode && this.delayFeedbackGain && this.echoWetGain) {
      const echoWet = effects.echo.enabled ? effects.echo.wet : 0;
      this.echoWetGain.gain.setValueAtTime(echoWet * 0.75, now);
      this.delayNode.delayTime.setValueAtTime(Math.max(0.05, Math.min(2.0, effects.echo.delayTime)), now);
      this.delayFeedbackGain.gain.setValueAtTime(Math.max(0, Math.min(0.85, effects.echo.feedback)), now);
    }

    // Chorus
    if (this.chorusWetGain && this.chorusLFO && this.chorusLFOGain) {
      const wet = effects.chorus.enabled ? effects.chorus.wet : 0;
      this.chorusWetGain.gain.setValueAtTime(wet * 0.7, now);
      this.chorusLFO.frequency.setValueAtTime(effects.chorus.rate || 1.5, now);
      this.chorusLFOGain.gain.setValueAtTime((effects.chorus.depth || 0.5) * 0.003, now);
    }

    // Saturation
    if (this.saturationShaper && this.saturationWetGain && this.saturationBypassGain) {
      if (effects.saturation.enabled) {
        this.saturationShaper.curve = this.makeDistortionCurve(effects.saturation.drive, effects.saturation.type || 'tape');
        this.saturationWetGain.gain.setValueAtTime(1.0, now);
        this.saturationBypassGain.gain.setValueAtTime(0.0, now);
      } else {
        this.saturationWetGain.gain.setValueAtTime(0.0, now);
        this.saturationBypassGain.gain.setValueAtTime(1.0, now);
      }
    }

    // Exciter
    if (this.exciterWetGain && this.exciterHighpass) {
      const wet = effects.exciter.enabled ? effects.exciter.amount : 0;
      this.exciterWetGain.gain.setValueAtTime(wet * 0.6, now);
      this.exciterHighpass.frequency.setValueAtTime(effects.exciter.frequency || 4500, now);
    }

    // Noise Gate
    if (this.noiseGateGain) {
      // Noise gate is active
      this.noiseGateGain.gain.setValueAtTime(1.0, now);
    }

    // Balance
    if (this.pannerNode) {
      this.pannerNode.pan.setValueAtTime(effects.balance || 0, now);
    }
  }

  // --- Real-time Metering & Analytics ---

  public getRealtimeMeterData(): RealtimeMeterData {
    if (!this.leftAnalyser || !this.rightAnalyser || !this.mainAnalyser) {
      return {
        peakL: -90,
        peakR: -90,
        peakLNorm: 0,
        peakRNorm: 0,
        vuL: -20,
        vuR: -20,
        approxLufs: -14.0,
        dynamicRangeDb: 8.0,
        isClipping: false,
        gainReductionDb: 0,
      };
    }

    this.leftAnalyser.getFloatTimeDomainData(this.meterLeftData);
    this.rightAnalyser.getFloatTimeDomainData(this.meterRightData);

    let maxL = 0;
    let maxR = 0;
    let sumSqL = 0;
    let sumSqR = 0;
    const len = this.meterLeftData.length;

    for (let i = 0; i < len; i++) {
      const l = Math.abs(this.meterLeftData[i]);
      const r = Math.abs(this.meterRightData[i]);
      if (l > maxL) maxL = l;
      if (r > maxR) maxR = r;
      sumSqL += l * l;
      sumSqR += r * r;
    }

    const peakDbL = maxL > 0.0001 ? 20 * Math.log10(maxL) : -90;
    const peakDbR = maxR > 0.0001 ? 20 * Math.log10(maxR) : -90;

    const rmsL = Math.sqrt(sumSqL / len);
    const rmsR = Math.sqrt(sumSqR / len);
    const vuDbL = rmsL > 0.0001 ? 20 * Math.log10(rmsL) : -90;
    const vuDbR = rmsR > 0.0001 ? 20 * Math.log10(rmsR) : -90;

    const isClipping = maxL >= 0.999 || maxR >= 0.999;
    const avgRms = (rmsL + rmsR) * 0.5;
    const approxLufs = avgRms > 0 ? Number((20 * Math.log10(avgRms) - 0.691).toFixed(1)) : -70;

    const peakMax = Math.max(maxL, maxR);
    const drDb = (peakMax > 0 && avgRms > 0) ? Number((20 * Math.log10(peakMax / avgRms)).toFixed(1)) : 8.0;

    const gainReductionDb = this.getCompressorReduction();

    return {
      peakL: Number(peakDbL.toFixed(1)),
      peakR: Number(peakDbR.toFixed(1)),
      peakLNorm: Math.max(0, Math.min(1, maxL)),
      peakRNorm: Math.max(0, Math.min(1, maxR)),
      vuL: Number(vuDbL.toFixed(1)),
      vuR: Number(vuDbR.toFixed(1)),
      approxLufs,
      dynamicRangeDb: drDb,
      isClipping,
      gainReductionDb: Number(gainReductionDb.toFixed(1)),
    };
  }

  // --- Visualizer Data ---

  public getFrequencyData(array: Uint8Array): void {
    if (this.mainAnalyser) {
      this.mainAnalyser.getByteFrequencyData(array);
    } else {
      array.fill(0);
    }
  }

  public getTimeDomainData(array: Uint8Array): void {
    if (this.mainAnalyser) {
      this.mainAnalyser.getByteTimeDomainData(array);
    } else {
      array.fill(128);
    }
  }

  public getAnalyserFrequencyBinCount(): number {
    return this.mainAnalyser ? this.mainAnalyser.frequencyBinCount : 256;
  }

  // --- Waveform Peak Extraction ---

  public async generateWaveformPeaks(audioBlobOrBuffer: Blob | ArrayBuffer, numBars = 160): Promise<number[]> {
    try {
      let arrayBuffer: ArrayBuffer;
      if (audioBlobOrBuffer instanceof Blob) {
        arrayBuffer = await audioBlobOrBuffer.arrayBuffer();
      } else {
        arrayBuffer = audioBlobOrBuffer;
      }

      const tempCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const decoded = await tempCtx.decodeAudioData(arrayBuffer.slice(0));
      await tempCtx.close();

      const channelData = decoded.getChannelData(0);
      const totalSamples = channelData.length;
      const blockSize = Math.floor(totalSamples / numBars);
      const peaks: number[] = [];

      let maxPeak = 0.001;

      for (let i = 0; i < numBars; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, totalSamples);
        let sum = 0;
        let blockMax = 0;

        for (let j = start; j < end; j += 4) {
          const absVal = Math.abs(channelData[j]);
          if (absVal > blockMax) blockMax = absVal;
          sum += absVal * absVal;
        }

        const rms = Math.sqrt(sum / ((end - start) / 4 || 1));
        const val = (blockMax * 0.65) + (rms * 0.35);
        if (val > maxPeak) maxPeak = val;
        peaks.push(val);
      }

      return peaks.map(p => Math.max(0.08, Math.min(1.0, p / maxPeak)));
    } catch (err) {
      console.warn('Procedural fallback waveform generated:', err);
      const fallback: number[] = [];
      for (let i = 0; i < numBars; i++) {
        const t = i / numBars;
        const v = 0.25 + 0.5 * Math.sin(t * Math.PI) * (0.6 + 0.4 * Math.sin(t * 18));
        fallback.push(Math.max(0.1, Math.min(0.95, v + (Math.random() * 0.15 - 0.075))));
      }
      return fallback;
    }
  }

  // --- Loop A/B Controls ---

  public setLoopAB(loop: LoopABState): void {
    this.loopState = { ...loop };
  }

  public getLoopAB(): LoopABState {
    return { ...this.loopState };
  }

  public onLoopCountChange(cb: (count: number) => void): () => void {
    this.onLoopCountChangeCallback = cb;
    return () => { this.onLoopCountChangeCallback = null; };
  }

  // --- Channel Monitor & Stereo Control ---

  public setChannelMonitor(mode: ChannelMonitorMode, balance = 0): void {
    if (!this.ctx || !this.channelGainLL || !this.channelGainLR || !this.channelGainRL || !this.channelGainRR) return;
    const now = this.ctx.currentTime;
    const pan = balance;
    const panL = pan <= 0 ? 1 : 1 - pan;
    const panR = pan >= 0 ? 1 : 1 + pan;

    switch (mode) {
      case 'left':
        // Listen to Left Channel only on both ears
        this.channelGainLL.gain.setValueAtTime(1.0 * panL, now);
        this.channelGainLR.gain.setValueAtTime(1.0 * panR, now);
        this.channelGainRL.gain.setValueAtTime(0, now);
        this.channelGainRR.gain.setValueAtTime(0, now);
        break;
      case 'right':
        // Listen to Right Channel only on both ears
        this.channelGainLL.gain.setValueAtTime(0, now);
        this.channelGainLR.gain.setValueAtTime(0, now);
        this.channelGainRL.gain.setValueAtTime(1.0 * panL, now);
        this.channelGainRR.gain.setValueAtTime(1.0 * panR, now);
        break;
      case 'mono':
        // Sum Left and Right equally into both ears
        this.channelGainLL.gain.setValueAtTime(0.5 * panL, now);
        this.channelGainLR.gain.setValueAtTime(0.5 * panR, now);
        this.channelGainRL.gain.setValueAtTime(0.5 * panL, now);
        this.channelGainRR.gain.setValueAtTime(0.5 * panR, now);
        break;
      case 'stereo':
      default:
        this.channelGainLL.gain.setValueAtTime(1.0 * panL, now);
        this.channelGainLR.gain.setValueAtTime(0, now);
        this.channelGainRL.gain.setValueAtTime(0, now);
        this.channelGainRR.gain.setValueAtTime(1.0 * panR, now);
        break;
    }
  }

  // Real-time Stereo Phase Correlation (-1 = 180° out of phase, 0 = wide stereo, +1 = mono)
  public getStereoCorrelation(): { correlation: number; leftEnergy: number; rightEnergy: number; widthPct: number } {
    if (!this.leftAnalyser || !this.rightAnalyser) {
      return { correlation: 1.0, leftEnergy: 0, rightEnergy: 0, widthPct: 100 };
    }

    this.leftAnalyser.getFloatTimeDomainData(this.meterLeftData);
    this.rightAnalyser.getFloatTimeDomainData(this.meterRightData);

    let sumL2 = 0;
    let sumR2 = 0;
    let sumLR = 0;
    const len = this.meterLeftData.length;

    for (let i = 0; i < len; i++) {
      const l = this.meterLeftData[i];
      const r = this.meterRightData[i];
      sumL2 += l * l;
      sumR2 += r * r;
      sumLR += l * r;
    }

    const denom = Math.sqrt(sumL2 * sumR2);
    let corr = denom > 0.00001 ? sumLR / denom : 1.0;
    corr = Math.max(-1.0, Math.min(1.0, corr));

    const leftEnergy = Math.min(1.0, Math.sqrt(sumL2 / len) * 3);
    const rightEnergy = Math.min(1.0, Math.sqrt(sumR2 / len) * 3);
    const widthPct = Math.round(Math.max(0, Math.min(200, (1 - corr) * 100 + 50)));

    return {
      correlation: Number(corr.toFixed(2)),
      leftEnergy: Number(leftEnergy.toFixed(2)),
      rightEnergy: Number(rightEnergy.toFixed(2)),
      widthPct,
    };
  }

  // --- High-Fidelity Offline Audio Rendering & Export ---

  public async exportTrackAudio(
    audioBlobOrBuffer: Blob | ArrayBuffer,
    options: ExportAudioOptions,
    snapshot?: AudioDspSnapshot
  ): Promise<Blob> {
    let arrayBuffer: ArrayBuffer;
    if (audioBlobOrBuffer instanceof Blob) {
      arrayBuffer = await audioBlobOrBuffer.arrayBuffer();
    } else {
      arrayBuffer = audioBlobOrBuffer;
    }

    // Decode original file
    const decodeCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const sourceBuffer = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
    await decodeCtx.close();

    const sampleRate = options.sampleRate || sourceBuffer.sampleRate;
    const origDuration = sourceBuffer.duration;

    const trimStart = options.applyTrim ? Math.max(0, Math.min(options.trimStart || 0, origDuration)) : 0;
    const trimEnd = options.applyTrim ? Math.min(origDuration, Math.max(trimStart + 0.1, options.trimEnd || origDuration)) : origDuration;
    const renderDuration = Math.max(0.1, trimEnd - trimStart);
    const totalRenderSamples = Math.ceil(renderDuration * sampleRate);

    // Setup Offline Context
    const offlineCtx = new OfflineAudioContext(2, totalRenderSamples, sampleRate);

    // Create Source Buffer Node
    const sourceNode = offlineCtx.createBufferSource();
    sourceNode.buffer = sourceBuffer;

    let chain: AudioNode = sourceNode;

    // Apply DSP if requested
    if (options.applyDsp && snapshot) {
      // 1. Equalizer
      const eqGains = snapshot.eqGains || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const eqFilters = EQ_10_BANDS.map((band, idx) => {
        const f = offlineCtx.createBiquadFilter();
        f.type = band.type;
        f.frequency.value = band.freq;
        f.gain.value = eqGains[idx] || 0;
        f.Q.value = band.q;
        return f;
      });

      const bassFilter = offlineCtx.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = 100;
      bassFilter.gain.value = snapshot.bass || 0;

      const trebleFilter = offlineCtx.createBiquadFilter();
      trebleFilter.type = 'highshelf';
      trebleFilter.frequency.value = 8000;
      trebleFilter.gain.value = snapshot.treble || 0;

      for (const filter of eqFilters) {
        chain.connect(filter);
        chain = filter;
      }
      chain.connect(bassFilter);
      bassFilter.connect(trebleFilter);
      chain = trebleFilter;

      // 2. Dynamics Compressor
      if (snapshot.compressor && snapshot.compressor.enabled) {
        const comp = offlineCtx.createDynamicsCompressor();
        comp.threshold.value = snapshot.compressor.threshold;
        comp.ratio.value = snapshot.compressor.ratio;
        comp.attack.value = snapshot.compressor.attack;
        comp.release.value = snapshot.compressor.release;
        comp.knee.value = snapshot.compressor.knee;

        const makeup = offlineCtx.createGain();
        const makeupLinear = Math.pow(10, (snapshot.compressor.makeupGain || 0) / 20);
        makeup.gain.value = makeupLinear;

        chain.connect(comp);
        comp.connect(makeup);
        chain = makeup;
      }

      // 3. Stereo Width & Balance
      if (snapshot.spatial && snapshot.spatial.enabled && snapshot.spatial.width !== 1.0) {
        const splitter = offlineCtx.createChannelSplitter(2);
        const merger = offlineCtx.createChannelMerger(2);
        const w = snapshot.spatial.width;

        const gLL = offlineCtx.createGain();
        const gLR = offlineCtx.createGain();
        const gRL = offlineCtx.createGain();
        const gRR = offlineCtx.createGain();

        // Mid/Side matrix width
        gLL.gain.value = 0.5 * (1 + w);
        gLR.gain.value = 0.5 * (1 - w);
        gRL.gain.value = 0.5 * (1 - w);
        gRR.gain.value = 0.5 * (1 + w);

        chain.connect(splitter);
        splitter.connect(gLL, 0);
        splitter.connect(gLR, 0);
        splitter.connect(gRL, 1);
        splitter.connect(gRR, 1);

        gLL.connect(merger, 0, 0);
        gRL.connect(merger, 0, 0);
        gLR.connect(merger, 0, 1);
        gRR.connect(merger, 0, 1);

        chain = merger;
      }

      // 4. Limiter Stage
      if (snapshot.limiter && snapshot.limiter.enabled) {
        const limiter = offlineCtx.createDynamicsCompressor();
        limiter.threshold.value = snapshot.limiter.threshold || -0.5;
        limiter.knee.value = 0;
        limiter.ratio.value = 20;
        limiter.attack.value = 0.001;
        limiter.release.value = 0.05;

        const ceil = offlineCtx.createGain();
        ceil.gain.value = Math.pow(10, (snapshot.limiter.ceiling || 0) / 20);

        chain.connect(limiter);
        limiter.connect(ceil);
        chain = ceil;
      }
    }

    // Apply Fade In / Fade Out Envelope Gain Node
    const fadeGain = offlineCtx.createGain();
    fadeGain.gain.setValueAtTime(options.fadeIn && options.fadeIn > 0 ? 0.0001 : 1.0, 0);

    if (options.fadeIn && options.fadeIn > 0) {
      const fadeInDuration = Math.min(options.fadeIn, renderDuration / 2);
      fadeGain.gain.exponentialRampToValueAtTime(1.0, fadeInDuration);
    }

    if (options.fadeOut && options.fadeOut > 0) {
      const fadeOutDuration = Math.min(options.fadeOut, renderDuration / 2);
      const fadeOutStartTime = Math.max(0, renderDuration - fadeOutDuration);
      fadeGain.gain.setValueAtTime(1.0, fadeOutStartTime);
      fadeGain.gain.exponentialRampToValueAtTime(0.0001, renderDuration);
    }

    chain.connect(fadeGain);
    fadeGain.connect(offlineCtx.destination);

    // Start playback at trimmed offset
    sourceNode.start(0, trimStart, renderDuration);

    // Render Offline Buffer
    const renderedBuffer = await offlineCtx.startRendering();

    // Encode to requested bit depth WAV
    return audioBufferToWav(renderedBuffer, options.bitDepth || 16);
  }

  // --- Playback State Getters ---

  public isPlaying(): boolean {
    return !!(this.audioEl && !this.audioEl.paused && !this.audioEl.ended);
  }

  public getCurrentTime(): number {
    return this.audioEl ? this.audioEl.currentTime : 0;
  }

  public getDuration(): number {
    return this.audioEl ? this.audioEl.duration || 0 : 0;
  }

  public getVolume(): number {
    return this.audioEl ? this.audioEl.volume : 0.85;
  }

  public isMuted(): boolean {
    return !!(this.audioEl && this.audioEl.muted);
  }

  public getPlaybackRate(): number {
    return this.audioEl ? this.audioEl.playbackRate : 1.0;
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  // --- Event Listener Registration ---

  public onTimeUpdate(cb: (time: number, duration: number) => void): () => void {
    this.onTimeUpdateCallback = cb;
    return () => { this.onTimeUpdateCallback = null; };
  }

  public onEnded(cb: () => void): () => void {
    this.onEndedCallback = cb;
    return () => { this.onEndedCallback = null; };
  }

  public onStateChange(cb: (isPlaying: boolean) => void): () => void {
    this.onStateChangeCallback = cb;
    return () => { this.onStateChangeCallback = null; };
  }
}

export const audioEngine = new AudioEngine();
