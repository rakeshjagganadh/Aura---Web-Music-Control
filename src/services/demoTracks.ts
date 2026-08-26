import { Track } from '../types';
import { audioEngine } from './audioEngine';

// Encode AudioBuffer to WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample: number;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit precision

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

// Synthesize 1: Synthwave Track (~42 seconds looping song)
function synthesizeSynthwave(): Blob {
  const sampleRate = 44100;
  const duration = 40; // seconds
  const totalSamples = sampleRate * duration;
  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

  const bpm = 120;
  const beatSec = 60 / bpm;
  const numBeats = Math.floor(duration / beatSec);

  // Chords: Am -> F -> C -> G (frequencies)
  const chordRoots = [220, 174.61, 261.63, 196.0]; // A3, F3, C4, G3
  const chordNotes = [
    [220, 261.63, 329.63, 392.0],  // Am7: A, C, E, G
    [174.61, 220, 261.63, 329.63], // Fmaj7: F, A, C, E
    [261.63, 329.63, 392.0, 493.88],// Cmaj7: C, E, G, B
    [196.0, 246.94, 293.66, 392.0]  // G7: G, B, D, G
  ];

  // 1. Synth Pad Chords
  chordNotes.forEach((notes, chordIdx) => {
    for (let bar = 0; bar < Math.floor(numBeats / 4); bar++) {
      if (bar % 4 === chordIdx) {
        const startTime = bar * 4 * beatSec;
        notes.forEach((freq, nIdx) => {
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();
          const filter = offlineCtx.createBiquadFilter();

          osc.type = nIdx % 2 === 0 ? 'sawtooth' : 'triangle';
          osc.frequency.value = freq;
          osc.detune.value = (nIdx - 1.5) * 8; // subtle chorus detune

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, startTime);
          filter.frequency.exponentialRampToValueAtTime(3200, startTime + 2 * beatSec);
          filter.frequency.exponentialRampToValueAtTime(1000, startTime + 4 * beatSec);

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.045, startTime + 0.3);
          gain.gain.setValueAtTime(0.045, startTime + 3.5 * beatSec);
          gain.gain.linearRampToValueAtTime(0, startTime + 4 * beatSec);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(offlineCtx.destination);

          osc.start(startTime);
          osc.stop(startTime + 4 * beatSec);
        });
      }
    }
  });

  // 2. Rolling Synth Bass (16th notes bassline)
  for (let b = 0; b < numBeats * 4; b++) {
    const time = b * (beatSec / 4);
    if (time >= duration - 0.2) break;
    const bar = Math.floor(b / 16);
    const root = chordRoots[bar % 4] / 2; // sub octave

    const osc = offlineCtx.createOscillator();
    const filter = offlineCtx.createBiquadFilter();
    const gain = offlineCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = root;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.frequency.exponentialRampToValueAtTime(180, time + 0.12);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(offlineCtx.destination);

    osc.start(time);
    osc.stop(time + 0.13);
  }

  // 3. Drums: Kick on 1 & 3, Snare on 2 & 4, Hi-hats on 8ths
  for (let beat = 0; beat < numBeats; beat++) {
    const time = beat * beatSec;
    if (time >= duration - 0.5) break;

    // Kick
    if (beat % 2 === 0 || (beat % 4 === 3 && Math.random() > 0.5)) {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.18);
      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(time);
      osc.stop(time + 0.23);
    }

    // Snare on beats 2 & 4
    if (beat % 2 === 1) {
      const noiseBuffer = offlineCtx.createBuffer(1, sampleRate * 0.18, sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = offlineCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 1.2;

      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(offlineCtx.destination);

      whiteNoise.start(time);
      whiteNoise.stop(time + 0.19);
    }

    // Hi-hats (8th notes)
    for (let sub = 0; sub < 2; sub++) {
      const hhTime = time + sub * (beatSec / 2);
      const hhOsc = offlineCtx.createOscillator();
      const hhFilter = offlineCtx.createBiquadFilter();
      const hhGain = offlineCtx.createGain();

      hhOsc.type = 'square';
      hhOsc.frequency.value = 7500;
      hhFilter.type = 'highpass';
      hhFilter.frequency.value = 8500;

      hhGain.gain.setValueAtTime(sub === 0 ? 0.04 : 0.025, hhTime);
      hhGain.gain.exponentialRampToValueAtTime(0.0005, hhTime + 0.04);

      hhOsc.connect(hhFilter);
      hhFilter.connect(hhGain);
      hhGain.connect(offlineCtx.destination);

      hhOsc.start(hhTime);
      hhOsc.stop(hhTime + 0.05);
    }
  }

  // Render to buffer synchronously using promise
  return new Promise<Blob>((resolve) => {
    offlineCtx.startRendering().then((renderedBuffer) => {
      resolve(audioBufferToWav(renderedBuffer));
    });
  }) as unknown as Blob;
}

