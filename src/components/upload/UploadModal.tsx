import React, { useRef, useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { 
  X, 
  UploadCloud, 
  Music, 
  Sparkles, 
  HardDrive, 
  FileAudio,
  FolderPlus,
  Radio,
  Youtube,
  Link,
  Plus
} from 'lucide-react';
import { createWebStreamTrack } from '../../services/discoveryService';
import { youtubeService } from '../../services/youtubeService';

type AddMusicTab = 'files' | 'folder' | 'stream' | 'youtube' | 'demo';

export const UploadModal: React.FC = () => {
  const {
    isUploadModalOpen,
    setIsUploadModalOpen,
    uploadFiles,
    loadDemoPack,
    playTrack,
    showToast,
  } = useMusic();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<AddMusicTab>('files');
  const [isProcessing, setIsProcessing] = useState(false);

  // Stream Form State
  const [streamUrl, setStreamUrl] = useState('');
  const [streamName, setStreamName] = useState('');

  // YouTube Form State
  const [youtubeQuery, setYoutubeQuery] = useState('');

  if (!isUploadModalOpen) return null;

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessing(true);
      await uploadFiles(e.target.files);
      setIsProcessing(false);
      setIsUploadModalOpen(false);
    }
  };

  const handleLoadDemo = async () => {
    setIsProcessing(true);
    await loadDemoPack();
    setIsProcessing(false);
    setIsUploadModalOpen(false);
  };

  const handleAddStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim()) return;
    const track = createWebStreamTrack(streamUrl.trim(), streamName.trim() || 'Online Audio Stream');
    playTrack(track);
    setIsUploadModalOpen(false);
    showToast('Stream loaded into player', 'success');
  };

  const handleAddYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = youtubeQuery.trim();
    if (!q) return;

    const videoId = youtubeService.parseVideoId(q);
    if (!videoId) {
      showToast('Please enter a valid YouTube URL or 11-character video ID.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const oembed = await youtubeService.fetchOEmbed(videoId);
      const ytTrack = youtubeService.createTrack(
        videoId,
        oembed?.title || `YouTube Audio (${videoId})`,
        oembed?.author_name || 'YouTube Channel',
        oembed?.thumbnail_url
      );
      playTrack(ytTrack);
      setIsUploadModalOpen(false);
      setYoutubeQuery('');
      showToast(`Loaded "${ytTrack.title}"`, 'success');
    } catch {
      const fallbackTrack = youtubeService.createTrack(videoId);
      playTrack(fallbackTrack);
      setIsUploadModalOpen(false);
      setYoutubeQuery('');
      showToast('YouTube track loaded', 'success');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0c0e15] border border-white/10 shadow-2xl p-6 flex flex-col gap-6 select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Music to AURA</h3>
              <p className="text-xs text-zinc-400">Import local library files, online streams, or web sources</p>
            </div>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-2xl border border-white/5 text-xs overflow-x-auto scrollbar-none">
          {[
            { id: 'files', label: 'Import Files', icon: FileAudio },
            { id: 'folder', label: 'Import Folder', icon: FolderPlus },
            { id: 'stream', label: 'Web Stream', icon: Radio },
            { id: 'youtube', label: 'YouTube', icon: Youtube },
            { id: 'demo', label: 'Demo Pack', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AddMusicTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Files */}
        {activeTab === 'files' && (
          <div className="flex flex-col gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group relative cursor-pointer flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-indigo-500/60 bg-zinc-900/30 hover:bg-indigo-950/10 transition-all text-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus"
                onChange={handleFilesSelected}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-zinc-800 group-hover:bg-indigo-600/30 group-hover:text-indigo-300 text-zinc-400 flex items-center justify-center mb-3 transition-colors">
                <FileAudio className="w-6 h-6" />
              </div>

              <p className="text-sm font-semibold text-zinc-200 group-hover:text-indigo-300 transition-colors">
                {isProcessing ? 'Processing audio metadata & waveforms...' : 'Click to browse or drag audio files'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Supports MP3, WAV, FLAC, M4A, AAC, and OGG
              </p>

              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
                {['MP3', 'WAV', 'FLAC', 'M4A', 'AAC', 'OGG'].map((fmt) => (
                  <span key={fmt} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 border border-white/5">
                    {fmt}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-900/50 border border-white/5 text-xs text-zinc-400">
              <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-zinc-300 font-medium">Local-first privacy:</strong> Files are stored locally in your browser (IndexedDB) and never uploaded to any remote server.
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Folder */}
        {activeTab === 'folder' && (
          <div className="flex flex-col gap-4">
            <div
              onClick={() => folderInputRef.current?.click()}
              className="group relative cursor-pointer flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-indigo-500/60 bg-zinc-900/30 hover:bg-indigo-950/10 transition-all text-center"
            >
              <input
                ref={folderInputRef}
                type="file"
                multiple
                // @ts-ignore
                webkitdirectory="true"
                directory="true"
                onChange={handleFilesSelected}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-zinc-800 group-hover:bg-indigo-600/30 group-hover:text-indigo-300 text-zinc-400 flex items-center justify-center mb-3 transition-colors">
                <FolderPlus className="w-6 h-6" />
              </div>

              <p className="text-sm font-semibold text-zinc-200 group-hover:text-indigo-300 transition-colors">
                Select a Music Folder to Import
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                AURA will scan all nested subdirectories for audio tracks
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Web Stream */}
        {activeTab === 'stream' && (
          <form onSubmit={handleAddStream} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">Stream Name / Title</label>
              <input
                type="text"
                value={streamName}
                onChange={(e) => setStreamName(e.target.value)}
                placeholder="e.g. SomaFM Drone Zone or Ambient Beats"
                className="p-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">Audio Stream URL (HTTP/HTTPS)</label>
              <input
                type="url"
                required
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://example.com/live-stream.mp3"
                className="p-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-colors cursor-pointer"
            >
              Add and Stream Now
            </button>
          </form>
        )}

        {/* Tab 4: YouTube */}
        {activeTab === 'youtube' && (
          <form onSubmit={handleAddYouTube} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">YouTube URL or Video ID</label>
              <input
                type="text"
                required
                value={youtubeQuery}
                onChange={(e) => setYoutubeQuery(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or Video ID"
                className="p-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              Plays via the official embedded YouTube player synced with AURA&apos;s universal player interface.
            </p>
            <button
              type="submit"
              className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-500/20 transition-colors cursor-pointer"
            >
              Load YouTube Embed
            </button>
          </form>
        )}

        {/* Tab 5: Demo Pack */}
        {activeTab === 'demo' && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Load Studio Demo Collection</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Generates high-resolution multi-track synthesizers, binaural ambient drones, and dynamic basslines to test EQ, 3D spatial acoustics, and looping.
              </p>
            </div>
            <button
              onClick={handleLoadDemo}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {isProcessing ? 'Generating studio audio...' : 'Generate Demo Pack'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
