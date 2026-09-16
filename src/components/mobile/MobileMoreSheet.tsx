import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { NavView } from '../../types';
import { 
  X, 
  Disc, 
  User, 
  Heart, 
  SlidersHorizontal, 
  Settings, 
  Keyboard, 
  Sparkles, 
  UploadCloud, 
  HardDrive,
  ChevronRight,
  Users
} from 'lucide-react';
import { useListenTogether } from '../../context/ListenTogetherContext';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({ isOpen, onClose }) => {
  const {
    setCurrentView,
    setSelectedPlaylistId,
    favoriteIds,
    tracks,
    storageUsage,
    setIsUploadModalOpen,
    setIsShortcutsModalOpen,
    loadDemoPack,
  } = useMusic();

  const { isInRoom, participants } = useListenTogether();

  if (!isOpen) return null;

  const navigateTo = (view: NavView) => {
    setSelectedPlaylistId(null);
    setCurrentView(view);
    onClose();
  };

  const formatStorageMB = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const navItems = [
    { id: 'listen-together' as NavView, label: 'Listen Together', icon: Users, badge: isInRoom ? participants.length : undefined, desc: 'Shared rooms & synchronized music' },
    { id: 'albums' as NavView, label: 'Albums Collection', icon: Disc, desc: 'Group by album releases' },
    { id: 'artists' as NavView, label: 'Artists Directory', icon: User, desc: 'Browse by song performers' },
    { id: 'favorites' as NavView, label: 'Favorites', icon: Heart, badge: favoriteIds.size, desc: 'Starred & liked tracks' },
    { id: 'studio' as NavView, label: 'Full Audio Studio View', icon: SlidersHorizontal, desc: 'Advanced waveform & visualizer' },
    { id: 'settings' as NavView, label: 'Settings & Storage', icon: Settings, desc: 'DSP engine & data management' },
  ];

  return (
    <div
      id="mobile-more-sheet"
      className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end select-none animate-in fade-in duration-200"
    >
      {/* Backdrop tap */}
      <div className="flex-1" onClick={onClose} />

      {/* Sheet Container */}
      <div className="relative w-full max-h-[85vh] bg-[#0c0d12] border-t border-white/15 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden pb-safe animate-in slide-in-from-bottom duration-300">
        
        {/* Handle */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto mt-3 mb-1 shrink-0" />

        {/* Header */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">More Destinations</h3>
            <p className="text-xs text-zinc-400">Library categories & studio utilities</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white active:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          
          {/* Main Destinations */}
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 active:bg-zinc-800 border border-white/5 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/25">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </button>
            );
          })}

          {/* Quick Action Tiles */}
          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/5">
            
            {/* Upload Music */}
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsUploadModalOpen(true);
              }}
              className="flex flex-col gap-2 p-3.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-left transition-colors cursor-pointer"
            >
              <UploadCloud className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-white block">Add Music</span>
                <span className="text-[10px] text-indigo-300">Import audio files</span>
              </div>
            </button>

            {/* Demo Music */}
            <button
              type="button"
              onClick={() => {
                onClose();
                loadDemoPack();
              }}
              className="flex flex-col gap-2 p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-left transition-colors cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-white block">Demo Pack</span>
                <span className="text-[10px] text-zinc-400">Load sample tracks</span>
              </div>
            </button>

          </div>

          {/* Storage & Shortcuts row */}
          <div className="flex items-center justify-between pt-3 px-1 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5 font-mono">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Storage: {formatStorageMB(storageUsage.approxBytes)}</span>
            </div>
            
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsShortcutsModalOpen(true);
              }}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
