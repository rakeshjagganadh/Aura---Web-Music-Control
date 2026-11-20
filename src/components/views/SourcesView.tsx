import React, { useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'motion/react';
import { useMusic } from '../../context/MusicContext';
import { AuraIcon } from '../ui/AuraIcon';
import { YouTubeBrandMark } from '../ui/BrandMarks';
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
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';

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
  const radioDialogRef = useDialogAccessibility<HTMLDivElement>({
    isOpen: showRadioExplorer,
    onClose: () => setShowRadioExplorer(false),
  });

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
    <div className="flex flex-col gap-4 sm:gap-8 p-3 sm:p-8 pb-6 max-w-6xl mx-auto select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3">
          <AuraIcon name="radio" size={22} className="text-zinc-300 shrink-0 mt-1" />
          <div>
            <h1 className="text-lg sm:text-2xl font-page-title text-white">Music Sources & Radio</h1>
            <p className="hidden sm:block text-xs text-zinc-400 mt-0.5">
              Connect where your music lives. AURA acts as your universal listening and sound layer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="min-h-[40px] flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold shadow-md transition-colors cursor-pointer aura-pressable aura-focus-ring"
          >
            <AuraIcon name="add" size={14} weight={600} />
            <span>Add Music / Source</span>
          </button>
        </div>
      </div>

      {/* Primary Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        
        {/* Source 1: Local Audio Files */}
        <div className="p-4 sm:p-5 rounded-2xl aura-glass-ambient flex flex-col justify-between gap-4 sm:gap-5 relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <AuraIcon name="hardDrive" size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">Local Device Vault</h3>
                  <span className={`text-[11px] font-sans font-medium flex items-center gap-1 ${localTrackCount > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    <AuraIcon name={localTrackCount > 0 ? 'checkCircle' : 'folderOpen'} size={12} />
                    {localTrackCount > 0 ? 'Connected & Active' : 'Ready · Empty Vault'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                Full DSP
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Audio files (MP3, WAV, FLAC, AAC, OGG) stored in browser IndexedDB with zero-latency Web Audio EQ, spatial acoustics, and WAV export.
            </p>

            <div className="flex items-center gap-2 text-xs font-sans text-zinc-400 pt-2 border-t border-white/[0.06]">
              <span><span className="font-mono tabular-nums text-zinc-200">{localTrackCount}</span> tracks stored</span>
              <span aria-hidden="true">·</span>
              <span><span className="font-mono tabular-nums text-zinc-200">{formatStorageMB(storageUsage.approxBytes)}</span> used</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 text-xs font-semibold border border-white/[0.08] transition-colors cursor-pointer aura-pressable aura-focus-ring"
            >
              Import Files / Folders
            </button>
          </div>
        </div>

        {/* Source 2: Curated Open Sound Catalog */}
        <div className="p-4 sm:p-5 rounded-2xl aura-glass-ambient flex flex-col justify-between gap-4 sm:gap-5 relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <AuraIcon name="disc" size={18} className="text-cyan-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">AURA Open Sound Catalog</h3>
                  <span className="text-[11px] font-sans text-zinc-400">
                    Built-in Royalty-Free Streams
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-sans text-zinc-400 shrink-0">
                Full DSP
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Curated royalty-free and Creative Commons soundscapes ready to stream immediately without uploading files.
            </p>

            <div className="flex items-center gap-2 text-xs font-sans text-zinc-400 pt-2 border-t border-white/[0.06]">
              <span><span className="font-mono tabular-nums text-zinc-200">{CURATED_DISCOVERY_TRACKS.length}</span> instant streams</span>
              <span aria-hidden="true">·</span>
              <span>Real-time Spectrum</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => playTrack(CURATED_DISCOVERY_TRACKS[0], CURATED_DISCOVERY_TRACKS)}
              className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer aura-pressable aura-focus-ring"
            >
              <AuraIcon name="play" size={14} filled />
              Listen to Curated Stream
            </button>
          </div>
        </div>

        {/* Source 3: Audius Music Network */}
        <div className="p-4 sm:p-5 rounded-2xl aura-glass-ambient flex flex-col justify-between gap-4 sm:gap-5 relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <AuraIcon name="radio" size={18} className="text-purple-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">Audius Decentralized Catalog</h3>
                  <span className="text-[11px] font-sans text-zinc-400">
                    Public Web Streaming
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-sans text-zinc-400 shrink-0">
                DSP & EQ
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Independent creator catalog over direct HTTP streams with 10-band EQ, spatial sound, reverb, and real-time analysis.
            </p>

            <div className="flex items-center gap-2 text-xs font-sans text-zinc-400 pt-2 border-t border-white/[0.06]">
              <span>Public Discovery</span>
              <span aria-hidden="true">·</span>
              <span>No Account Required</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlayAudiusTrending}
              disabled={isLoadingAudiusTrending}
              className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed aura-pressable aura-focus-ring"
            >
              <MotionIconSwap
                stateKey={isLoadingAudiusTrending ? 'loading' : 'ready'}
                className="inline-flex items-center justify-center gap-1.5"
              >
                {isLoadingAudiusTrending ? (
                  <>
                    <AuraIcon name="loader" size={14} className={!prefersReducedMotion ? 'animate-spin' : ''} />
                    <span>Loading Audius Trending...</span>
                  </>
                ) : (
                  <>
                    <AuraIcon name="play" size={14} filled />
                    <span>Play Trending Audius Tracks</span>
                  </>
                )}
              </MotionIconSwap>
            </button>
          </div>
        </div>

        {/* Source: Jamendo Music Catalog */}
        <div className="p-4 sm:p-5 rounded-2xl aura-glass-ambient flex flex-col justify-between gap-4 sm:gap-5 relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <AuraIcon name="musicNote" size={18} className="text-amber-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">Jamendo Music Catalog</h3>
                  <span className="text-[11px] font-sans text-zinc-400">
                    Creative Commons API
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-sans text-zinc-400 shrink-0">
                CORS DSP
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Independent music under Creative Commons licenses with MP3 streaming, 10-band EQ, 3D audio, and waveform rendering.
            </p>

            <div className="flex items-center gap-2 text-xs font-sans text-zinc-400 pt-2 border-t border-white/[0.06]">
              <span><span className="font-mono tabular-nums text-zinc-200">600,000+</span> Tracks</span>
              <span aria-hidden="true">·</span>
              <span>Free & Licensed</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlayJamendoTrending}
              disabled={isLoadingJamendo}
              className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed aura-pressable aura-focus-ring"
            >
              <MotionIconSwap
                stateKey={isLoadingJamendo ? 'loading' : 'ready'}
                className="inline-flex items-center justify-center gap-1.5"
              >
                {isLoadingJamendo ? (
                  <>
                    <AuraIcon name="loader" size={14} className={!prefersReducedMotion ? 'animate-spin' : ''} />
                    <span>Loading Jamendo Tracks...</span>
                  </>
                ) : (
                  <>
                    <AuraIcon name="play" size={14} filled />
                    <span>Play Trending Jamendo Tracks</span>
                  </>
                )}
              </MotionIconSwap>
            </button>
          </div>
        </div>

        {/* Source: Radio Browser Global Directory */}
        <div className="p-4 sm:p-5 rounded-2xl aura-glass-ambient flex flex-col justify-between gap-4 sm:gap-5 relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <AuraIcon name="radio" size={18} className="text-cyan-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">Radio Browser Directory</h3>
                  <span className="text-[11px] font-sans text-zinc-400">
                    Live Internet Radio
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-sans text-zinc-400 shrink-0">
                Live DSP
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Global community directory of live internet radio stations filtered by genre, country, and broadcast codec.
            </p>

            <div className="flex items-center gap-2 text-xs font-sans text-zinc-400 pt-2 border-t border-white/[0.06]">
              <span><span className="font-mono tabular-nums text-zinc-200">60,000+</span> Stations</span>
              <span aria-hidden="true">·</span>
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
              className="w-full min-h-[40px] py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer aura-pressable aura-focus-ring"
            >
              <AuraIcon name="radio" size={14} />
              <span>Explore Radio Stations</span>
            </button>
          </div>
        </div>

        {/* Source 4: YouTube Web Embed Player */}
        <div className="p-4 sm:p-5 rounded-2xl aura-glass-ambient flex flex-col justify-between gap-4 sm:gap-5 relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <YouTubeBrandMark size={18} className="shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">YouTube Embed Player</h3>
                  <span className="text-[11px] font-sans font-medium text-rose-300/90">
                    Official Web Embed
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                Transport Only
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Paste a video URL or ID to listen through the official embed player with shared queues, speed, and favorites.
            </p>

            <div className="flex items-center gap-2 text-xs font-sans text-zinc-400 pt-2 border-t border-white/[0.06]">
              <span>IFrame API Bridge</span>
              <span aria-hidden="true">·</span>
              <span>Queue & Sync Ready</span>
            </div>
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
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors cursor-pointer aura-pressable aura-focus-ring"
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
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer aura-pressable aura-focus-ring"
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
              ref={radioDialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Global Radio Explorer"
              variant="center"
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0e1017] border border-white/10 rounded-3xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl flex flex-col gap-4 max-h-[90dvh]"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2.5">
                  <AuraIcon name="radio" size={18} className="text-cyan-400 shrink-0" />
                  <div>
                    <h2 className="text-base font-bold text-white">Global Radio Explorer</h2>
                    <p className="text-xs text-zinc-400">Filter stations by category or top votes</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRadioExplorer(false)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 cursor-pointer aura-pressable aura-focus-ring"
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
                        className={`relative px-3 py-1.5 min-h-[38px] rounded-xl font-sans text-xs capitalize transition-colors cursor-pointer aura-pressable aura-focus-ring ${
                          isActive
                            ? 'text-cyan-300 font-semibold'
                            : 'bg-white/[0.03] text-zinc-400 hover:text-zinc-200 border border-white/5 font-medium'
                        }`}
                      >
                        {isActive && (
                          <SharedIndicator
                            layoutId="radio-explorer-filter-pill"
                            className="absolute inset-0 rounded-xl bg-cyan-500/20 border border-cyan-500/40"
                          />
                        )}
                        <span className="relative z-10 inline-flex items-center gap-1">
                          {cat === 'top' ? (
                            <>
                              <AuraIcon name="star" size={12} filled />
                              <span>Top Voted</span>
                            </>
                          ) : (
                            cat
                          )}
                        </span>
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
                      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 text-xs font-sans font-medium">
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
                                : 'bg-white/[0.02] border-white/[0.06] text-zinc-300 hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                {st.favicon ? (
                                  <img
                                    src={st.favicon}
                                    alt={st.name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <AuraIcon name="radio" size={16} className="text-zinc-600" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold truncate text-white">{st.name}</p>
                                <p className="text-[11px] font-sans text-zinc-400 truncate mt-0.5">
                                  <span>{st.country || 'Global'}</span>
                                  <span aria-hidden="true"> · </span>
                                  <span className="font-mono uppercase">{st.codec || 'MP3'}</span>
                                  {isHls && (
                                    <>
                                      <span aria-hidden="true"> · </span>
                                      <span className="font-mono text-amber-300">HLS</span>
                                    </>
                                  )}
                                  {st.tags?.length > 0 && (
                                    <>
                                      <span aria-hidden="true"> · </span>
                                      <span>{st.tags.slice(0, 2).join(', ')}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  playTrack(auraTrack);
                                  showToast(`Connecting to "${st.name}"...`, 'info');
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer aura-pressable aura-focus-ring"
                                title="Play Station"
                                aria-label={`Play ${st.name}`}
                              >
                                <AuraIcon name="play" size={14} filled />
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
      <div className="p-4 sm:p-6 rounded-2xl bg-[#090b10] border border-white/[0.07] flex flex-col gap-3 sm:gap-4 shadow-xl">
        <div className="flex items-center gap-2">
          <AuraIcon name="sliders" size={16} className="text-indigo-400 shrink-0" />
          <h2 className="text-sm font-semibold text-zinc-200">
            Source Capabilities & DSP Matrix
          </h2>
        </div>

        <p className="text-xs text-zinc-400">
          AURA honestly reflects what each source can technically support without faking streams or scraping:
        </p>

        {/* Mobile Compact Capability Cards */}
        <div className="md:hidden flex flex-col gap-2">
          {[
            { name: 'Local Library Files', accent: 'text-white', caps: 'Full Seek · Full DSP & EQ · Master WAV Export' },
            { name: 'Curated Open Audio', accent: 'text-cyan-300', caps: 'Full Seek · Unlocked Web Audio DSP' },
            { name: 'Audius & Jamendo', accent: 'text-purple-300', caps: 'Full Seek · CORS DSP (Direct Fallback)' },
            { name: 'Radio Browser (Live)', accent: 'text-emerald-300', caps: 'Live Stream · Live DSP (When CORS Allowed)' },
            { name: 'YouTube Embed', accent: 'text-rose-300', caps: 'Official Embed API · Universal Queue & Sync' },
          ].map((row) => (
            <div key={row.name} className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.06] flex flex-col gap-0.5">
              <span className={`text-xs font-bold ${row.accent}`}>{row.name}</span>
              <span className="text-[11px] font-mono text-zinc-400">{row.caps}</span>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
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
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Full</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Unlocked</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Supported</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Zero-Gap Web Audio</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Lossless 32-bit</span></span></td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-amber-300">Jamendo (Creative Commons)</td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Full</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>When CORS Allowed (Direct Fallback)</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Supported</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Direct MP3 Stream</span></span></td>
                <td className="py-2.5 text-zinc-500">— Stream Only</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-cyan-300">Radio Browser (Live Radio)</td>
                <td className="py-2.5 text-amber-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Live Stream (No Seek)</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>When CORS Allowed (Direct Fallback)</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Supported</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Live ICY/AAC Stream</span></span></td>
                <td className="py-2.5 text-zinc-500">— Stream Only</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-purple-300">Audius Decentralized</td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Full HTTP Range</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>When CORS Allowed (Direct Fallback)</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Supported</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Public Direct Stream</span></span></td>
                <td className="py-2.5 text-zinc-500">— Stream Only</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-white">Curated Open Audio</td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Full</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Unlocked</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Supported</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Web Audio Stream</span></span></td>
                <td className="py-2.5 text-zinc-500">— Stream Only</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-white">YouTube Embed</td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Embed API</span></span></td>
                <td className="py-2.5 text-zinc-500">— YouTube Output</td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>Supported</span></span></td>
                <td className="py-2.5 text-emerald-400"><span className="inline-flex items-center gap-1"><AuraIcon name="check" size={12} weight={600} /><span>IFrame API Bridge</span></span></td>
                <td className="py-2.5 text-zinc-500">— Protected Media</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Privacy Seal */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/5 text-[11px] text-zinc-500">
          <AuraIcon name="shieldCheck" size={16} className="text-emerald-400" />
          <span>
            AURA respects copyright and privacy. No unauthorized audio stream extraction or third-party scraping is performed.
          </span>
        </div>
      </div>

    </div>
  );
};
