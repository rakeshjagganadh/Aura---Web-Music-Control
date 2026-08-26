import { Track } from '../types';
import { audioEngine } from './audioEngine';

// Modern ID3v2 & file metadata extractor without heavy external dependencies
export class MetadataParser {
  private static GRADIENTS = [
    'from-indigo-600 via-purple-700 to-slate-900',
    'from-cyan-600 via-blue-700 to-zinc-950',
    'from-emerald-600 via-teal-700 to-slate-900',
    'from-rose-600 via-pink-700 to-zinc-900',
    'from-amber-600 via-orange-700 to-stone-900',
    'from-violet-600 via-fuchsia-800 to-slate-950',
    'from-blue-600 via-indigo-800 to-neutral-900',
    'from-teal-500 via-emerald-800 to-neutral-950',
  ];

  static getRandomGradient(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % this.GRADIENTS.length;
    return this.GRADIENTS[idx];
  }

  static async parseFile(file: File): Promise<{ track: Track; blob: Blob }> {
    const extension = file.name.split('.').pop()?.toUpperCase() || 'AUDIO';
    const cleanFileName = file.name.replace(/\.[^/.]+$/, '');
    
    // Parse title & artist from typical filename "Artist - Title"
    let title = cleanFileName;
    let artist = 'Unknown Artist';
    let album = 'Unknown Album';
    let coverUrl: string | undefined;

    if (cleanFileName.includes(' - ')) {
      const parts = cleanFileName.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }

    // Try reading ID3 / APIC tags
    try {
      const buffer = await file.slice(0, 1024 * 512).arrayBuffer(); // read first 512KB for headers
      const id3Data = this.parseID3(buffer);
      if (id3Data.title) title = id3Data.title;
      if (id3Data.artist) artist = id3Data.artist;
      if (id3Data.album) album = id3Data.album;
      if (id3Data.coverUrl) coverUrl = id3Data.coverUrl;
    } catch (e) {
      console.warn('ID3 parsing skipped:', e);
    }

    // Determine exact audio duration
    let duration = 0;
    try {
      duration = await this.getAudioDuration(file);
    } catch {
      duration = 180; // fallback default
    }

    // Generate real waveform peaks
    const waveformPeaks = await audioEngine.generateWaveformPeaks(file, 160);

    const track: Track = {
      id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      title,
      artist,
      album,
      duration: Math.round(duration),
      fileFormat: extension,
      fileSize: file.size,
      dateAdded: Date.now(),
      coverUrl,
      coverColor: this.getRandomGradient(title + artist),
      waveformPeaks,
      isFavorite: false,
      isDemo: false,
    };

    return { track, blob: file };
  }

  private static getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        audio.remove();
      };

      audio.onloadedmetadata = () => {
        const d = audio.duration;
        cleanup();
        resolve(isFinite(d) ? d : 180);
      };

      audio.onerror = () => {
        cleanup();
        resolve(180);
      };
    });
  }

  private static parseID3(buffer: ArrayBuffer): { title?: string; artist?: string; album?: string; coverUrl?: string } {
    const view = new DataView(buffer);
    if (view.byteLength < 10) return {};

    // Check ID3 header "ID3"
    if (view.getUint8(0) !== 0x49 || view.getUint8(1) !== 0x44 || view.getUint8(2) !== 0x33) {
      return {};
    }

    const version = view.getUint8(3);
    const flags = view.getUint8(5);
    const tagSize = (
      ((view.getUint8(6) & 0x7f) << 21) |
      ((view.getUint8(7) & 0x7f) << 14) |
      ((view.getUint8(8) & 0x7f) << 7) |
      (view.getUint8(9) & 0x7f)
    );

    let offset = 10;
    if (flags & 0x40) {
      // Extended header
      const extSize = view.getUint32(offset);
      offset += extSize;
    }

    const result: { title?: string; artist?: string; album?: string; coverUrl?: string } = {};

    while (offset < Math.min(view.byteLength, tagSize + 10)) {
      if (offset + 10 > view.byteLength) break;
      const frameId = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );

      if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

      let frameSize: number;
      if (version === 4) {
        frameSize = (
          ((view.getUint8(offset + 4) & 0x7f) << 21) |
          ((view.getUint8(offset + 5) & 0x7f) << 14) |
          ((view.getUint8(offset + 6) & 0x7f) << 7) |
          (view.getUint8(offset + 7) & 0x7f)
        );
      } else {
        frameSize = view.getUint32(offset + 4);
      }

      if (frameSize <= 0 || offset + 10 + frameSize > view.byteLength) break;

      const frameDataOffset = offset + 10;
      const frameDataBytes = new Uint8Array(buffer, frameDataOffset, frameSize);

      if (frameId === 'TIT2') {
        result.title = this.decodeText(frameDataBytes);
      } else if (frameId === 'TPE1') {
        result.artist = this.decodeText(frameDataBytes);
      } else if (frameId === 'TALB') {
        result.album = this.decodeText(frameDataBytes);
      } else if (frameId === 'APIC') {
        try {
          const cover = this.extractAPIC(frameDataBytes);
          if (cover) result.coverUrl = cover;
        } catch {
          // ignore
        }
      }

      offset += 10 + frameSize;
    }

    return result;
  }

  private static decodeText(bytes: Uint8Array): string {
    if (bytes.length === 0) return '';
    const encoding = bytes[0];
    const textBytes = bytes.subarray(1);

    try {
      if (encoding === 0) { // ISO-8859-1
        return new TextDecoder('latin1').decode(textBytes).replace(/\0+$/, '').trim();
      } else if (encoding === 1 || encoding === 2) { // UTF-16
        return new TextDecoder('utf-16').decode(textBytes).replace(/\0+$/, '').trim();
      } else { // UTF-8
        return new TextDecoder('utf-8').decode(textBytes).replace(/\0+$/, '').trim();
      }
    } catch {
      return '';
    }
  }

  private static extractAPIC(bytes: Uint8Array): string | null {
    if (bytes.length < 10) return null;
    let offset = 1; // skip encoding byte
    
    // Read mime type (null-terminated string)
    let mimeType = 'image/jpeg';
    const mimeStart = offset;
    while (offset < bytes.length && bytes[offset] !== 0) {
      offset++;
    }
    if (offset > mimeStart) {
      mimeType = new TextDecoder('latin1').decode(bytes.subarray(mimeStart, offset));
    }
    offset++; // skip null delimiter
    offset++; // skip picture type (1 byte)

    // Skip description (null terminated)
    while (offset < bytes.length && bytes[offset] !== 0) {
      offset++;
    }
    offset++; // skip null delimiter

    // Remaining bytes are the image data
    if (offset < bytes.length) {
      const imgBytes = bytes.subarray(offset);
      const blob = new Blob([imgBytes], { type: mimeType || 'image/jpeg' });
      return URL.createObjectURL(blob);
    }
    return null;
  }
}
