import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { 
  ArrowLeft, 
  Play, 
  Trash2, 
  Music, 
  Heart,
  LayoutGrid,
  List
} from 'lucide-react';
import { SongObjectCard } from '../common/SongObjectCard';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import { Track } from '../../types';

export const PlaylistDetailView: React.FC = () => {
  const {
    playlists,
    selectedPlaylistId,
    setCurrentView,
    tracks,
    playTrack,
    deletePlaylist,
  } = useMusic();

  const [viewMode, setViewMode] = useState<'row' | 'grid'>('row');
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);

  const playlist = playlists.find((p) => p.id === selectedPlaylistId);

  if (!playlist) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-400">Playlist not found</p>
        <button
          onClick={() => setCurrentView('playlists')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs"
        >
          Go back
        </button>
      </div>
    );
  }

  // Resolve tracks in order
  const playlistTracks = playlist.trackIds
    .map((id) => tracks.find((t) => t.id === id))
    .filter((t): t is typeof tracks[0] => t !== undefined);

  const totalDuration = playlistTracks.reduce((acc, t) => acc + t.duration, 0);

  const formatDurationTotal = (secs: number) => {
    const m = Math.floor(secs / 60);
    return `${m} min`;
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto select-none">
      
      {/* Back Button */}
      <button
        onClick={() => setCurrentView('playlists')}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors w-fit cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Playlists
      </button>

      {/* Playlist Hero Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-[#0b0d13]/70 border border-white/[0.08] backdrop-blur-2xl shadow-xl">
        <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-br ${playlist.coverGradient} shadow-2xl flex items-center justify-center text-white font-bold text-4xl shrink-0 border border-white/10 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_70%)]" />
          <span className="relative z-10">{playlist.title.charAt(0)}</span>
        </div>

        <div className="flex flex-col gap-1.5 text-center sm:text-left flex-1">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">Curated Space</span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">{playlist.title}</h1>
          {playlist.description && (
            <p className="text-xs text-zinc-400 max-w-md">{playlist.description}</p>
          )}
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            {playlistTracks.length} {playlistTracks.length === 1 ? 'track' : 'tracks'} • {formatDurationTotal(totalDuration)}
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
            {playlistTracks.length > 0 && (
              <button
                onClick={() => playTrack(playlistTracks[0], playlistTracks)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Play Space
              </button>
            )}

            <button
              onClick={() => {
                if (confirm(`Delete playlist "${playlist.title}"?`)) {
                  deletePlaylist(playlist.id);
                  setCurrentView('playlists');
                }
              }}
              className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-white/5 transition-colors cursor-pointer"
              title="Delete Playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Track List Header with View Mode */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">
          Tracks ({playlistTracks.length})
        </h2>

        {playlistTracks.length > 0 && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/80 border border-white/5">
            <button
              onClick={() => setViewMode('row')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'row' ? 'bg-indigo-600/30 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600/30 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Grid of Music Objects"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Playlist Track List */}
      {playlistTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 rounded-3xl bg-[#0b0d13]/50 border border-dashed border-white/10">
          <Music className="w-8 h-8 text-zinc-600 mb-2 stroke-1" />
          <p className="text-xs font-medium text-zinc-300">This playlist is empty</p>
          <p className="text-[11px] text-zinc-500 mt-0.5 mb-4">Add tracks from your song library using the three-dot menu</p>
          <button
            onClick={() => setCurrentView('songs')}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-xs text-zinc-300 cursor-pointer"
          >
            Browse Library
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5 sm:gap-6">
          {playlistTracks.map((track) => (
            <SongObjectCard
              key={track.id}
              track={track}
              playlistContext={playlistTracks}
              variant="grid"
              onOpenPlaylistModal={setPlaylistModalTrack}
            />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04] rounded-2xl bg-[#0b0d13]/60 border border-white/5 overflow-hidden p-2">
          {playlistTracks.map((track, i) => (
            <SongObjectCard
              key={track.id}
              track={track}
              playlistContext={playlistTracks}
              variant="row"
              showIndex={i + 1}
              onOpenPlaylistModal={setPlaylistModalTrack}
            />
          ))}
        </div>
      )}

      <AddToPlaylistModal
        track={playlistModalTrack}
        isOpen={!!playlistModalTrack}
        onClose={() => setPlaylistModalTrack(null)}
      />

    </div>
  );
};
