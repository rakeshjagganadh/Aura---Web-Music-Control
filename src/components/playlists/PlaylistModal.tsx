import React, { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Playlist } from '../../types';
import { X, ListPlus, Edit3, Sparkles } from 'lucide-react';

const GRADIENT_CHOICES = [
  'from-indigo-600 to-purple-800',
  'from-violet-600 to-indigo-900',
  'from-cyan-600 to-blue-800',
  'from-emerald-600 to-teal-800',
  'from-rose-600 to-pink-800',
  'from-amber-600 to-orange-800',
  'from-blue-600 to-slate-900',
];

interface PlaylistModalProps {
  playlistToEdit?: Playlist | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  playlistToEdit,
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const {
    isPlaylistModalOpen,
    setIsPlaylistModalOpen,
    createPlaylist,
    updatePlaylist,
    setCurrentView,
    setSelectedPlaylistId,
  } = useMusic();

  const isEditing = !!playlistToEdit;
  const modalOpen = propIsOpen !== undefined ? propIsOpen : isPlaylistModalOpen;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_CHOICES[0]);

  // Sync form values when playlistToEdit changes or modal opens
  useEffect(() => {
    if (playlistToEdit) {
      setTitle(playlistToEdit.title || '');
      setDescription(playlistToEdit.description || '');
      setSelectedGradient(playlistToEdit.coverGradient || GRADIENT_CHOICES[0]);
    } else {
      setTitle('');
      setDescription('');
      setSelectedGradient(GRADIENT_CHOICES[0]);
    }
  }, [playlistToEdit, modalOpen]);

  if (!modalOpen) return null;

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setIsPlaylistModalOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && playlistToEdit) {
      // Update existing playlist in place without changing ID or tracks
      const updatedPlaylist: Playlist = {
        ...playlistToEdit,
        title: title.trim(),
        description: description.trim(),
        coverGradient: selectedGradient,
        updatedAt: Date.now(),
      };
      await updatePlaylist(updatedPlaylist);
      handleClose();
    } else {
      // Create new playlist
      const newPl = await createPlaylist(title.trim(), description.trim(), selectedGradient);
      setTitle('');
      setDescription('');
      handleClose();
      setSelectedPlaylistId(newPl.id);
      setCurrentView('playlist-detail');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0e1017] border border-white/10 shadow-2xl p-6 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <ListPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                {isEditing ? 'Edit Space & Playlist' : 'Create Space & Playlist'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isEditing ? 'Update space details and theme gradient' : 'Curate and group your music'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
              <span className="text-xs text-zinc-400 font-medium">Choose Theme Artwork</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {GRADIENT_CHOICES.map((grad) => (
                  <button
                    key={grad}
                    type="button"
                    aria-label={`Select gradient ${grad}`}
                    onClick={() => setSelectedGradient(grad)}
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${grad} border-2 transition-transform cursor-pointer ${
                      selectedGradient === grad ? 'border-white scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                    }`}
                  ></button>
                ))}
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-300">Space / Playlist Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Late Night Beats, Morning Focus"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
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
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Quick Description Suggestions (Presentation-only) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-zinc-500">Quick Themes:</span>
            {['Deep Focus & Work', 'Late Night Unwind', 'Spatial Audio Test', 'Energetic Workout'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setDescription(tag)}
                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                + {tag}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              {isEditing ? 'Save Changes' : 'Create Space'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
