import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { formatSeconds } from '../../utils/formatTime';
import { 
  Bookmark, 
  Play, 
  Trash2, 
  Plus, 
  Music, 
  Clock, 
  Sparkles, 
  FileText,
  Search
} from 'lucide-react';
import { AuraMoment } from '../../types';

export const AuraMomentsPanel: React.FC = () => {
  const {
    currentTrack,
    currentTime,
    moments,
    saveMoment,
    jumpToMoment,
    deleteMoment,
  } = useMusic();

  const [noteInput, setNoteInput] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTrack) return;
    saveMoment(noteInput.trim());
    setNoteInput('');
  };

  const filteredMoments = moments.filter((m) => {
    if (!filterSearch) return true;
    const query = filterSearch.toLowerCase();
    return (
      m.note.toLowerCase().includes(query) ||
      m.trackTitle.toLowerCase().includes(query) ||
      m.artist.toLowerCase().includes(query)
    );
  });

  return (
    <div id="aura-moments-panel" className="flex flex-col gap-6 p-6 rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Aura Moments & Memory Journal</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Capture poignant musical timestamps, memorable riffs, and personal notes.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-violet-300 bg-violet-950/40 px-3 py-1 rounded-xl border border-violet-800/30 self-start sm:self-auto">
          {moments.length} Captured
        </span>
      </div>

      {/* Capture Current Time Bar */}
      <form onSubmit={handleCapture} className="flex flex-col sm:flex-row gap-2 p-3 rounded-2xl bg-zinc-950/70 border border-white/5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 flex-shrink-0">
          <Clock className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-mono font-bold text-white">{formatSeconds(currentTime)}</span>
        </div>

        <input
          type="text"
          placeholder={currentTrack ? `Add note for "${currentTrack.title}" at ${formatSeconds(currentTime)}...` : 'Select a track to capture moments'}
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          disabled={!currentTrack}
          className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!currentTrack}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          Capture Moment
        </button>
      </form>

      {/* Search & Filter */}
      {moments.length > 3 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes, tracks or artists..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-white/5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      )}

      {/* Moments List */}
      <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
        {filteredMoments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-zinc-950/30 border border-dashed border-white/10 text-center">
            <Sparkles className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-xs font-medium text-zinc-400">No Moments captured yet</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              While listening to any track, capture your favorite timestamp and write a thought!
            </p>
          </div>
        ) : (
          filteredMoments.map((moment) => {
            const isThisTrack = currentTrack?.id === moment.trackId;
            return (
              <div
                key={moment.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-950/60 border border-white/5 hover:border-violet-500/30 hover:bg-zinc-950 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => jumpToMoment(moment)}
                    className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 group-hover:bg-violet-600 group-hover:text-white flex items-center justify-center transition-all flex-shrink-0"
                    title="Jump directly to this moment"
                  >
                    <Play className="w-4 h-4 ml-0.5" />
                  </button>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{moment.trackTitle}</span>
                      <span className="text-xs font-mono font-bold text-violet-300 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/30 flex-shrink-0">
                        {formatSeconds(moment.timestamp)}
                      </span>
                    </div>

                    {moment.note ? (
                      <p className="text-xs text-zinc-300 mt-0.5 font-sans italic truncate">"{moment.note}"</p>
                    ) : (
                      <p className="text-[11px] text-zinc-500 truncate">{moment.artist}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                    {new Date(moment.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteMoment(moment.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition-colors opacity-60 group-hover:opacity-100"
                    title="Delete moment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