// Synthesize 2: Lo-Fi Chill Track (~36 seconds)
function synthesizeLofi(): Blob {
  const sampleRate = 44100;
  const duration = 36;
  const totalSamples = sampleRate * duration;
  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

  const bpm = 84;
  const beatSec = 60 / bpm;
  const numBeats = Math.floor(duration / beatSec);

  // Lo-fi jazz chord progression: Dm9 -> G13 -> Cmaj9 -> A7b13
  const jazzChords = [
    [293.66, 349.23, 440.0, 523.25, 659.25], // Dm9: D, F, A, C, E
    [196.0, 246.94, 329.63, 392.0, 523.25],  // G13: G, B, E, G, C
    [261.63, 329.63, 392.0, 493.88, 587.33],// Cmaj9: C, E, G, B, D
    [220.0, 277.18, 329.63, 415.30, 523.25]  // A7alt: A, C#, E, G#, C
  ];

  jazzChords.forEach((notes, chordIdx) => {
    for (let bar = 0; bar < Math.floor(numBeats / 4); bar++) {
      if (bar % 4 === chordIdx) {
        const startTime = bar * 4 * beatSec;
        notes.forEach((freq, nIdx) => {
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();
          const filter = offlineCtx.createBiquadFilter();

          osc.type = 'sine';
          osc.frequency.value = freq;
          // slight tape pitch flutter
          osc.detune.setValueAtTime(0, startTime);
          osc.detune.linearRampToValueAtTime(12, startTime + 1.5);
          osc.detune.linearRampToValueAtTime(-10, startTime + 3.0);

          filter.type = 'lowpass';
          filter.frequency.value = 1600; // warm muffled lo-fi tone

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.04, startTime + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 3.8 * beatSec);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(offlineCtx.destination);

          osc.start(startTime);
          osc.stop(startTime + 3.9 * beatSec);
        });
      }
    }
  });

  // Sub bass
  const bassNotes = [146.83, 98.0, 130.81, 110.0];
  bassNotes.forEach((freq, idx) => {
    for (let bar = 0; bar < Math.floor(numBeats / 4); bar++) {
      if (bar % 4 === idx) {
        const startTime = bar * 4 * beatSec;
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq / 2;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.005, startTime + 3.6 * beatSec);

        osc.connect(gain);
        gain.connect(offlineCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + 3.8 * beatSec);
      }
    }
  });

  // Lo-Fi dusty beat
  for (let beat = 0; beat < numBeats; beat++) {
    const time = beat * beatSec;
    if (time >= duration - 0.5) break;

    // Kick on 1 and 3+
    if (beat % 4 === 0 || beat % 4 === 2.5) {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.frequency.setValueAtTime(100, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.15);
      gain.gain.setValueAtTime(0.28, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(time);
      osc.stop(time + 0.22);
    }

    // Rimshot / Snare on 2 & 4
    if (beat % 4 === 1 || beat % 4 === 3) {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, time);
      osc.frequency.exponentialRampToValueAtTime(110, time + 0.08);
      gain.gain.setValueAtTime(0.14, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(time);
      osc.stop(time + 0.1);
    }
  }

  return new Promise<Blob>((resolve) => {
    offlineCtx.startRendering().then((renderedBuffer) => {
      resolve(audioBufferToWav(renderedBuffer));
    });
  }) as unknown as Blob;
}

