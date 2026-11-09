import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { NavView } from '../../types';
import { 
  Home, 
  Music, 
  Disc, 
  User, 
  ListMusic, 
  Heart, 
  SlidersHorizontal, 
  Settings, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Radio,
  Users,
  Bookmark,
  HardDrive
} from 'lucide-react';
import { useListenTogether } from '../../context/ListenTogetherContext';
import { AuraBrandMark } from '../common/AuraBrandMark';

interface NavItemConfig {
  id: NavView;
  label: string;
  icon: React.ElementType;
  badge?: number;
  dot?: boolean;
}

interface NavGroupConfig {
  title: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    playlists,
    selectedPlaylistId,
    setSelectedPlaylistId,
    setIsPlaylistModalOpen,
    favoriteIds,
    tracks,
    isPlaying,
  } = useMusic();

  const { isInRoom, participants } = useListenTogether();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const navGroups: NavGroupConfig[] = [
    {
      title: 'DISCOVER',
      items: [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'sources', label: 'Open Sources & Radio', icon: Radio },
      ],
    },
    {
      title: 'MUSIC VAULT',
      items: [
        { id: 'library', label: 'Vault Overview', icon: HardDrive },
        { id: 'songs', label: 'All Tracks', icon: Music, badge: tracks.length },
        { id: 'albums', label: 'Albums', icon: Disc },
        { id: 'artists', label: 'Artists', icon: User },
        { id: 'favorites', label: 'Liked Songs', icon: Heart, badge: favoriteIds.size },
      ],
    },
    {
      title: 'STUDIO & SOCIAL',
      items: [
        {
          id: 'listen-together',
          label: 'Listen Together',
          icon: Users,
          badge: isInRoom ? participants.length : undefined,
          dot: isInRoom,
        },
        { id: 'studio', label: 'Audio Studio & DSP', icon: SlidersHorizontal },
        { id: 'moments', label: 'Cue Moments', icon: Bookmark },
      ],
    },
    {
      title: 'SPACES',
      items: [
        { id: 'playlists', label: 'All Spaces', icon: ListMusic, badge: playlists.length },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Preferences', icon: Settings },
      ],
    },
  ];

  const handleNav = (id: NavView) => {
    setSelectedPlaylistId(null);
    setCurrentView(id);
  };

  const handlePlaylistClick = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setCurrentView('playlist-detail');
  };

  return (
    <aside
      id="main-sidebar"
      aria-label="Spatial Navigation Dock"
      className={`hidden lg:flex mt-3.5 lg:mt-4 ml-4 lg:ml-5 mb-3.5 lg:mb-4 h-[calc(100dvh-1.75rem)] lg:h-[calc(100dvh-2rem)] rounded-2xl aura-glass-dock flex-col justify-between select-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-30 shrink-0 shadow-[0_16px_40px_rgba(0,0,0,0.65)] ${
        isCollapsed ? 'w-[72px]' : 'w-60'
      }`}
    >
      {/* -------------------------------------------------------------
          ZONE 1: BRAND LOGO & COLLAPSE / EXPAND CONTROL
          Height precisely matched to floating command header (54px)
          ------------------------------------------------------------- */}
      <div className="h-[54px] px-3.5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        {!isCollapsed ? (
          <>
            <div 
              onClick={() => handleNav('home')}
              className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
              title="AURA Studio Home"
            >
              <AuraBrandMark isPlaying={isPlaying} size={26} />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-[0.14em] text-white font-display leading-none">
                  AURA
                </span>
                <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase mt-0.5">
                  SPATIAL
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer shrink-0 aura-focus-ring"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between w-full px-0.5">
            <button 
              type="button"
              onClick={() => handleNav('home')}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] transition-colors cursor-pointer aura-focus-ring shrink-0"
              title="AURA Home"
              aria-label="AURA Home"
            >
              <AuraBrandMark isPlaying={isPlaying} size={22} />
            </button>
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="w-7 h-7 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.1] active:scale-95 flex items-center justify-center transition-all cursor-pointer shrink-0 aura-focus-ring"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          ZONE 2: SCROLLABLE NAVIGATION DESTINATIONS
          ------------------------------------------------------------- */}
      <div className="flex flex-col gap-3 py-3 overflow-y-auto no-scrollbar flex-1 px-2.5">
        {navGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-0.5">
            
            {/* Group Header */}
            {!isCollapsed ? (
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 font-semibold px-2 py-1 select-none">
                {group.title}
              </span>
            ) : (
              <div className="w-6 h-[1px] bg-white/[0.06] mx-auto my-1" />
            )}

            {/* Group Items */}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id && !selectedPlaylistId;

              if (isCollapsed) {
                return (
                  <div key={item.id} className="relative group/compact flex justify-center py-0.5">
                    <button
                      type="button"
                      onClick={() => handleNav(item.id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer aura-focus-ring relative ${
                        isActive
                          ? 'bg-white/12 text-white shadow-[0_0_16px_rgba(255,255,255,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] ring-1 ring-white/20 before:absolute before:-left-1.5 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:rounded-r-full before:bg-sky-400 before:shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                      aria-label={item.label}
                    >
                      <Icon className="w-4 h-4" />
                      {item.dot && (
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-[#080b12]" />
                      )}
                    </button>

                    {/* Floating Spatial Tooltip */}
                    <div className="fixed left-[84px] opacity-0 pointer-events-none group-hover/compact:opacity-100 transition-opacity duration-150 z-50 px-3 py-1.5 rounded-xl aura-glass-dock text-xs text-white font-medium whitespace-nowrap shadow-[0_12px_32px_rgba(0,0,0,0.95)] flex items-center gap-2 border border-white/15">
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                          ({item.badge})
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all duration-150 cursor-pointer aura-focus-ring ${
                    isActive
                      ? 'bg-gradient-to-r from-white/[0.10] to-white/[0.02] text-white font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2.5px] before:rounded-r-full before:bg-gradient-to-b before:from-sky-400 before:to-indigo-500 before:shadow-[0_0_10px_rgba(56,189,248,0.7)]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  />

                  <span className="truncate flex-1 text-left font-ui-body tracking-tight">{item.label}</span>

                  {item.dot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)] shrink-0" />
                  )}

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300 tabular-nums shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Collections: Individual Spaces / Playlists */}
        {!isCollapsed && playlists.length > 0 && (
          <div className="flex flex-col gap-1 pt-2 border-t border-white/[0.06] mt-1">
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                ACTIVE SPACES
              </span>
              <button
                type="button"
                onClick={() => setIsPlaylistModalOpen(true)}
                className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer aura-focus-ring"
                title="Create New Space"
                aria-label="Create New Space"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto pr-1 no-scrollbar">
              {playlists.map((pl) => {
                const isSelected = selectedPlaylistId === pl.id && currentView === 'playlist-detail';
                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => handlePlaylistClick(pl.id)}
                    className={`group flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer aura-focus-ring ${
                      isSelected
                        ? 'bg-white/[0.1] text-white font-semibold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${pl.coverGradient || 'from-sky-400 to-indigo-500'} shrink-0`} />
                    <span className="truncate flex-1 text-left font-ui-body text-[11px]">{pl.name}</span>
                    <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-400 tabular-nums">
                      {pl.trackIds.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          ZONE 3: SPATIAL DOCK FOOTER
          ------------------------------------------------------------- */}
      <div className="p-2.5 border-t border-white/[0.06] bg-black/20 shrink-0 rounded-b-2xl">
        {!isCollapsed ? (
          <button
            type="button"
            onClick={() => setIsPlaylistModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3 py-1.5 w-full text-xs font-medium text-zinc-200 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl border border-white/[0.08] hover:border-white/15 transition-all cursor-pointer aura-focus-ring"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-ui-body">New Space</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaylistModalOpen(true)}
            className="w-10 h-10 mx-auto rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer aura-focus-ring"
            title="Create New Space"
            aria-label="Create New Space"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
