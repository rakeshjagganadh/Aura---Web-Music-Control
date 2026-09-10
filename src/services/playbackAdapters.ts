import { Track } from '../types';
import { audioEngine } from './audioEngine';
import { youtubePlayerBridge } from './youtubePlayerBridge';

export interface TrackCapabilities {
  canSeek: boolean;
  canChangeSpeed: boolean;
  canLoopAB: boolean;
  canEqualize: boolean;
  canSpatialAudio: boolean;
  canApplyEffects: boolean;
  canStemSeparate: boolean;
  canExportAudio: boolean;
  hasRealTimeSpectrum: boolean;
  hasAudioAnalysis: boolean;
  sourceType: 'local' | 'youtube' | 'curated_stream' | 'audius';
  sourceDisplayName: string;
}

export function getTrackCapabilities(track: Track | null): TrackCapabilities {
  if (!track || track.source === 'local') {
    return {
      canSeek: true,
      canChangeSpeed: true,
      canLoopAB: true,
      canEqualize: true,
      canSpatialAudio: true,
      canApplyEffects: true,
      canStemSeparate: true,
      canExportAudio: true,
      hasRealTimeSpectrum: true,
      hasAudioAnalysis: true,
      sourceType: 'local',
      sourceDisplayName: 'Local Audio',
    };
  }

  if (track.source === 'audius') {
    return {
      canSeek: true,
      canChangeSpeed: true,
      canLoopAB: true,
      canEqualize: true,
      canSpatialAudio: true,
      canApplyEffects: true,
      canStemSeparate: false,
      canExportAudio: false,
      hasRealTimeSpectrum: true,
      hasAudioAnalysis: false,
      sourceType: 'audius',
      sourceDisplayName: 'Audius Stream',
    };
  }

  if (track.source === 'youtube') {
    return {
      canSeek: true,
      canChangeSpeed: true,
      canLoopAB: true,
      canEqualize: false,
      canSpatialAudio: false,
      canApplyEffects: false,
      canStemSeparate: false,
      canExportAudio: false,
      hasRealTimeSpectrum: false,
      hasAudioAnalysis: false,
      sourceType: 'youtube',
      sourceDisplayName: 'YouTube Stream',
    };
  }

  return {
    canSeek: true,
    canChangeSpeed: true,
    canLoopAB: true,
    canEqualize: true,
    canSpatialAudio: true,
    canApplyEffects: true,
    canStemSeparate: false,
    canExportAudio: false,
    hasRealTimeSpectrum: true,
    hasAudioAnalysis: true,
    sourceType: 'curated_stream',
    sourceDisplayName: 'Aura Catalog',
  };
}

export interface IPlaybackAdapter {
  sourceType: 'local' | 'youtube' | 'curated_stream' | 'audius';
  play(): Promise<void> | void;
  pause(): void;
  seek(seconds: number): void;
  setVolume(volumeNormalized: number): void;
  setMute(isMuted: boolean): void;
  setPlaybackRate(rate: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  isPlaying(): boolean;
  destroy?(): void;
}

export class LocalPlaybackAdapter implements IPlaybackAdapter {
  sourceType: 'local' = 'local';

  play() {
    return audioEngine.play();
  }

  pause() {
    audioEngine.pause();
  }

  seek(seconds: number) {
    audioEngine.seek(seconds);
  }

  setVolume(volumeNormalized: number) {
    audioEngine.setVolume(volumeNormalized);
  }

  setMute(isMuted: boolean) {
    audioEngine.setMute(isMuted);
  }

  setPlaybackRate(rate: number) {
    audioEngine.setPlaybackRate(rate);
  }

  getCurrentTime(): number {
    return audioEngine.getCurrentTime();
  }

  getDuration(): number {
    return audioEngine.getDuration();
  }

  isPlaying(): boolean {
    return audioEngine.isPlaying();
  }
}

export class YouTubePlaybackAdapter implements IPlaybackAdapter {
  sourceType: 'youtube' = 'youtube';

  play() {
    youtubePlayerBridge.play();
  }

  pause() {
    youtubePlayerBridge.pause();
  }

  seek(seconds: number) {
    youtubePlayerBridge.seekTo(seconds);
  }

  setVolume(volumeNormalized: number) {
    youtubePlayerBridge.setVolume(Math.round(volumeNormalized * 100));
  }

  setMute(isMuted: boolean) {
    youtubePlayerBridge.setMute(isMuted);
  }

  setPlaybackRate(rate: number) {
    youtubePlayerBridge.setPlaybackRate(rate);
  }

  getCurrentTime(): number {
    return youtubePlayerBridge.getState().currentTime;
  }

  getDuration(): number {
    return youtubePlayerBridge.getState().duration;
  }

  isPlaying(): boolean {
    return youtubePlayerBridge.getState().isPlaying;
  }
}

export class AudiusPlaybackAdapter implements IPlaybackAdapter {
  sourceType: 'audius' = 'audius';

  play() {
    return audioEngine.play();
  }

  pause() {
    audioEngine.pause();
  }

  seek(seconds: number) {
    audioEngine.seek(seconds);
  }

  setVolume(volumeNormalized: number) {
    audioEngine.setVolume(volumeNormalized);
  }

  setMute(isMuted: boolean) {
    audioEngine.setMute(isMuted);
  }

  setPlaybackRate(rate: number) {
    audioEngine.setPlaybackRate(rate);
  }

  getCurrentTime(): number {
    return audioEngine.getCurrentTime();
  }

  getDuration(): number {
    return audioEngine.getDuration();
  }

  isPlaying(): boolean {
    return audioEngine.isPlaying();
  }
}

export const localPlaybackAdapter = new LocalPlaybackAdapter();
export const youtubePlaybackAdapter = new YouTubePlaybackAdapter();
export const audiusPlaybackAdapter = new AudiusPlaybackAdapter();