// Synthesize 3: Ambient Cinematic Space (~45 seconds)
function synthesizeAmbient(): Blob {
  const sampleRate = 44100;
  const duration = 45;
  const totalSamples = sampleRate * duration;
  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

  // Ethereal drone frequencies (F# minor drone)
  const freqs = [92.5, 138.59, 185.0, 220.0, 277.18, 370.0, 554.37];

  freqs.forEach((freq, idx) => {
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    const panner = offlineCtx.createStereoPanner ? offlineCtx.createStereoPanner() : null;

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 14;

    const panVal = (idx / (freqs.length - 1)) * 1.6 - 0.8;
    if (panner) panner.pan.value = panVal;

    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.035, 4.0 + idx * 0.8);
    gain.gain.setValueAtTime(0.035, duration - 6.0);
    gain.gain.linearRampToValueAtTime(0, duration);

    if (panner) {
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(offlineCtx.destination);
    } else {
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
    }

    osc.start(0);
    osc.stop(duration);
  });

  // Random crystal bell chimes
  const bellNotes = [554.37, 659.25, 739.99, 830.61, 987.77, 1108.73];
  for (let i = 0; i < 18; i++) {
    const time = 2.0 + (i * (duration - 5) / 18) + (Math.random() * 1.5);
    const note = bellNotes[Math.floor(Math.random() * bellNotes.length)];

    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = note;

    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.5);

    osc.connect(gain);
    gain.connect(offlineCtx.destination);

    osc.start(time);
    osc.stop(time + 2.6);
  }

  return new Promise<Blob>((resolve) => {
    offlineCtx.startRendering().then((renderedBuffer) => {
      resolve(audioBufferToWav(renderedBuffer));
    });
  }) as unknown as Blob;
}

export async function generateDemoTracks(): Promise<{ track: Track; blob: Blob }[]> {
  const [blob1, blob2, blob3] = await Promise.all([
    synthesizeSynthwave() as unknown as Promise<Blob>,
    synthesizeLofi() as unknown as Promise<Blob>,
    synthesizeAmbient() as unknown as Promise<Blob>,
  ]);

  const [peaks1, peaks2, peaks3] = await Promise.all([
    audioEngine.generateWaveformPeaks(blob1),
    audioEngine.generateWaveformPeaks(blob2),
    audioEngine.generateWaveformPeaks(blob3),
  ]);

  const now = Date.now();

  const track1: Track = {
    id: 'demo-neon-horizon',
    title: 'Neon Horizon',
    artist: 'Aura Studio',
    album: 'Future Analogues',
    duration: 40,
    fileFormat: 'WAV',
    fileSize: blob1.size,
    dateAdded: now - 3600000 * 2,
    coverColor: 'from-violet-600 via-indigo-700 to-cyan-900',
    waveformPeaks: peaks1,
    isFavorite: true,
    isDemo: true,
  };

  const track2: Track = {
    id: 'demo-velvet-solitude',
    title: 'Velvet Solitude',
    artist: 'Lofi Nights',
    album: 'Midnight Coffee',
    duration: 36,
    fileFormat: 'WAV',
    fileSize: blob2.size,
    dateAdded: now - 3600000 * 5,
    coverColor: 'from-amber-600 via-rose-800 to-zinc-900',
    waveformPeaks: peaks2,
    isFavorite: false,
    isDemo: true,
  };

  const track3: Track = {
    id: 'demo-astral-odyssey',
    title: 'Astral Odyssey',
    artist: 'Celestial Echoes',
    album: 'Deep Cosmos Vol. 1',
    duration: 45,
    fileFormat: 'WAV',
    fileSize: blob3.size,
    dateAdded: now - 3600000 * 12,
    coverColor: 'from-cyan-600 via-blue-800 to-slate-950',
    waveformPeaks: peaks3,
    isFavorite: true,
    isDemo: true,
  };

  return [
    { track: track1, blob: blob1 },
    { track: track2, blob: blob2 },
    { track: track3, blob: blob3 },
  ];
}
