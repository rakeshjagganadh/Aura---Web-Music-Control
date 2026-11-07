import React, { useState, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track, MusicSourceType } from '../../types';
import { 
  Disc, 
  Play, 
  ArrowLeft, 
  LayoutGrid, 
  List, 
  Shuffle, 
  ListPlus, 
  Search, 
  X, 
  Clock, 
  Music,
  Check
} from 'lucide-react';
import { SongObjectCard } from '../common/SongObjectCard';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';

export interface AlbumInfo {
  id: string;
  title: string;
  artist: string;
  artists: string[];
  isCompilation: boolean;
  coverUrl?: string;
  coverColor?: string;
  tracks: Track[];
  totalDuration: number;
  year?: number;
  genres: string[];
  sources: MusicSourceType[];
  latestDateAdded: number;
}

const GENERIC_ALBUM_NAMES = new Set([
  'unknown album',
  'unknown',
  'untitled',
  'single',
  'singles',
  'ep',
  'greatest hits',
  'live',
  'hits',
  'demo'
]);

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return '0 min';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  if (minutes > 0) {
    return `${minutes} min ${seconds > 0 ? `${seconds} sec` : ''}`.trim();
  }
  return `${seconds} sec`;
}

export const AlbumsView: React.FC = () => {
  const { 
    tracks, 
    playTrack, 
    isShuffle, 
    toggleShuffle, 
    addToQueue 
  } = useMusic();

  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'tracks' | 'recent'>('title');
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);

  // Group tracks by album with accurate metadata provenance
  const albumsMap = useMemo(() => {
    const map: Record<string, AlbumInfo> = {};

    tracks.forEach((track) => {
      const rawAlbum = (track.album || '').trim();
      const rawArtist = (track.artist || '').trim() || 'Unknown Artist';
      const normAlbum = rawAlbum.toLowerCase();
      const normArtist = rawArtist.toLowerCase();

      const isGeneric = !rawAlbum || GENERIC_ALBUM_NAMES.has(normAlbum);

      // Determine unique album ID key
      let albumKey: string;
      let displayTitle: string;

      if (isGeneric) {
        albumKey = `generic:::${normAlbum || 'singles'}:::${normArtist}`;
        displayTitle = rawAlbum || 'Singles & Other Tracks';
      } else {
        albumKey = `album:::${normAlbum}`;
        displayTitle = rawAlbum;
      }

      if (!map[albumKey]) {
        map[albumKey] = {
          id: albumKey,
          title: displayTitle,
          artist: rawArtist,
          artists: [rawArtist],
          isCompilation: false,
          coverUrl: track.coverUrl,
          coverColor: track.coverColor,
          tracks: [track],
          totalDuration: track.duration || 0,
          year: track.year,
          genres: track.genre ? [track.genre] : [],
          sources: track.source ? [track.source] : ['local'],
          latestDateAdded: track.dateAdded || 0,
        };
      } else {
        const album = map[albumKey];
        // Deduplicate tracks by id
        if (!album.tracks.some((t) => t.id === track.id)) {
          album.tracks.push(track);
          album.totalDuration += track.duration || 0;

          if (!album.artists.includes(rawArtist)) {
            album.artists.push(rawArtist);
          }

          if (album.artists.length > 1 && !isGeneric) {
            album.isCompilation = true;
            album.artist = 'Various Artists';
          }

          if (!album.coverUrl && track.coverUrl) {
            album.coverUrl = track.coverUrl;
          }
          if (!album.coverColor && track.coverColor) {
            album.coverColor = track.coverColor;
          }
          if (!album.year && track.year) {
            album.year = track.year;
          }
          if (track.genre && !album.genres.includes(track.genre)) {
            album.genres.push(track.genre);
          }
          if (track.source && !album.sources.includes(track.source)) {
            album.sources.push(track.source);
          }
          if (track.dateAdded && track.dateAdded > album.latestDateAdded) {
            album.latestDateAdded = track.dateAdded;
          }
        }
      }
    });

    return map;
  }, [tracks]);

  // List of albums converted to array
  const allAlbumsList: AlbumInfo[] = useMemo(() => {
    return Object.values(albumsMap);
  }, [albumsMap]);

  // Filtered and sorted albums
  const displayedAlbums: AlbumInfo[] = useMemo(() => {
    let list = [...allAlbumsList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) => 
        a.title.toLowerCase().includes(q) || 
        a.artist.toLowerCase().includes(q) ||
        a.artists.some((art) => art.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        case 'artist':
          return a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' });
        case 'tracks':
          return b.tracks.length - a.tracks.length;
        case 'recent':
          return b.latestDateAdded - a.latestDateAdded;
        default:
          return 0;
      }
    });

    return list;
  }, [allAlbumsList, searchQuery, sortBy]);

  // Playback Handlers
  const handlePlayAlbum = (album: AlbumInfo) => {
    if (!album.tracks.length) return;
    playTrack(album.tracks[0], album.tracks);
  };

  const handleShuffleAlbum = (album: AlbumInfo) => {
    if (!album.tracks.length) return;
    
    // 1. Create a true Fisher-Yates shuffled array of the album tracks
    const shuffled = [...album.tracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 2. Ensure player shuffle state is active so player UI and nextTrack reflect shuffle
    if (!isShuffle) {
      toggleShuffle();
    }

    // 3. Initiate playback with the first shuffled track and pass the randomized queue
    playTrack(shuffled[0], shuffled);
  };

  const handleAddAlbumToQueue = (album: AlbumInfo) => {
    album.tracks.forEach((track) => {
      addToQueue(track);
    });
  };

  // Selected Album Detail View
  const selectedAlbum = selectedAlbumId ? albumsMap[selectedAlbumId] : null;

  if (selectedAlbum) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto select-none animate-fadeIn">
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => setSelectedAlbumId(null)}
          className="group inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors w-fit px-3 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Albums</span>
        </button>

        {/* Album Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0b0d13]/80 border border-white/[0.08] backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
          {/* Subtle ambient background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
            {/* Artwork */}
            <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl bg-[#0e1017] shrink-0 border border-white/10 relative group">
              {selectedAlbum.coverUrl ? (
                <img 
                  src={selectedAlbum.coverUrl} 
                  alt={selectedAlbum.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${selectedAlbum.coverColor || 'from-indigo-600 via-indigo-900 to-zinc-950'} flex items-center justify-center`}>
                  <Disc className="w-16 h-16 text-white/50" />
                </div>
              )}
            </div>

            {/* Metadata & Controls */}
            <div className="flex flex-col gap-2 text-center sm:text-left min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 w-fit mx-auto sm:mx-0">
                <Disc className="w-3 h-3 text-indigo-400" />
                {selectedAlbum.isCompilation ? 'Compilation' : 'Album'}
              </span>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
                {selectedAlbum.title}
              </h1>

              <div className="text-sm sm:text-base text-zinc-300 font-medium">
                {selectedAlbum.artist}
              </div>

              {/* Verified Metadata Summary */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-zinc-400 mt-1">
                <span>{selectedAlbum.tracks.length} {selectedAlbum.tracks.length === 1 ? 'track' : 'tracks'}</span>
                <span>•</span>
                <span className="font-mono">{formatDuration(selectedAlbum.totalDuration)}</span>
                {selectedAlbum.year && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{selectedAlbum.year}</span>
                  </>
                )}
                {selectedAlbum.genres.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-indigo-400 font-mono text-[11px]">{selectedAlbum.genres.slice(0, 2).join(', ')}</span>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                <button
                  onClick={() => handlePlayAlbum(selectedAlbum)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-lg shadow-white/10 transition-all active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Album</span>
                </button>

                <button
                  onClick={() => handleShuffleAlbum(selectedAlbum)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95 cursor-pointer backdrop-blur-md"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Shuffle</span>
                </button>

                <button
                  onClick={() => handleAddAlbumToQueue(selectedAlbum)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-all active:scale-95 cursor-pointer"
                  title="Add entire album to playback queue"
                >
                  <ListPlus className="w-4 h-4" />
                  <span>Add to Queue</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tracks List Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-2 text-xs font-mono uppercase tracking-wider text-zinc-400">
            <span>Track Listing</span>
            <span>{selectedAlbum.tracks.length} {selectedAlbum.tracks.length === 1 ? 'track' : 'tracks'}</span>
          </div>

          <div className="divide-y divide-white/[0.04] rounded-2xl bg-[#0b0d13]/60 border border-white/[0.06] overflow-hidden p-2 backdrop-blur-xl shadow-lg">
            {selectedAlbum.tracks.map((track, i) => (
              <SongObjectCard
                key={track.id}
                track={track}
                playlistContext={selectedAlbum.tracks}
                variant="row"
                showIndex={i + 1}
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        </div>

        {/* Playlist Modal Integration */}
        {playlistModalTrack && (
          <AddToPlaylistModal
            track={playlistModalTrack}
            onClose={() => setPlaylistModalTrack(null)}
          />
        )}
      </div>
    );
  }

  // Main Albums Browsing Grid
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto select-none animate-fadeIn">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Albums</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {allAlbumsList.length} {allAlbumsList.length === 1 ? 'album' : 'albums'} in your personal collection
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search albums..."
              className="w-full bg-[#0b0d13]/80 border border-white/10 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 backdrop-blur-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-[#0b0d13]/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300">
            <span className="text-[10px] uppercase font-mono text-zinc-500">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="title" className="bg-zinc-900 text-white">Title (A–Z)</option>
              <option value="artist" className="bg-zinc-900 text-white">Artist (A–Z)</option>
              <option value="tracks" className="bg-zinc-900 text-white">Track Count</option>
              <option value="recent" className="bg-zinc-900 text-white">Recently Added</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0b0d13]/80 border border-white/10 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Album Collection Content */}
      {displayedAlbums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl bg-[#0b0d13]/40 border border-white/[0.04] p-8">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
            <Disc className="w-7 h-7 text-zinc-500" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">
            {searchQuery ? 'No albums match your search' : 'No albums in your library'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            {searchQuery
              ? `No albums found for "${searchQuery}". Clear your search query to view all albums.`
              : 'Add music files to your library or import tracks to organize your music into albums.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {displayedAlbums.map((album) => (
            <div
              key={album.id}
              onClick={() => setSelectedAlbumId(album.id)}
              className="group cursor-pointer flex flex-col gap-2.5 p-3 rounded-2xl bg-[#0b0d13]/70 hover:bg-[#121520]/80 border border-white/[0.06] hover:border-white/[0.14] backdrop-blur-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02]"
            >
              {/* Artwork Container */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0e1017] border border-white/10 shadow-md">
                {album.coverUrl ? (
                  <img 
                    src={album.coverUrl} 
                    alt={album.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${album.coverColor || 'from-indigo-600 via-indigo-900 to-zinc-950'} flex items-center justify-center`}>
                    <Disc className="w-10 h-10 text-white/50" />
                  </div>
                )}

                {/* Quick Play Hover Button */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayAlbum(album);
                  }}
                  className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95"
                  title="Play Album"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>

              {/* Details */}
              <div className="px-0.5 min-w-0">
                <h4 className="text-xs font-semibold text-zinc-100 truncate group-hover:text-indigo-300 transition-colors">
                  {album.title}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  {album.artist}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 mt-1">
                  <span>{album.tracks.length} {album.tracks.length === 1 ? 'track' : 'tracks'}</span>
                  {album.year && (
                    <>
                      <span>•</span>
                      <span>{album.year}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="divide-y divide-white/[0.04] rounded-2xl bg-[#0b0d13]/60 border border-white/[0.06] overflow-hidden backdrop-blur-xl">
          {displayedAlbums.map((album) => (
            <div
              key={album.id}
              onClick={() => setSelectedAlbumId(album.id)}
              className="group flex items-center justify-between p-3 px-4 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Thumbnail */}
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#0e1017] border border-white/10 shrink-0">
                  {album.coverUrl ? (
                    <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${album.coverColor || 'from-indigo-600 to-zinc-950'} flex items-center justify-center`}>
                      <Disc className="w-5 h-5 text-white/50" />
                    </div>
                  )}
                </div>

                {/* Text Info */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                    {album.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {album.artist}
                  </p>
                </div>
              </div>

              {/* Meta & Actions */}
              <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 shrink-0">
                <span>{album.tracks.length} tracks</span>
                <span className="hidden sm:inline">{formatDuration(album.totalDuration)}</span>
                {album.year && <span className="hidden md:inline">{album.year}</span>}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayAlbum(album);
                  }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                  title="Play Album"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Playlist Modal Integration */}
      {playlistModalTrack && (
        <AddToPlaylistModal
          track={playlistModalTrack}
          onClose={() => setPlaylistModalTrack(null)}
        />
      )}
    </div>
  );
};
