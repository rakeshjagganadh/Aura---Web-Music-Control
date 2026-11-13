import React, { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { youtubeService } from '../../services/youtubeService';
import { 
  X, 
  Play, 
  ListPlus, 
  ListMusic, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  Loader2,
  Music
} from 'lucide-react';

interface YouTubePlaylistImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const YouTubePlaylistImportModal: React.FC<YouTubePlaylistImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { playYouTubePlaylist, addToQueue, showToast } = useMusic();

  const [inputUrl, setInputUrl] = useState('');
  const [extractedId, setExtractedId] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [oembedInfo, setOembedInfo] = useState<{ title: string; author: string; thumbnail: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setInputUrl('');
      setExtractedId(null);
      setOembedInfo(null);
      setErrorMsg(null);
      setIsValidating(false);
    }
  }, [isOpen]);

  // Live input validation & oEmbed metadata probe
  useEffect(() => {
    if (!inputUrl.trim()) {
      setExtractedId(null);
      setOembedInfo(null);
      setErrorMsg(null);
      setIsValidating(false);
      return;
    }

    const playlistId = youtubeService.parsePlaylistId(inputUrl);
    if (!playlistId) {
      setExtractedId(null);
      setOembedInfo(null);
      setErrorMsg('Please enter a valid YouTube or YouTube Music playlist URL or ID.');
      return;
    }

    setErrorMsg(null);
    setExtractedId(playlistId);
    setIsValidating(true);

    let isMounted = true;
    youtubeService.fetchPlaylistOEmbed(playlistId, inputUrl)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setOembedInfo(data);
        } else {
          setOembedInfo({
            title: `YouTube Playlist (${playlistId.slice(0, 12)}...)`,
            author: 'YouTube Public Playlist',
            thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
          });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setOembedInfo({
          title: `YouTube Playlist (${playlistId.slice(0, 12)}...)`,
          author: 'YouTube Public Playlist',
          thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        });
      })
      .finally(() => {
        if (isMounted) setIsValidating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [inputUrl]);

  if (!isOpen) return null;

  const handlePlayNow = async () => {
    if (!extractedId) return;
    const title = oembedInfo?.title || `YouTube Playlist (${extractedId.slice(0, 8)})`;
    const coverUrl = oembedInfo?.thumbnail;
    await playYouTubePlaylist(extractedId, title, coverUrl);
    showToast(`Playing playlist "${title}"`, 'success');
    onClose();
  };

  const handleAddToQueue = () => {
    if (!extractedId) return;
    const title = oembedInfo?.title || `YouTube Playlist (${extractedId.slice(0, 8)})`;
    const coverUrl = oembedInfo?.thumbnail;

    const playlistTrack = {
      id: `yt-playlist-${extractedId}`,
      title,
      artist: oembedInfo?.author || 'YouTube Playlist Stream',
      album: 'YouTube Playlist',
      duration: 0,
      fileFormat: 'YOUTUBE_PLAYLIST',
      fileSize: 0,
      dateAdded: Date.now(),
      coverUrl: coverUrl || `https://i.ytimg.com/vi/default/hqdefault.jpg`,
      coverColor: 'from-red-600 via-zinc-900 to-black',
      source: 'youtube' as const,
      sourceId: extractedId,
      sourceName: 'YouTube Playlist',
      sourceUrl: `https://www.youtube.com/playlist?list=${extractedId}`,
      isAvailable: true,
    };

    addToQueue(playlistTrack);
    showToast(`Added playlist "${title}" to queue`, 'info');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#090b11] border border-white/10 shadow-2xl p-6 sm:p-7 flex flex-col gap-5 aura-focus-ring overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle background ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-display">
                Import YouTube Playlist
              </h3>
              <p className="text-xs text-zinc-400 font-ui-meta mt-0.5">
                Play public YouTube & YouTube Music playlists in AURA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* URL Input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="yt-playlist-input" className="text-xs font-semibold text-zinc-300 font-ui-title">
            Playlist URL or ID
          </label>
          <div className="relative">
            <input
              id="yt-playlist-input"
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="e.g. https://www.youtube.com/playlist?list=PL... or PL..."
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-red-400/60 focus:outline-none text-xs sm:text-sm text-white placeholder-zinc-500 transition-colors"
              autoFocus
            />
            {isValidating && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-[11px] text-zinc-500 font-ui-meta mt-0.5">
            Supports YouTube URLs, YouTube Music playlist links, and standard playlist IDs. Streams legitimately via official YouTube IFrame player.
          </p>
        </div>

        {/* Preview Card */}
        {extractedId && (
          <div className="p-3.5 rounded-2xl aura-glass-ambient border border-white/10 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 relative flex items-center justify-center">
              {oembedInfo?.thumbnail ? (
                <img
                  src={oembedInfo.thumbnail}
                  alt={oembedInfo.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Music className="w-6 h-6 text-zinc-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold uppercase text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                  PLAYLIST
                </span>
                <span className="text-[11px] text-zinc-400 font-mono truncate">
                  ID: {extractedId.slice(0, 16)}...
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-white truncate mt-1">
                {oembedInfo?.title || 'YouTube Playlist Stream'}
              </h4>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-ui-meta">
                {oembedInfo?.author || 'Official Player'}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!extractedId}
            onClick={handleAddToQueue}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-40 text-zinc-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            <ListPlus className="w-3.5 h-3.5" />
            <span>Add to Queue</span>
          </button>

          <button
            type="button"
            disabled={!extractedId}
            onClick={handlePlayNow}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-zinc-100 disabled:opacity-40 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer aura-focus-ring"
          >
            <Play className="w-3.5 h-3.5 fill-current text-black translate-x-0.5" />
            <span>Play Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
