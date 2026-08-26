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
  ChevronRight
} from 'lucide-react';

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

  const [isCollapsed, setIsCollapsed] = useState(false);

  const mainNavItems: { id: NavView; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'songs', label: 'Library', icon: Music, badge: tracks.length },
    { id: 'albums', label: 'Albums', icon: Disc },
    { id: 'artists', label: 'Artists', icon: User },
    { id: 'playlists', label: 'Spaces', icon: ListMusic, badge: playlists.length },
    { id: 'favorites', label: 'Favorites', icon: Heart, badge: favoriteIds.size },
    { id: 'studio', label: 'Audio Studio', icon: SlidersHorizontal },
    { id: 'settings', label: 'Settings', icon: Settings },
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
      className={`relative hidden lg:flex h-[calc(100vh-4rem-5rem)] border-r border-white/[0.06] bg-[#07080c]/80 backdrop-blur-2xl flex-col justify-between select-none transition-all duration-300 z-20 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex flex-col gap-6 p-3 overflow-y-auto">
        
        {/* Navigation List */}
        <div className="flex flex-col gap-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id && !selectedPlaylistId;

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                
                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white/5 text-zinc-400 border border-white/5">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* My Playlists Section */}
        {!isCollapsed && (
          <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between px-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                Spaces
              </span>
              <button
                onClick={() => setIsPlaylistModalOpen(true)}
                className="p-1 rounded text-zinc-500 hover:text-indigo-300 hover:bg-white/5 transition-colors cursor-pointer"
                title="Create New Space"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto pr-1">
              {playlists.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-zinc-600">
                  No spaces yet
                </div>
              ) : (
                playlists.map((pl) => {
                  const isSelected = selectedPlaylistId === pl.id;
                  return (
                    <button
                      key={pl.id}
                      onClick={() => handlePlaylistClick(pl.id)}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/40 text-indigo-300 font-semibold'
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
                })
              )}
            </div>
          </div>
        )}

      </div>

      {/* Bottom Sidebar Controls */}
      <div className="p-3 border-t border-white/5 flex items-center justify-between">
        {!isCollapsed ? (
          <button
            onClick={() => setIsPlaylistModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 w-full text-xs font-medium text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl border border-white/5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>New Space</span>
          </button>
        ) : (
          <button
            onClick={() => setIsPlaylistModalOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-indigo-300 bg-white/[0.04] hover:bg-white/[0.08] transition-colors mx-auto cursor-pointer"
            title="New Space"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors ml-2 cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

    </aside>
  );
};
