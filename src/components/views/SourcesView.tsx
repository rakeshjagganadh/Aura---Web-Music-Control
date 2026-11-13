import React, { useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'motion/react';
import { useMusic } from '../../context/MusicContext';
import { 
  Radio, 
  HardDrive, 
  Sparkles, 
  Youtube, 
  Music,
  CheckCircle2, 
  SlidersHorizontal, 
  ShieldCheck, 
  Plus, 
  Play,
  Loader2
} from 'lucide-react';
import { DEFAULT_MUSIC_SOURCES, canApplyDSP, canTrimOrExport } from '../../services/sourceService';
import { createWebStreamTrack, createYouTubeTrack, CURATED_DISCOVERY_TRACKS } from '../../services/discoveryService';
import { audiusService } from '../../services/audiusService';
import { jamendoProvider } from '../../services/providers/jamendoProvider';
import { radioBrowserProvider } from '../../services/providers/radioBrowserProvider';
import { unifiedTrackToAuraTrack, radioStationToAuraTrack } from '../../services/providers/types';

import { providerRegistry } from '../../services/providers/providerRegistry';
import { MotionFadeSlide, MotionBackdrop, MotionModal } from '../common/motion/MotionSurface';
import { MotionIconSwap, SharedIndicator } from '../common/motion/MotionInteractive';
import { useMotionCapabilities } from '../../motion/useMotionCapabilities';

export const SourcesView: React.FC = () => {
  const {
    tracks,
    storageUsage,
    setIsUploadModalOpen,
    playTrack,
    currentTrack,
    showToast,
  } = useMusic();

  const { prefersReducedMotion } = useMotionCapabilities();

  const [streamUrlInput, setStreamUrlInput] = useState('');
  const [streamTitleInput, setStreamTitleInput] = useState('');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [showAddStream, setShowAddStream] = useState(false);
  const [showAddYoutube, setShowAddYoutube] = useState(false);
  const [isLoadingAudiusTrending, setIsLoadingAudiusTrending] = useState(false);
  const [isLoadingJamendo, setIsLoadingJamendo] = useState(false);
  const [isLoadingRadio, setIsLoadingRadio] = useState(false);
  const [providerHealth, setProviderHealth] = useState<Record<string, boolean>>({});

  // Radio Browser Interactive Explorer State
  const [showRadioExplorer, setShowRadioExplorer] = useState(false);
  const [radioActiveFilter, setRadioActiveFilter] = useState<'top' | 'jazz' | 'electronic' | 'ambient' | 'classical' | 'rock' | 'news'>('top');
  const [radioStationsList, setRadioStationsList] = useState<any[]>([]);
  const [isLoadingExplorer, setIsLoadingExplorer] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      const providers = providerRegistry.getAll();
      const healthMap: Record<string, boolean> = {};
      for (const p of providers) {
        try {
          const avail = await providerRegistry.isProviderAvailable(p.id);
          if (isMounted) healthMap[p.id] = avail;
        } catch {
          if (isMounted) healthMap[p.id] = false;
        }
      }
      if (isMounted) setProviderHealth(healthMap);
    }
    checkHealth();
    return () => { isMounted = false; };
  }, []);

  const handlePlayJamendoTrending = async () => {
    try {
      setIsLoadingJamendo(true);
      const tracks = await jamendoProvider.getTrending({ limit: 10 });
      if (tracks.length > 0) {
        const auraTracks = tracks.map((t) => unifiedTrackToAuraTrack(t));
        await playTrack(auraTracks[0], auraTracks);
        showToast(`Playing "${auraTracks[0].title}" from Jamendo Trending`, 'success');
      } else {
        showToast('Could not load Jamendo tracks. Please try searching directly.', 'warning');
      }
    } catch {
      showToast('Failed to reach Jamendo API.', 'error');
    } finally {
      setIsLoadingJamendo(false);
    }
  };

  const loadRadioCategory = async (filter: 'top' | 'jazz' | 'electronic' | 'ambient' | 'classical' | 'rock' | 'news') => {
    try {
      setIsLoadingExplorer(true);
      setRadioActiveFilter(filter);
      let stations: any[] = [];
      if (filter === 'top') {
        stations = await radioBrowserProvider.getTopVotedStations(12);
      } else {
        stations = await radioBrowserProvider.getStationsByTag(filter, 12);
      }
      setRadioStationsList(stations);
    } catch {
      showToast(`Could not load ${filter} stations.`, 'error');
    } finally {
      setIsLoadingExplorer(false);
    }
  };

  const handlePlayAudiusTrending = async () => {
    try {
      setIsLoadingAudiusTrending(true);
      const res = await audiusService.getTrending(10);
      if (res.items.length > 0) {
        await playTrack(res.items[0], res.items);
        showToast(`Playing "${res.items[0].title}" from Audius Trending`, 'success');
      } else {
        showToast(res.error || 'No Audius tracks returned at this moment. Please try searching.', 'warning');
      }
    } catch (err) {
      showToast('Could not reach Audius network node. Please try again.', 'error');
    } finally {
      setIsLoadingAudiusTrending(false);
    }
  };

  const localTrackCount = tracks.filter((t) => !t.source || t.source === 'local').length;

  const handleAddCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrlInput.trim()) return;
    const stream = createWebStreamTrack(
      streamUrlInput.trim(),
      streamTitleInput.trim() || 'Live Web Stream'
    );
    playTrack(stream);
    setStreamUrlInput('');
    setStreamTitleInput('');
    setShowAddStream(false);
  };

  const handleAddYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    const q = youtubeInput.trim();
    if (!q) return;

    let videoId = q;
    if (q.includes('v=')) {
      videoId = q.split('v=')[1]?.split('&')[0] || '';
    } else if (q.includes('youtu.be/')) {
      videoId = q.split('youtu.be/')[1]?.split('?')[0] || '';
    }

    if (videoId) {
      const ytTrack = createYouTubeTrack(videoId, `YouTube Video (${videoId})`);
      playTrack(ytTrack);
      setYoutubeInput('');
      setShowAddYoutube(false);
    }
  };

  const formatStorageMB = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 p-4 sm:p-8 max-w-6xl mx-auto select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/[0.04] text-zinc-200 border border-white/[0.06]">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-page-title text-white">Music Sources & Radio</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Connect where your music lives. AURA serves as your universal listening and sound customization layer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold shadow-md transition-colors cursor-pointer aura-pressable aura-focus-ring"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Music / Source</span>
          </button>
        </div>
      </div>

      {/* Primary Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Source 1: Local Audio Files */}
        <div className="p-5 rounded-2xl aura-glass-ambient flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">Local Device Vault</h3>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Connected & Active
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Full DSP
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Your audio files (MP3, WAV, FLAC, AAC, OGG) stored locally in browser IndexedDB. Offers zero-latency Web Audio processing, 10-band EQ, 3D spatial acoustics, and lossless master WAV export.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-2 border-t border-white/5">
              <span>{localTrackCount} tracks stored</span>
              <span>•</span>
              <span>{formatStorageMB(storageUsage.bytesUsed)} used</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer aura-pressable aura-focus-ring"
            >
              Import Files / Folders
            </button>
          </div>
        </div>

        {/* Source 2: Curated Open Sound Catalog */}
        <div className="p-5 rounded-2xl aura-glass-ambient flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">AURA Open Sound Catalog</h3>
                  <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Built-in Streams
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Lossless DSP
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Curated royalty-free and Creative Commons soundscapes (Ambient 432Hz, Cyber Synthwave, Lo-Fi Study, Neo-Classical Grand) ready to stream instantly without uploading any files.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-2 border-t border-white/5">
              <span>{CURATED_DISCOVERY_TRACKS.length} instant streams</span>
              <span>•</span>
              <span>Real-time Spectrum</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => playTrack(CURATED_DISCOVERY_TRACKS[0], CURATED_DISCOVERY_TRACKS)}
              className="flex-1 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer aura-pressable aura-focus-ring"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Listen to Curated Stream
            </button>
          </div>
        </div>

        {/* Source 3: Audius Music Network */}
        <div className="p-5 rounded-2xl aura-glass-ambient flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">Audius Decentralized Catalog</h3>
                  <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Public Web Streaming
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Full DSP & EQ
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Decentralized Web3 music catalog powered by independent creators. Direct public high-quality HTTP audio streaming with full 10-band EQ, 3D spatial sound, reverb, and real-time audio analysis.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-2 border-t border-white/5">
              <span>Public Discovery</span>
              <span>•</span>
              <span>No Login or Key Required</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlayAudiusTrending}
              disabled={isLoadingAudiusTrending}
              className="flex-1 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed aura-pressable aura-focus-ring"
            >
              <MotionIconSwap
                stateKey={isLoadingAudiusTrending ? 'loading' : 'ready'}
                className="inline-flex items-center justify-center gap-1.5"
              >
                {isLoadingAudiusTrending ? (
                  <>
                    <Loader2 className={`w-3.5 h-3.5 ${!prefersReducedMotion ? 'animate-spin' : ''}`} />
                    <span>Loading Audius Trending...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Trending Audius Tracks</span>
                  </>
                )}
              </MotionIconSwap>
            </button>
          </div>
        </div>

        {/* Source: Jamendo Music Catalog */}
        <div className="p-5 rounded-2xl aura-glass-ambient flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">Jamendo Music Catalog</h3>
                  <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Creative Commons API
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Open CORS DSP
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Official Jamendo API integration. Free independent music under Creative Commons licenses with high-fidelity MP3 streams, full 10-band EQ, 3D audio, and waveform rendering.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-2 border-t border-white/5">
              <span>600,000+ Tracks</span>
              <span>•</span>
              <span>100% Free & Legal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlayJamendoTrending}
              disabled={isLoadingJamendo}
              className="flex-1 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed aura-pressable aura-focus-ring"
            >
              <MotionIconSwap
                stateKey={isLoadingJamendo ? 'loading' : 'ready'}
                className="inline-flex items-center justify-center gap-1.5"
              >
                {isLoadingJamendo ? (
                  <>
                    <Loader2 className={`w-3.5 h-3.5 ${!prefersReducedMotion ? 'animate-spin' : ''}`} />
                    <span>Loading Jamendo Tracks...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Trending Jamendo Tracks</span>
                  </>
                )}
              </MotionIconSwap>
            </button>
          </div>
        </div>

        {/* Source: Radio Browser Global Directory */}
        <div className="p-5 rounded-2xl aura-glass-ambient flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">Radio Browser Directory</h3>
                  <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Live Internet Radio
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Live DSP
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Global community directory with 60,000+ live internet radio stations. Filter by genre, country, and codec with continuous live audio streaming.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-2 border-t border-white/5">
              <span>60,000+ Stations</span>
              <span>•</span>
              <span>Live Broadcast</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setShowRadioExplorer(true);
                if (radioStationsList.length === 0) {
                  loadRadioCategory('top');
                }
              }}
              className="w-full py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer aura-pressable aura-focus-ring"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Explore Radio Stations</span>
            </button>
          </div>
        </div>

        {/* Source 4: YouTube Web Embed Player */}
        <div className="p-6 rounded-3xl bg-[#0c0e15]/70 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-6 shadow-xl">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">YouTube Embed Player</h3>
                  <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                    Official Web Embed
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">
                EMBEDDED
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Official embedded YouTube playback player. Search or paste video links to listen with universal playback controls, queues, and favorites.
            </p>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {showAddYoutube ? (
              <MotionFadeSlide key="yt-form" direction="up" distance={6} duration="micro">
                <form onSubmit={handleAddYoutube} className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <input
                    type="text"
                    value={youtubeInput}
                    onChange={(e) => setYoutubeInput(e.target.value)}
                    placeholder="Paste YouTube URL or Video ID (e.g. dQw4w9WgXcQ)"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors cursor-pointer aura-pressable aura-focus-ring"
                  >
                    Play
                  </button>
                </form>
              </MotionFadeSlide>
            ) : (
              <MotionFadeSlide key="yt-btn" direction="up" distance={6} duration="micro">
                <button
                  type="button"
                  onClick={() => setShowAddYoutube(true)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer aura-pressable aura-focus-ring"
                >
                  + Open YouTube Link
                </button>
              </MotionFadeSlide>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Radio Explorer Modal / Drawer */}
      <AnimatePresence>
        {showRadioExplorer && (
          <MotionBackdrop
            onClick={() => setShowRadioExplorer(false)}
            style={{ pointerEvents: showRadioExplorer ? 'auto' : 'none' }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <MotionModal
              variant="center"
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0e1017] border border-white/10 rounded-3xl p-6 w-full max-w-2xl shadow-2xl flex flex-col gap-4 max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Global Radio Explorer</h2>
                    <p className="text-xs text-zinc-400">Filter stations by category or top votes</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRadioExplorer(false)}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 cursor-pointer aura-pressable aura-focus-ring"
                >
                  Close
                </button>
              </div>

              {/* Filter Pills */}
              <LayoutGroup id="radio-explorer-filters">
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {(['top', 'ambient', 'jazz', 'electronic', 'classical', 'rock', 'news'] as const).map((cat) => {
                    const isActive = radioActiveFilter === cat;
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => loadRadioCategory(cat)}
                        className={`relative px-3 py-1 rounded-xl font-mono text-[11px] capitalize transition-colors cursor-pointer aura-pressable aura-focus-ring ${
                          isActive
                            ? 'text-cyan-300 font-semibold'
                            : 'bg-white/[0.03] text-zinc-400 hover:text-zinc-200 border border-white/5'
                        }`}
                      >
                        {isActive && (
                          <SharedIndicator
                            layoutId="radio-explorer-filter-pill"
                            className="absolute inset-0 rounded-xl bg-cyan-500/20 border border-cyan-500/40"
                          />
                        )}
                        <span className="relative z-10">{cat === 'top' ? '★ Top Voted' : cat}</span>
                      </button>
                    );
                  })}
                </div>
              </LayoutGroup>

              {/* Stations Grid / List */}
              <div className="flex-1 overflow-y-auto pr-1 min-h-[250px]">
                <AnimatePresence mode="wait" initial={false}>
                  <MotionFadeSlide
                    key={isLoadingExplorer ? 'loading' : radioStationsList.length === 0 ? 'empty' : radioActiveFilter}
                    direction="up"
                    distance={6}
                    duration="micro"
                    className="flex flex-col gap-2"
                  >
                    {isLoadingExplorer ? (
                      <div
                        className="flex flex-col gap-2"
                        aria-busy="true"
                        aria-label={`Loading ${radioActiveFilter} stations`}
                      >
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-lg aura-skeleton shrink-0" />
                              <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                                <div className="h-3.5 w-2/5 rounded aura-skeleton" />
                                <div className="h-2.5 w-3/5 rounded aura-skeleton" />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-10 h-5 rounded aura-skeleton" />
                              <div className="w-8 h-8 rounded-lg aura-skeleton" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : radioStationsList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 text-xs font-mono">
                        <span>No stations found for this category.</span>
                      </div>
                    ) : (
                      radioStationsList.map((st) => {
                        const auraTrack = radioStationToAuraTrack(st);
                        const isCurrent = currentTrack?.id === auraTrack.id;
                        const isHls = st.codec?.toLowerCase().includes('hls') || st.streamUrl?.includes('.m3u8');
                        return (
                          <div
                            key={st.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                              isCurrent
                                ? 'bg-cyan-950/40 border-cyan-500/40 text-white'
                                : 'bg-white/[0.02] border-white/5 text-zinc-300 hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                {st.favicon ? (
                                  <img src={st.favicon} alt={st.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Radio className="w-4 h-4 text-zinc-600" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold truncate text-white">{st.name}</p>
                                <p className="text-[10px] font-mono text-zinc-400 truncate">
                                  {st.country || 'Global'} • {st.tags.slice(0, 3).join(', ') || 'Live Broadcast'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isHls && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  HLS
                                </span>
                              )}
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/10">
                                {st.codec || 'MP3'}
                              </span>
                              <button
                                onClick={() => {
                                  playTrack(auraTrack);
                                  showToast(`Connecting to "${st.name}"...`, 'info');
                                }}
                                className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer aura-pressable"
                                title="Play Station"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </MotionFadeSlide>
                </AnimatePresence>
              </div>
            </MotionModal>
          </MotionBackdrop>
        )}
      </AnimatePresence>

      {/* Capabilities & Compatibility Matrix */}
      <div className="p-6 rounded-3xl bg-[#090b10] border border-white/5 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Source Capabilities & DSP Processing Matrix
          </h2>
        </div>

        <p className="text-xs text-zinc-400">
          AURA honestly reflects what each source can technically support without faking streams or scraping:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-zinc-500">
                <th className="py-2 font-medium">Source Type</th>
                <th className="py-2 font-medium">Playback & Seek</th>
                <th className="py-2 font-medium">10-Band EQ & Spatial</th>
                <th className="py-2 font-medium">Universal Queue</th>
                <th className="py-2 font-medium">Source-Specific Audio</th>
                <th className="py-2 font-medium">Master WAV Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              <tr>
                <td className="py-2.5 font-bold text-white">Local Library Files</td>
                <td className="py-2.5 text-emerald-400">✓ Full</td>
                <td className="py-2.5 text-emerald-400">✓ Unlocked</td>
                <td className="py-2.5 text-emerald-400">✓ Supported</td>
                <td className="py-2.5 text-emerald-400">✓ Zero-Gap Web Audio</td>
                <td className="py-2.5 text-emerald-400">✓ Lossless 32-bit</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-amber-300">Jamendo (Creative Commons)</td>
                <td className="py-2.5 text-emerald-400">✓ Full</td>
                <td className="py-2.5 text-emerald-400">✓ Unlocked (Open CORS)</td>
                <td className="py-2.5 text-emerald-400">✓ Supported</td>
                <td className="py-2.5 text-emerald-400">✓ Direct MP3 Stream</td>
                <td className="py-2.5 text-zinc-500">— Stream Only</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-cyan-300">Radio Browser (Live Radio)</td>
                <td className="py-2.5 text-amber-400">✓ Live Stream (No Seek)</td>
                <td className="py-2.5 text-emerald-400">✓ Unlocked (AudioContext)</td>
                <td className="py-2.5 text-emerald-400">✓ Supported</td>
                <td className="py-2.5 text-emerald-400">✓ Live ICY/AAC Stream</td>
                <td className="py-2.5 text-zinc-500">— Stream Only</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-purple-300">Audius Decentralized</td>
                <td className="py-2.5 text-emerald-400">✓ Full HTTP Range</td>
                <td className="py-2.5 text-emerald-400">✓ Unlocked (AudioContext)</td>
                <td className="py-2.5 text-emerald-400">✓ Supported</td>
                <td className="py-2.5 text-emerald-400">✓ Public Direct Stream</td>
                <td className="py-2.5 text-zinc-500">— Stream Only</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-white">Curated Open Audio</td>
                <td className="py-2.5 text-emerald-400">✓ Full</td>
                <td className="py-2.5 text-emerald-400">✓ Unlocked</td>
                <td className="py-2.5 text-emerald-400">✓ Supported</td>
                <td className="py-2.5 text-emerald-400">✓ Web Audio Stream</td>
                <td className="py-2.5 text-zinc-500">— Stream Only</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-white">YouTube Embed</td>
                <td className="py-2.5 text-emerald-400">✓ Embed API</td>
                <td className="py-2.5 text-zinc-500">— YouTube Output</td>
                <td className="py-2.5 text-emerald-400">✓ Supported</td>
                <td className="py-2.5 text-emerald-400">✓ IFrame API Bridge</td>
                <td className="py-2.5 text-zinc-500">— Protected Media</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Privacy Seal */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/5 text-[11px] text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            AURA respects copyright and privacy. No unauthorized audio stream extraction or third-party scraping is performed.
          </span>
        </div>
      </div>

    </div>
  );
};
