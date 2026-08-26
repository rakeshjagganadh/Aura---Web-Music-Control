import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { ListMusic, Plus, Play, Trash2, Disc } from 'lucide-react';

export const PlaylistsView: React.FC = () => {
  const {
    playlists,
    setSelectedPlaylistId,
    setCurrentView,
    setIsPlaylistModalOpen,
    deletePlaylist,
  } = useMusic();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto select-none">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Playlists & Spaces</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {playlists.length} {playlists.length === 1 ? 'curated space' : 'curated spaces'}
          </p>
        </div>

        <button
          onClick={() => setIsPlaylistModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Space
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-16 rounded-3xl bg-[#0b0d13]/60 border border-dashed border-white/10">
          <ListMusic className="w-10 h-10 text-zinc-600 mb-3 stroke-1" />
          <h3 className="text-base font-semibold text-zinc-300">No playlists created yet</h3>
          <p className="text-xs text-zinc-500 max-w-xs mt-1 mb-5">
            Group your songs into acoustic sets for focus, energy, evening unwind, or spatial tests.
          </p>
          <button
            onClick={() => setIsPlaylistModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Space
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => {
                setSelectedPlaylistId(pl.id);
                setCurrentView('playlist-detail');
              }}
              className="group relative cursor-pointer flex flex-col gap-3 p-3 rounded-2xl bg-[#0b0d13]/60 hover:bg-[#12151f] border border-white/5 hover:border-white/10 transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02]"
            >
              <div className={`relative w-full aspect-square rounded-xl bg-gradient-to-br ${pl.coverGradient} shadow-md flex items-center justify-center text-white font-bold text-2xl overflow-hidden`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_70%)]" />
                <span className="opacity-90 group-hover:scale-110 transition-transform duration-300">{pl.title.charAt(0)}</span>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                  <Play className="w-7 h-7 text-white fill-current" />
                </div>
              </div>

              <div className="flex items-center justify-between px-0.5">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                    {pl.title}
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                    {pl.trackIds.length} {pl.trackIds.length === 1 ? 'track' : 'tracks'}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete playlist "${pl.title}"?`)) {
                      deletePlaylist(pl.id);
                    }
                  }}
                  className="p-1.5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-all"
                  title="Delete space"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
