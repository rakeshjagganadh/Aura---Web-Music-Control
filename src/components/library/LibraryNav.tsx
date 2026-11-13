import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { NavView } from '../../types';
import { 
  Library, 
  Music, 
  Disc, 
  User, 
  ListMusic, 
  Heart, 
  HardDrive 
} from 'lucide-react';

interface LibraryNavProps {
  activeView?: NavView | 'vault';
  className?: string;
  onSelectVault?: () => void;
}

export const LibraryNav: React.FC<LibraryNavProps> = ({
  activeView,
  className = '',
  onSelectVault,
}) => {
  const {
    currentView,
    setCurrentView,
    tracks,
    playlists,
    favoriteItems,
  } = useMusic();

  const current = activeView || currentView;

  // Genuine counts
  const totalTracks = tracks.length;
  const albumCount = React.useMemo(() => new Set(tracks.map((t) => t.album).filter(Boolean)).size, [tracks]);
  const artistCount = React.useMemo(() => new Set(tracks.map((t) => t.artist).filter(Boolean)).size, [tracks]);
  const playlistCount = playlists.length;
  const likedCount = favoriteItems.length;
  const localCount = React.useMemo(() => tracks.filter((t) => !t.source || t.source === 'local').length, [tracks]);

  const navItems = [
    {
      id: 'library' as const,
      label: 'Overview',
      icon: Library,
      count: undefined,
      onClick: () => setCurrentView('library'),
    },
    {
      id: 'songs' as const,
      label: 'All Tracks',
      icon: Music,
      count: totalTracks,
      onClick: () => setCurrentView('songs'),
    },
    {
      id: 'albums' as const,
      label: 'Albums',
      icon: Disc,
      count: albumCount,
      onClick: () => setCurrentView('albums'),
    },
    {
      id: 'artists' as const,
      label: 'Artists',
      icon: User,
      count: artistCount,
      onClick: () => setCurrentView('artists'),
    },
    {
      id: 'playlists' as const,
      label: 'Playlists',
      icon: ListMusic,
      count: playlistCount,
      onClick: () => setCurrentView('playlists'),
    },
    {
      id: 'favorites' as const,
      label: 'Liked Songs',
      icon: Heart,
      count: likedCount,
      onClick: () => setCurrentView('favorites'),
    },
    {
      id: 'vault' as const,
      label: 'Local Vault',
      icon: HardDrive,
      count: localCount,
      onClick: () => {
        if (onSelectVault) {
          onSelectVault();
        } else {
          setCurrentView('library');
        }
      },
    },
  ];

  return (
    <nav 
      aria-label="Library Navigation"
      className={`flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 border-b border-white/[0.06] select-none ${className}`}
    >
      {navItems.map((item) => {
        const isActive = current === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer aura-focus-ring ${
              isActive
                ? 'glass-floating border border-white/25 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:glass-ambient border border-transparent'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-sky-300' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
            <span className="font-medium">{item.label}</span>
            {item.count !== undefined && (
              <span className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-full transition-colors ${isActive ? 'bg-white/20 text-white font-semibold' : 'bg-white/5 text-zinc-400'}`}>
                {item.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
