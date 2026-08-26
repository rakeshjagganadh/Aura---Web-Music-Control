import React, { useRef, useEffect, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { 
  Search, 
  X, 
  Play, 
  Music, 
  ChevronUp, 
  ChevronDown, 
  History,
  Sparkles
} from 'lucide-react';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HighlightText: React.FC<{ text: string; query: string; className?: string }> = ({ text, query, className = '' }) => {
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="bg-indigo-500/30 text-indigo-200 px-0.5 rounded font-bold">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

export const MobileSearchModal: React.FC<MobileSearchModalProps> = ({ isOpen, onClose }) => {
  const {
    searchQuery,
    setSearchQuery,
    activeSearchIndex,
    nextSearchResult,
    prevSearchResult,
    tracks,
    playTrack,
    currentTrack,
    isPlaying,
  } = useMusic();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const matchingTracks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.fileFormat.toLowerCase().includes(q)
    );
  }, [searchQuery, tracks]);

  if (!isOpen) return null;

  const handleSelectTrack = (track: Track) => {
    playTrack(track, matchingTracks.length > 0 ? matchingTracks : tracks);
    onClose();
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id="mobile-search-modal"
      className="lg:hidden fixed inset-0 z-50 bg-[#090a0e]/98 backdrop-blur-3xl text-zinc-100 flex flex-col pt-safe pb-safe select-none animate-in fade-in duration-200"
    >
      {/* Top Search Input Bar */}
      <div className="p-3 sm:p-4 border-b border-white/10 flex items-center gap-2.5">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search songs, artists, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 focus:border-indigo-500/50 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white active:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Navigation Toolbar when Searching */}
      {searchQuery && (
        <div className="px-4 py-2 bg-zinc-900/60 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-400">
            {matchingTracks.length > 0
              ? `Match ${Math.min(activeSearchIndex + 1, matchingTracks.length)} of ${matchingTracks.length}`
              : 'No matches found'}
          </span>

          {matchingTracks.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevSearchResult}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                onClick={nextSearchResult}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Next</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {searchQuery ? (
          matchingTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
              <Music className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">No results for "{searchQuery}"</p>
              <p className="text-xs mt-1">Try another title, artist, or album</p>
            </div>
          ) : (
            matchingTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isActiveMatch = idx === activeSearchIndex;

              return (
                <div
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isActiveMatch
                      ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/40 shadow-md'
                      : isCurrent
                      ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-300'
                      : 'bg-zinc-900/40 border-white/5 hover:bg-zinc-900/80 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
                      {track.coverUrl ? (
                        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center`}>
                          <Music className="w-4 h-4 text-white/80" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">
                        <HighlightText text={track.title} query={searchQuery} />
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        <HighlightText text={track.artist} query={searchQuery} />
                        {track.album && <span> • <HighlightText text={track.album} query={searchQuery} /></span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {formatTime(track.duration)}
                    </span>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* Empty Search Suggestions */
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Quick Suggestions
            </span>
            <div className="flex flex-wrap gap-2">
              {['Electronic', 'Ambient', 'Synthwave', 'Acoustic', 'Rock', 'Cyberpunk', 'Classical'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setSearchQuery(term)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-xs text-zinc-300 transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>

            {tracks.length > 0 && (
              <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  Recent Tracks in Library
                </span>
                {tracks.slice(0, 5).map((track) => (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-900/60 transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
                      {track.coverUrl ? (
                        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center text-white`}>
                          <Music className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-semibold text-zinc-200 truncate">{track.title}</h5>
                      <p className="text-[11px] text-zinc-500 truncate">{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
