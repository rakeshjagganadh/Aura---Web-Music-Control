import React, { useState } from 'react';
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

export const SourcesView: React.FC = () => {
  const {
    tracks,
    storageUsage,
    setIsUploadModalOpen,
    playTrack,
    currentTrack,
    showToast,
  } = useMusic();

  const [streamUrlInput, setStreamUrlInput] = useState('');
  const [streamTitleInput, setStreamTitleInput] = useState('');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [showAddStream, setShowAddStream] = useState(false);
  const [showAddYoutube, setShowAddYoutube] = useState(false);
  const [isLoadingAudiusTrending, setIsLoadingAudiusTrending] = useState(false);
  const [isLoadingJamendo, setIsLoadingJamendo] = useState(false);
  const [isLoadingRadio, setIsLoadingRadio] = useState(false);
  const [providerHealth, setProviderHealth] = useState<Record<string, boolean>>({});

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

  const handlePlayRadioTop = async () => {
    try {
      setIsLoadingRadio(true);
      const stations = await radioBrowserProvider.getFeaturedStations({ limit: 10 });
      if (stations.length > 0) {
        const auraTracks = stations.map((s) => radioStationToAuraTrack(s));
        await playTrack(auraTracks[0], auraTracks);
        showToast(`Connecting to live stream: "${auraTracks[0].title}"`, 'success');
      } else {
        showToast('Could not load radio stations.', 'warning');
      }
    } catch {
      showToast('Failed to reach Radio Browser servers.', 'error');
    } finally {
      setIsLoadingRadio(false);
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
    <div className="flex flex-col gap-8 p-4 sm:p-8 max-w-6xl mx-auto select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Music Sources & Connections</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                UNIVERSAL AUDIO
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Connect where your music lives. AURA serves as your universal listening and sound customization layer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Music / Source</span>
          </button>
        </div>
      </div>

      {/* Primary Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Source 1: Local Audio Files */}
        <div className="p-6 rounded-3xl bg-[#0c0e15]/70 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Local Device Library</h3>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Connected & Active
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                FULL DSP
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
              onClick={() => setIsUploadModalOpen(true)}
              className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-white/10 transition-colors"
            >
              Import Files / Folders
            </button>
          </div>
        </div>

        {/* Source 2: Curated Open Sound Catalog */}
        <div className="p-6 rounded-3xl bg-[#0c0e15]/70 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AURA Open Sound Catalog</h3>
                  <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Built-in Streams
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                LOSSLESS DSP
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
              onClick={() => playTrack(CURATED_DISCOVERY_TRACKS[0], CURATED_DISCOVERY_TRACKS)}
              className="flex-1 py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Listen to Curated Stream
            </button>
          </div>
        </div>

        {/* Source 3: Audius Music Network */}
        <div className="p-6 rounded-3xl bg-[#0c0e15]/70 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Audius Decentralized Catalog</h3>
                  <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Public Web Streaming
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                FULL DSP & EQ
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
              onClick={handlePlayAudiusTrending}
              disabled={isLoadingAudiusTrending}
              className="flex-1 py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoadingAudiusTrending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading Audius Trending...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Trending Audius Tracks</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Source: Jamendo Music Catalog */}
        <div className="p-6 rounded-3xl bg-[#0c0e15]/70 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Jamendo Music Catalog</h3>
                  <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Creative Commons API
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                OPEN CORS DSP
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
              onClick={handlePlayJamendoTrending}
              disabled={isLoadingJamendo}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoadingJamendo ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading Jamendo Tracks...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Trending Jamendo Tracks</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Source: Radio Browser Global Directory */}
        <div className="p-6 rounded-3xl bg-[#0c0e15]/70 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Radio Browser Directory</h3>
                  <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Live Internet Radio
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                LIVE DSP
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Global community directory with 30,000+ live internet radio stations. Filter by country, genre, and codec with real-time spectrum analysis.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-2 border-t border-white/5">
              <span>30,000+ Global Stations</span>
              <span>•</span>
              <span>Open Community API</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayRadioTop}
              disabled={isLoadingRadio}
              className="flex-1 py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoadingRadio ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading Stations...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Top Global Radio</span>
                </>
              )}
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

          {showAddYoutube ? (
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
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
              >
                Play
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddYoutube(true)}
              className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-white/10 transition-colors"
            >
              + Open YouTube Link
            </button>
          )}
        </div>

      </div>

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
