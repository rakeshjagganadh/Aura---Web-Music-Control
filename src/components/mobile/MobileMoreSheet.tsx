import React from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionBackdrop, MotionModal } from '../common/motion/MotionSurface';
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
  Users,
  Download
} from 'lucide-react';
import { useListenTogether } from '../../context/ListenTogetherContext';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  canInstall?: boolean;
  isInstalled?: boolean;
  onInstall?: () => void;
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({ 
  isOpen, 
  onClose,
  canInstall = false,
  isInstalled = false,
  onInstall
}) => {
  const {
    setCurrentView,
    setSelectedPlaylistId,
    favoriteIds,
    storageUsage,
    setIsUploadModalOpen,
    setIsShortcutsModalOpen,
    loadDemoPack,
  } = useMusic();

  const { isInRoom, participants } = useListenTogether();

  const navigateTo = (view: NavView) => {
    setSelectedPlaylistId(null);
    setCurrentView(view);
    onClose();
  };

  const formatStorageMB = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <MotionBackdrop
          id="mobile-more-sheet"
          aria-label="More Destinations Sheet"
          onClick={onClose}
          style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
          className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end select-none"
        >
          {/* Sheet Modal Container */}
          <MotionModal
            variant="bottom-sheet"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-h-[85vh] bg-[#080a10] border-t border-white/[0.1] rounded-t-[28px] shadow-[0_-20px_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden pb-safe"
          >
        
        {/* Tactile Sheet Handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-3 mb-1 shrink-0" />

        {/* Sheet Header */}
        <div className="px-5 py-3 border-b border-white/[0.07] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight font-display">
              AURA Destinations
            </h3>
            <p className="text-xs text-zinc-400 font-ui-meta mt-0.5">
              Vault collections, shared rooms & studio tools
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white active:bg-white/[0.06] rounded-xl transition-colors cursor-pointer aura-focus-ring aura-pressable"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          
          {/* SECTION 1: EXPERIENCES & SOUND */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-medium px-1">
              EXPERIENCES & DSP
            </span>

            {/* Listen Together */}
            <button
              type="button"
              onClick={() => navigateTo('listen-together')}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.08] border border-white/[0.06] transition-colors text-left cursor-pointer group aura-focus-ring aura-pressable-subtle"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-300 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white font-ui-title">Listen Together</span>
                    {isInRoom && (
                      <span className="text-[10px] font-mono text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{participants.length} online</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 font-ui-meta truncate">
                    Synchronized rooms & collective music listening
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
            </button>

            {/* Audio Studio & DSP */}
            <button
              type="button"
              onClick={() => navigateTo('studio')}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.08] border border-white/[0.06] transition-colors text-left cursor-pointer group aura-focus-ring aura-pressable-subtle"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-300 group-hover:text-white transition-colors">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white font-ui-title">Audio Studio & DSP</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5 font-ui-meta truncate">
                    10-band equalizer, 3D Spatializer & audio canvas
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
            </button>
          </div>

          {/* SECTION 2: VAULT COLLECTIONS */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-medium px-1">
              MUSIC VAULT
            </span>

            {/* Albums */}
            <button
              type="button"
              onClick={() => navigateTo('albums')}
              className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] active:bg-white/[0.07] border border-white/[0.05] transition-colors text-left cursor-pointer group aura-focus-ring aura-pressable-subtle"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Disc className="w-4.5 h-4.5 text-zinc-400 group-hover:text-zinc-200 shrink-0 ml-1" />
                <div className="min-w-0">
                  <span className="text-xs font-medium text-zinc-200 font-ui-body">Albums Collection</span>
                  <p className="text-[11px] text-zinc-500 font-ui-meta truncate">Browse LP & EP release packages</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
            </button>

            {/* Artists */}
            <button
              type="button"
              onClick={() => navigateTo('artists')}
              className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] active:bg-white/[0.07] border border-white/[0.05] transition-colors text-left cursor-pointer group aura-focus-ring aura-pressable-subtle"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <User className="w-4.5 h-4.5 text-zinc-400 group-hover:text-zinc-200 shrink-0 ml-1" />
                <div className="min-w-0">
                  <span className="text-xs font-medium text-zinc-200 font-ui-body">Artists Directory</span>
                  <p className="text-[11px] text-zinc-500 font-ui-meta truncate">Explore track performers & creators</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
            </button>

            {/* Liked Songs */}
            <button
              type="button"
              onClick={() => navigateTo('favorites')}
              className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] active:bg-white/[0.07] border border-white/[0.05] transition-colors text-left cursor-pointer group aura-focus-ring aura-pressable-subtle"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Heart className="w-4.5 h-4.5 text-rose-400 shrink-0 ml-1" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-200 font-ui-body">Liked Songs</span>
                    {favoriteIds.size > 0 && (
                      <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                        · {favoriteIds.size} {favoriteIds.size === 1 ? 'track' : 'tracks'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 font-ui-meta truncate">Your starred listening favorites</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
            </button>
          </div>

          {/* SECTION 3: QUICK ACTIONS */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Import Audio */}
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsUploadModalOpen(true);
              }}
              className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.08] border border-white/[0.07] text-left transition-colors cursor-pointer group aura-focus-ring aura-pressable-subtle"
            >
              <UploadCloud className="w-5 h-5 text-zinc-300 group-hover:text-white" />
              <div>
                <span className="text-xs font-semibold text-white block font-ui-title">Import Music</span>
                <span className="text-[11px] text-zinc-400 font-ui-meta">Add audio files</span>
              </div>
            </button>

            {/* Demo Music */}
            <button
              type="button"
              onClick={() => {
                onClose();
                loadDemoPack();
              }}
              className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.08] border border-white/[0.07] text-left transition-colors cursor-pointer group aura-focus-ring aura-pressable-subtle"
            >
              <Sparkles className="w-5 h-5 text-zinc-300 group-hover:text-white" />
              <div>
                <span className="text-xs font-semibold text-white block font-ui-title">Sample Pack</span>
                <span className="text-[11px] text-zinc-400 font-ui-meta">Load demo music</span>
              </div>
            </button>
          </div>

          {/* PWA Install Tile if available */}
          {canInstall && !isInstalled && onInstall && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onInstall();
              }}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/30 to-zinc-900 border border-sky-500/25 text-left transition-colors cursor-pointer aura-focus-ring aura-pressable-subtle"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4 text-sky-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white font-ui-title">Install AURA App</span>
                    <span className="text-[9px] font-mono text-sky-400 font-bold uppercase">PWA</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5 font-ui-meta">
                    Add to home screen for full offline capability
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
            </button>
          )}

          {/* SECTION 4: SYSTEM & PREFERENCES */}
          <div className="pt-2 border-t border-white/[0.07] flex flex-col gap-2">
            
            {/* Settings Navigation */}
            <button
              type="button"
              onClick={() => navigateTo('settings')}
              className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-colors text-left cursor-pointer group aura-focus-ring aura-pressable-subtle"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-zinc-400 group-hover:text-white shrink-0 ml-1" />
                <span className="text-xs font-medium text-zinc-300 font-ui-body">Preferences & System Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
            </button>

            {/* Telemetry and Shortcuts Row */}
            <div className="flex items-center justify-between px-2 pt-1 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                <span>Vault: {formatStorageMB(storageUsage.approxBytes)}</span>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setIsShortcutsModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs aura-pressable"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span className="font-ui-body">Shortcuts</span>
              </button>
            </div>

          </div>

        </div>

          </MotionModal>
        </MotionBackdrop>
      )}
    </AnimatePresence>
  );
};
