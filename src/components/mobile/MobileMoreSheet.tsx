import React from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionBackdrop, MotionModal } from '../common/motion/MotionSurface';
import { useMusic } from '../../context/MusicContext';
import { useMotionCapabilities } from '../../motion/useMotionCapabilities';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import { NavView } from '../../types';
import { AuraIcon } from '../ui/AuraIcon';
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
    setIsSleepTimerModalOpen,
    loadDemoPack,
  } = useMusic();

  const { isInRoom, participants } = useListenTogether();
  const { prefersReducedMotion } = useMotionCapabilities();
  const sheetRef = useDialogAccessibility<HTMLDivElement>({ isOpen, onClose });

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
            ref={sheetRef}
            variant="bottom-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="AURA Destinations"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-h-[86dvh] bg-[#080a10] border-t border-white/[0.1] rounded-t-[28px] shadow-[0_-20px_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
          >
            {/* Tactile Sheet Handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-2.5 mb-1 shrink-0" />

            {/* Sheet Header */}
            <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight font-display">
                  Explore AURA
                </h3>
                <p className="text-[11px] text-zinc-400 font-ui-meta">
                  Rooms, radio, studio tools & library collections
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 -mr-1 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white active:bg-white/[0.06] transition-colors cursor-pointer aura-focus-ring aura-pressable"
                aria-label="Close sheet"
              >
                <AuraIcon name="close" size={20} />
              </button>
            </div>

            {/* Sheet Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] flex flex-col gap-3.5 custom-scrollbar">
              {/* SECTION 1: FEATURED & EXPERIENCES */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-medium px-0.5">
                  Rooms & Live Sound
                </span>

                {/* Listen Together Highlight Card */}
                <button
                  type="button"
                  onClick={() => navigateTo('listen-together')}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.10] transition-colors text-left cursor-pointer group aura-focus-ring aura-pressable-subtle min-h-[60px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/12 border border-indigo-400/20 flex items-center justify-center shrink-0 text-indigo-300">
                      <AuraIcon name="users" size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-white font-ui-title">Listen Together</span>
                        {isInRoom && (
                          <span className="text-[10px] font-mono tabular-nums text-emerald-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{participants.length} online</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 font-ui-meta truncate">
                        Sync playback, shared queue & room chat
                      </p>
                    </div>
                  </div>
                  <AuraIcon name="chevronRight" size={16} className="text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                </button>

                {/* Two-Col Core Tools */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => navigateTo('sources')}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] text-left transition-colors cursor-pointer min-h-[52px] aura-focus-ring aura-pressable-subtle"
                  >
                    <AuraIcon name="radio" size={18} className="text-sky-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-white block truncate font-ui-title">Live Radio</span>
                      <span className="text-[10px] text-zinc-400 block truncate">Open catalogs</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('studio')}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] text-left transition-colors cursor-pointer min-h-[52px] aura-focus-ring aura-pressable-subtle"
                  >
                    <AuraIcon name="sliders" size={18} className="text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-white block truncate font-ui-title">Full Studio</span>
                      <span className="text-[10px] text-zinc-400 block truncate">EQ, Analyzer & Trim</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* SECTION 2: LIBRARY COLLECTIONS GRID */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-medium px-0.5">
                  Library & Lab
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => navigateTo('playlists')}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-colors cursor-pointer min-h-[48px] aura-focus-ring aura-pressable-subtle"
                  >
                    <AuraIcon name="queue" size={17} className="text-zinc-300 shrink-0" />
                    <span className="text-xs font-medium text-zinc-100 truncate font-ui-body">Spaces</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('favorites')}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-colors cursor-pointer min-h-[48px] aura-focus-ring aura-pressable-subtle"
                  >
                    <AuraIcon name="heart" size={17} className="text-rose-400 shrink-0" />
                    <div className="min-w-0 flex items-baseline gap-1.5 truncate">
                      <span className="text-xs font-medium text-zinc-100 truncate font-ui-body">Liked</span>
                      {favoriteIds.size > 0 && (
                        <span className="text-[10px] font-mono text-zinc-400 tabular-nums shrink-0">{favoriteIds.size}</span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('albums')}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-colors cursor-pointer min-h-[48px] aura-focus-ring aura-pressable-subtle"
                  >
                    <AuraIcon name="disc" size={17} className="text-zinc-300 shrink-0" />
                    <span className="text-xs font-medium text-zinc-100 truncate font-ui-body">Albums</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('artists')}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-colors cursor-pointer min-h-[48px] aura-focus-ring aura-pressable-subtle"
                  >
                    <AuraIcon name="user" size={17} className="text-zinc-300 shrink-0" />
                    <span className="text-xs font-medium text-zinc-100 truncate font-ui-body">Artists</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('moments')}
                    className="col-span-2 flex items-center justify-between p-3 rounded-2xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-colors cursor-pointer min-h-[46px] aura-focus-ring aura-pressable-subtle"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AuraIcon name="bookmark" size={17} className="text-amber-300 shrink-0" />
                      <span className="text-xs font-medium text-zinc-100 truncate font-ui-body">Aura Moments & Bookmarks</span>
                    </div>
                    <AuraIcon name="chevronRight" size={16} className="text-zinc-600 shrink-0" />
                  </button>
                </div>
              </div>

              {/* SECTION 3: QUICK ACTIONS */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setIsUploadModalOpen(true);
                  }}
                  className="flex flex-col items-start gap-1.5 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] text-left transition-colors cursor-pointer min-h-[64px] aura-focus-ring aura-pressable-subtle"
                >
                  <AuraIcon name="uploadCloud" size={18} className="text-zinc-300" />
                  <span className="text-[11px] font-semibold text-white font-ui-title leading-tight">Import Audio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    loadDemoPack();
                  }}
                  className="flex flex-col items-start gap-1.5 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] text-left transition-colors cursor-pointer min-h-[64px] aura-focus-ring aura-pressable-subtle"
                >
                  <AuraIcon name="sparkles" size={18} className="text-zinc-300" />
                  <span className="text-[11px] font-semibold text-white font-ui-title leading-tight">Sample Pack</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setIsSleepTimerModalOpen(true);
                  }}
                  className="flex flex-col items-start gap-1.5 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] text-left transition-colors cursor-pointer min-h-[64px] aura-focus-ring aura-pressable-subtle"
                >
                  <AuraIcon name="moon" size={18} className="text-purple-300" />
                  <span className="text-[11px] font-semibold text-white font-ui-title leading-tight">Sleep Timer</span>
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
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-sky-500/20 text-left transition-colors cursor-pointer aura-focus-ring aura-pressable-subtle min-h-[52px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0">
                      <AuraIcon name="download" size={16} className="text-sky-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white font-ui-title">Install AURA App</span>
                        <span className="text-[10px] font-mono text-sky-400 font-bold uppercase">PWA</span>
                      </div>
                      <span className="text-[11px] text-zinc-400 block truncate font-ui-meta">
                        Add to home screen for offline use
                      </span>
                    </div>
                  </div>
                  <AuraIcon name="chevronRight" size={16} className="text-zinc-500 shrink-0" />
                </button>
              )}

              {/* SECTION 4: SYSTEM & PREFERENCES */}
              <div className="pt-2.5 border-t border-white/[0.07] flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigateTo('settings')}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] transition-colors text-left cursor-pointer group aura-focus-ring aura-pressable-subtle min-h-[46px]"
                >
                  <div className="flex items-center gap-3">
                    <AuraIcon name="settings" size={17} className="text-zinc-400 group-hover:text-white shrink-0" />
                    <span className="text-xs font-medium text-zinc-200 font-ui-body">Preferences & Audio Engine</span>
                  </div>
                  <AuraIcon name="chevronRight" size={16} className="text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                </button>

                <div className="flex items-center justify-between px-1.5 pt-0.5 text-xs text-zinc-500 min-h-[36px]">
                  <div className="flex items-center gap-1.5 font-mono tabular-nums text-[11px]">
                    <AuraIcon name="hardDrive" size={14} className="text-zinc-400" />
                    <span>Vault · {formatStorageMB(storageUsage.approxBytes)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setIsShortcutsModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs aura-pressable min-h-[36px]"
                  >
                    <AuraIcon name="keyboard" size={14} />
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
