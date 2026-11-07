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
import { TelemetryBadge } from '../common/primitives/TelemetryBadge';

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
  } = useMusic();

  const { isInRoom, participants } = useListenTogether();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const navGroups: NavGroupConfig[] = [
    {
      title: 'Discover',
      items: [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'sources', label: 'Sources', icon: Radio },
      ],
    },
    {
      title: 'Your Library',
      items: [
        { id: 'library', label: 'Overview', icon: HardDrive },
        { id: 'songs', label: 'Songs', icon: Music, badge: tracks.length },
        { id: 'albums', label: 'Albums', icon: Disc },
        { id: 'artists', label: 'Artists', icon: User },
        { id: 'favorites', label: 'Favorites', icon: Heart, badge: favoriteIds.size },
      ],
    },
    {
      title: 'Your Collections',
      items: [
        { id: 'playlists', label: 'Playlists', icon: ListMusic, badge: playlists.length },
        { id: 'moments', label: 'Moments', icon: Bookmark },
      ],
    },
    {
      title: 'Experiences',
      items: [
        {
          id: 'listen-together',
          label: 'Listen Together',
          icon: Users,
          badge: isInRoom ? participants.length : undefined,
          dot: isInRoom,
        },
        { id: 'studio', label: 'Audio Studio', icon: SlidersHorizontal },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
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
      aria-label="Sidebar Navigation"
      className={`relative hidden lg:flex h-[calc(100dvh-4rem-5.5rem)] border-r border-white/[0.06] bg-[#0b0d13] flex-col justify-between select-none transition-all duration-300 z-20 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex flex-col gap-4 p-3 overflow-y-auto custom-scrollbar">
        
        {/* Navigation Hierarchy Groups */}
        {navGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            {!isCollapsed && (
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold px-2 pt-2 pb-1 select-none">
                {group.title}
              </span>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id && !selectedPlaylistId;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                    isActive
                      ? 'bg-[#171a24] text-white font-semibold shadow-sm border border-white/10 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-white before:rounded-r'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-zinc-400'
                    }`}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}

                  {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <TelemetryBadge
                      variant={item.dot ? 'emerald' : 'default'}
                      size="sm"
                      dot={item.dot}
                      dotPulse={item.dot}
                    >
                      {item.badge}
                    </TelemetryBadge>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Collections: Individual User Playlists Preview */}
        {!isCollapsed && playlists.length > 0 && (
          <div className="flex flex-col gap-1 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                Spaces
              </span>
              <button
                onClick={() => setIsPlaylistModalOpen(true)}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
                title="Create New Space"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {playlists.map((pl) => {
                const isSelected = selectedPlaylistId === pl.id && currentView === 'playlist-detail';
                return (
                  <button
                    key={pl.id}
                    onClick={() => handlePlaylistClick(pl.id)}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
                      isSelected
                        ? 'bg-[#171a24] text-white font-semibold border border-white/10'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${pl.coverGradient} shrink-0`} />
                    <span className="truncate flex-1 text-left">{pl.title}</span>
                    <span className="text-[10px] font-mono text-zinc-600">
                      {pl.trackIds.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Bottom Sidebar Footer Controls */}
      <div className="p-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        {!isCollapsed ? (
          <button
            onClick={() => setIsPlaylistModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 w-full text-xs font-medium text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl border border-white/[0.06] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-400" />
            <span>New Space</span>
          </button>
        ) : (
          <button
            onClick={() => setIsPlaylistModalOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 bg-white/[0.04] hover:bg-white/[0.08] transition-colors mx-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            title="New Space"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

    </aside>
  );
};
