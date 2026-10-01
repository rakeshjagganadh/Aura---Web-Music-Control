import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Search, 
  Volume2, 
  CheckCircle, 
  AlertCircle, 
  RotateCw, 
  Radio, 
  ExternalLink,
  FastForward,
  Cpu
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  source: string;
}

interface StreamHeaders {
  status: number;
  statusText: string;
  contentType: string | null;
  contentLength: string | null;
  acceptRanges: string | null;
  contentRange: string | null;
  range206Working: boolean | null;
}

export const YouTubeStreamTesterModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ');
  const [searchQuery, setSearchQuery] = useState('daft punk');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');
  const [headers, setHeaders] = useState<StreamHeaders | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionError, setInspectionError] = useState<string | null>(null);

  const [audioEvents, setAudioEvents] = useState<string[]>([]);
  const [audioStats, setAudioStats] = useState({
    currentTime: 0,
    duration: 0,
    paused: true,
    ended: false,
    readyState: 0,
    bufferedSecs: 0,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const logEvent = (name: string, details = '') => {
    const time = new Date().toLocaleTimeString();
    setAudioEvents((prev) => [`[${time}] ${name} ${details}`.trim(), ...prev.slice(0, 19)]);
  };

  // Perform search test using /api/yt/search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/yt/search?q=${encodeURIComponent(searchQuery.trim())}&limit=6`);
      if (!res.ok) {
        throw new Error(`Search returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch (err: any) {
      setSearchError(err?.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Inspect headers & test Range request
  const inspectStream = async (idToTest: string) => {
    setIsInspecting(true);
    setInspectionError(null);
    try {
      // 1. Test Range 206 request directly
      const rangeRes = await fetch(`/api/yt/audio?id=${idToTest}`, {
        headers: {
          Range: 'bytes=0-1024',
        },
      });

      const contentType = rangeRes.headers.get('content-type');
      const contentLength = rangeRes.headers.get('content-length');
      const acceptRanges = rangeRes.headers.get('accept-ranges');
      const contentRange = rangeRes.headers.get('content-range');
      const isRangeWorking = rangeRes.status === 206;

      if (!rangeRes.ok && rangeRes.status !== 206) {
        const errorData = await rangeRes.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${rangeRes.status}: ${rangeRes.statusText}`);
      }

      setHeaders({
        status: rangeRes.status,
        statusText: rangeRes.statusText || (rangeRes.status === 206 ? 'Partial Content' : 'OK'),
        contentType,
        contentLength,
        acceptRanges,
        contentRange,
        range206Working: isRangeWorking,
      });
    } catch (err: any) {
      setInspectionError(err?.message || 'Stream inspection failed');
    } finally {
      setIsInspecting(false);
    }
  };

  // Mount stream to HTMLAudioElement
  const handleLoadAudio = async (idToLoad = videoId) => {
    const cleanId = idToLoad.trim();
    if (!cleanId) return;

    setVideoId(cleanId);
    const streamUrl = `/api/yt/audio?id=${cleanId}`;
    setActiveStreamUrl(streamUrl);
    setAudioEvents([]);
    logEvent('Loading URL', streamUrl);

    // Run header diagnostics
    inspectStream(cleanId);

    if (audioRef.current) {
      audioRef.current.src = streamUrl;
      audioRef.current.load();
    }
  };

  // Audio element event listeners
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onPlay = () => {
      logEvent('EVENT: play');
      setAudioStats((s) => ({ ...s, paused: false, ended: false }));
    };
    const onPause = () => {
      logEvent('EVENT: pause');
      setAudioStats((s) => ({ ...s, paused: true }));
    };
    const onPlaying = () => logEvent('EVENT: playing');
    const onWaiting = () => logEvent('EVENT: waiting (buffering)');
    const onCanPlay = () => logEvent('EVENT: canplay');
    const onLoadedMetadata = () => {
      logEvent('EVENT: loadedmetadata', `Duration: ${el.duration.toFixed(2)}s`);
      setAudioStats((s) => ({ ...s, duration: el.duration || 0 }));
    };
    const onSeeking = () => logEvent('EVENT: seeking', `Target: ${el.currentTime.toFixed(2)}s`);
    const onSeeked = () => logEvent('EVENT: seeked', `Current: ${el.currentTime.toFixed(2)}s`);
    const onEnded = () => {
      logEvent('EVENT: ended');
      setAudioStats((s) => ({ ...s, ended: true, paused: true }));
    };
    const onError = () => {
      const err = el.error;
      logEvent('ERROR: audio.error', `Code: ${err?.code || 'unknown'} - ${err?.message || ''}`);
    };
    const onTimeUpdate = () => {
      let buffered = 0;
      if (el.buffered.length > 0) {
        buffered = el.buffered.end(el.buffered.length - 1);
      }
      setAudioStats((s) => ({
        ...s,
        currentTime: el.currentTime,
        duration: el.duration || s.duration,
        readyState: el.readyState,
        bufferedSecs: buffered,
      }));
    };

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('playing', onPlaying);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('seeking', onSeeking);
    el.addEventListener('seeked', onSeeked);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);
    el.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('playing', onPlaying);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('seeking', onSeeking);
      el.removeEventListener('seeked', onSeeked);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
      el.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-950 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Phase 1 YouTube Stream Architecture Tester</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  HTMLAudioElement Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Tests server stream resolution (`/api/yt/audio`) & search (`/api/yt/search`) bypassing the IFrame
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Audio Stream Resolution Test */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                1. Test Audio Stream Resolution (/api/yt/audio)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadAudio('dQw4w9WgXcQ')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 font-mono transition-colors"
                >
                  Load Rick Astley (Known Playable)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="11-character YouTube video ID (e.g. dQw4w9WgXcQ)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-black border border-white/10 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleLoadAudio(videoId)}
                disabled={isInspecting}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isInspecting ? <RotateCw className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                <span>Load & Test</span>
              </button>
            </div>

            {/* Native HTMLAudioElement */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold text-zinc-200">Native &lt;audio&gt; Element (No IFrame)</span>
                <span className="font-mono text-[11px] text-zinc-500 truncate max-w-xs">{activeStreamUrl || 'No stream mounted'}</span>
              </div>
              <audio
                ref={audioRef}
                controls
                className="w-full h-11 rounded-lg accent-emerald-500"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => audioRef.current?.play()}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-zinc-200 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Play
                </button>
                <button
                  type="button"
                  onClick={() => audioRef.current?.pause()}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-zinc-200 flex items-center gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (audioRef.current) audioRef.current.currentTime = 30;
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-zinc-200 flex items-center gap-1.5"
                >
                  <FastForward className="w-3.5 h-3.5" /> Seek to 30s
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (audioRef.current) audioRef.current.currentTime = 60;
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-zinc-200 flex items-center gap-1.5"
                >
                  <FastForward className="w-3.5 h-3.5" /> Seek to 60s
                </button>
              </div>
            </div>

            {/* Diagnostic Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">HTTP Status</span>
                <div className="font-mono text-sm font-bold flex items-center gap-1.5">
                  {headers ? (
                    <span className={headers.status === 206 || headers.status === 200 ? 'text-emerald-400' : 'text-amber-400'}>
                      {headers.status} {headers.statusText}
                    </span>
                  ) : (
                    <span className="text-zinc-500">Unchecked</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Content-Type</span>
                <div className="font-mono text-xs font-bold text-zinc-200 truncate">
                  {headers?.contentType || 'None'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Accept-Ranges (206)</span>
                <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                  {headers?.range206Working ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Yes (206 Supported)
                    </span>
                  ) : headers ? (
                    <span className="text-amber-400">Not verified</span>
                  ) : (
                    <span className="text-zinc-500">None</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Audio Position / Dur</span>
                <div className="font-mono text-xs font-bold text-zinc-200">
                  {audioStats.currentTime.toFixed(1)}s / {audioStats.duration.toFixed(1)}s
                </div>
              </div>
            </div>

            {inspectionError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inspectionError}</span>
              </div>
            )}
          </div>

          {/* Section 2: Real-time Audio Events & Logs */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              2. HTMLAudioElement Lifecycle Events
            </span>
            <div className="h-32 overflow-y-auto p-3 rounded-xl bg-black font-mono text-[11px] text-zinc-300 space-y-1 select-all border border-white/5">
              {audioEvents.length === 0 ? (
                <span className="text-zinc-600">No events logged yet. Load a track to observe lifecycle.</span>
              ) : (
                audioEvents.map((evt, idx) => (
                  <div key={idx} className={evt.includes('ERROR') ? 'text-red-400' : 'text-zinc-300'}>
                    {evt}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 3: YouTube Search API Verification */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              3. Test YouTube Search API (/api/yt/search - Zero Google API Key)
            </span>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search songs, artists, lofi, etc..."
                className="flex-1 px-4 py-2 rounded-xl bg-black border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-100 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSearching ? <RotateCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Search</span>
              </button>
            </div>

            {searchError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {searchError}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadAudio(item.id)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 hover:bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group"
                  >
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                        <Radio className="w-5 h-5 text-zinc-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-400 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {item.artist} • {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-white/5 text-zinc-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300">
                      Test
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Phase 1 Verification: Production IFrame player remains 100% untouched.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
          >
            Close Diagnostics
          </button>
        </div>

      </div>
    </div>
  );
};
