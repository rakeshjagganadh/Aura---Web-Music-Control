import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { X, ListPlus, Sparkles } from 'lucide-react';

const GRADIENT_CHOICES = [
  'from-indigo-600 to-purple-800',
  'from-violet-600 to-indigo-900',
  'from-cyan-600 to-blue-800',
  'from-emerald-600 to-teal-800',
  'from-rose-600 to-pink-800',
  'from-amber-600 to-orange-800',
  'from-blue-600 to-slate-900',
];

export const PlaylistModal: React.FC = () => {
  const {
    isPlaylistModalOpen,
    setIsPlaylistModalOpen,
    createPlaylist,
    setCurrentView,
    setSelectedPlaylistId,
  } = useMusic();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_CHOICES[0]);

  if (!isPlaylistModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPl = await createPlaylist(title.trim(), description.trim(), selectedGradient);
    setTitle('');
    setDescription('');
    setIsPlaylistModalOpen(false);
    setSelectedPlaylistId(newPl.id);
    setCurrentView('playlist-detail');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl p-6 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Create Playlist</h3>
              <p className="text-xs text-zinc-400">Curate and group your music</p>
            </div>
          </div>

          <button
            onClick={() => setIsPlaylistModalOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Cover Preview & Gradient Picker */}
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${selectedGradient} flex items-center justify-center shrink-0 border border-white/10 shadow-lg text-white font-bold text-lg`}>
              {title ? title.charAt(0).toUpperCase() : 'PL'}
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <span className="text-xs text-zinc-400">Choose Theme Artwork</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {GRADIENT_CHOICES.map((grad) => (
                  <button
                    key={grad}
                    type="button"
                    onClick={() => setSelectedGradient(grad)}
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${grad} border-2 transition-transform ${
                      selectedGradient === grad ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-300">Playlist Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Late Night Beats, Morning Focus"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-300">Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Ambient electronic tracks for deep work"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPlaylistModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-colors shadow-md shadow-indigo-600/20"
            >
              Create Playlist
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
