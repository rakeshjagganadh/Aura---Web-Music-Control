import React, { useState, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { 
  User, 
  Play, 
  Music, 
  ArrowLeft, 
  Disc, 
  Shuffle, 
  ListPlus, 
  Search, 
  X, 
  Clock, 
  LayoutGrid, 
  List,
  Layers
} from 'lucide-react';
import { SongObjectCard } from '../common/SongObjectCard';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';

export interface ArtistAlbumInfo {
  id: string;
  title: string;
  coverUrl?: string;
  coverColor?: string;
  year?: number;
  tracks: Track[];
}

export interface ArtistInfo {
  id: string;
  name: string;
  tracks: Track[];
  albums: ArtistAlbumInfo[];
  totalDuration: number;
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

// Deterministic artist avatar gradient palette
const ARTIST_GRADIENTS = [
  'from-indigo-600 via-purple-700 to-zinc-950',
  'from-blue-600 via-indigo-800 to-slate-950',
  'from-violet-600 via-fuchsia-800 to-zinc-950',
  'from-cyan-600 via-blue-800 to-zinc-950',
  'from-emerald-600 via-teal-800 to-zinc-950',
  'from-rose-600 via-purple-800 to-zinc-950',
];

function getArtistGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % ARTIST_GRADIENTS.length;
  return ARTIST_GRADIENTS[index];
}

export const ArtistsView: React.FC = () => {
  const { 
    tracks, 
    playTrack, 
    isShuffle, 
    toggleShuffle, 
    addToQueue 
  } = useMusic();

  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'tracks' | 'albums' | 'recent'>('name');
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);

  // Group tracks by artist with album associations
  const artistsMap = useMemo(() => {
    const map: Record<string, ArtistInfo> = {};

    tracks.forEach((track) => {
      const rawArtist = (track.artist || '').trim() || 'Unknown Artist';
      const normArtist = rawArtist.toLowerCase();
      const artistKey = `artist:::${normArtist}`;

      if (!map[artistKey]) {
        map[artistKey] = {
          id: artistKey,
          name: rawArtist,
          tracks: [],
          albums: [],
          totalDuration: 0,
          latestDateAdded: 0,
        };
      }

      const artist = map[artistKey];

      // Deduplicate track by id
      if (!artist.tracks.some((t) => t.id === track.id)) {
        artist.tracks.push(track);
        artist.totalDuration += track.duration || 0;
        if (track.dateAdded && track.dateAdded > artist.latestDateAdded) {
          artist.latestDateAdded = track.dateAdded;
        }

        // Associate track to artist's album
        const rawAlbum = (track.album || '').trim();
        const normAlbum = rawAlbum.toLowerCase();
        const isGeneric = !rawAlbum || GENERIC_ALBUM_NAMES.has(normAlbum);
        const albumKey = isGeneric ? 'singles_and_other' : `album:::${normAlbum}`;
        const albumTitle = isGeneric ? 'Singles & Other Tracks' : rawAlbum;

        let existingAlbum = artist.albums.find((a) => a.id === albumKey);
        if (!existingAlbum) {
          existingAlbum = {
            id: albumKey,
            title: albumTitle,
            coverUrl: track.coverUrl,
            coverColor: track.coverColor,
            year: track.year,
            tracks: [track],
          };
          artist.albums.push(existingAlbum);
        } else {
          existingAlbum.tracks.push(track);
          if (!existingAlbum.coverUrl && track.coverUrl) {
            existingAlbum.coverUrl = track.coverUrl;
          }
          if (!existingAlbum.coverColor && track.coverColor) {
            existingAlbum.coverColor = track.coverColor;
          }
          if (!existingAlbum.year && track.year) {
            existingAlbum.year = track.year;
          }
        }
      }
    });

    return map;
  }, [tracks]);

  // List of all artists
  const allArtistsList: ArtistInfo[] = useMemo(() => {
    return Object.values(artistsMap);
  }, [artistsMap]);

  // Filtered and sorted artists
  const displayedArtists: ArtistInfo[] = useMemo(() => {
    let list = [...allArtistsList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        case 'tracks':
          return b.tracks.length - a.tracks.length;
        case 'albums':
          return b.albums.length - a.albums.length;
        case 'recent':
          return b.latestDateAdded - a.latestDateAdded;
        default:
          return 0;
      }
    });

    return list;
  }, [allArtistsList, searchQuery, sortBy]);

  // Playback Handlers
  const handlePlayArtist = (artist: ArtistInfo) => {
    if (!artist.tracks.length) return;
    playTrack(artist.tracks[0], artist.tracks);
  };

  const handleShuffleArtist = (artist: ArtistInfo) => {
    if (!artist.tracks.length) return;

    // 1. Create a true Fisher-Yates shuffled copy of the artist tracks
    const shuffled = [...artist.tracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 2. Ensure player shuffle state is active without turning it off if already on
    if (!isShuffle) {
      toggleShuffle();
    }

    // 3. Play the first shuffled track with the randomized queue
    playTrack(shuffled[0], shuffled);
  };

  const handleAddArtistToQueue = (artist: ArtistInfo) => {
    artist.tracks.forEach((track) => {
      addToQueue(track);
    });
  };

  const handlePlayAlbumRail = (album: ArtistAlbumInfo) => {
    if (!album.tracks.length) return;
    playTrack(album.tracks[0], album.tracks);
  };

  // Selected Artist Detail View
  const selectedArtist = selectedArtistId ? artistsMap[selectedArtistId] : null;

  if (selectedArtist) {
    const artistGradient = getArtistGradient(selectedArtist.name);
    const initialChar = (selectedArtist.name.charAt(0) || 'A').toUpperCase();

    return (
      <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto select-none animate-fadeIn">
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => setSelectedArtistId(null)}
          className="group inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors w-fit px-3 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Artists</span>
        </button>

        {/* Artist Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0b0d13]/80 border border-white/[0.08] backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
          {/* Ambient background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
            {/* Authentic Circular Initials Avatar */}
            <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br ${artistGradient} flex items-center justify-center shrink-0 border border-white/15 shadow-2xl relative group`}>
              <span className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight select-none">
                {initialChar}
              </span>
            </div>

            {/* Metadata & Controls */}
            <div className="flex flex-col gap-2 text-center sm:text-left min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 w-fit mx-auto sm:mx-0">
                <User className="w-3 h-3 text-purple-400" />
                Artist Collection
              </span>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
                {selectedArtist.name}
              </h1>

              {/* Verified Library Scope Statement */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-zinc-400 mt-1">
                <span>{selectedArtist.tracks.length} {selectedArtist.tracks.length === 1 ? 'track' : 'tracks'} in collection</span>
                <span>•</span>
                <span>{selectedArtist.albums.length} {selectedArtist.albums.length === 1 ? 'album' : 'albums'}</span>
                <span>•</span>
                <span className="font-mono">{formatDuration(selectedArtist.totalDuration)} total runtime</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                <button
                  onClick={() => handlePlayArtist(selectedArtist)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-lg shadow-white/10 transition-all active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Artist</span>
                </button>

                <button
                  onClick={() => handleShuffleArtist(selectedArtist)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95 cursor-pointer backdrop-blur-md"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Shuffle</span>
                </button>

                <button
                  onClick={() => handleAddArtistToQueue(selectedArtist)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-all active:scale-95 cursor-pointer"
                  title="Add all artist tracks to playback queue"
                >
                  <ListPlus className="w-4 h-4" />
                  <span>Add to Queue</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Albums by Artist Section (Horizontal Rail) */}
        {selectedArtist.albums.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-2 text-xs font-mono uppercase tracking-wider text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Albums in Collection ({selectedArtist.albums.length})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {selectedArtist.albums.map((album) => (
                <div
                  key={album.id}
                  className="group relative flex flex-col gap-2.5 p-3 rounded-2xl bg-[#0b0d13]/60 hover:bg-[#121520]/80 border border-white/[0.06] hover:border-white/[0.14] backdrop-blur-xl transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02]"
                >
                  {/* Album Cover Thumbnail */}
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0e1017] border border-white/10 shadow-sm">
                    {album.coverUrl ? (
                      <img 
                        src={album.coverUrl} 
                        alt={album.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${album.coverColor || 'from-indigo-600 via-indigo-900 to-zinc-950'} flex items-center justify-center`}>
                        <Disc className="w-8 h-8 text-white/50" />
                      </div>
                    )}

                    {/* Quick Play Album Rail Overlay */}
                    <button
                      onClick={() => handlePlayAlbumRail(album)}
                      className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                      title={`Play ${album.title}`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>

                  <div className="px-0.5 min-w-0">
                    <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                      {album.title}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                      {album.tracks.length} {album.tracks.length === 1 ? 'track' : 'tracks'}
                      {album.year ? ` • ${album.year}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracks by Artist Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-2 text-xs font-mono uppercase tracking-wider text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-indigo-400" />
              Tracks in Collection ({selectedArtist.tracks.length})
            </span>
            <span>{formatDuration(selectedArtist.totalDuration)}</span>
          </div>

          <div className="divide-y divide-white/[0.04] rounded-2xl bg-[#0b0d13]/60 border border-white/[0.06] overflow-hidden p-2 backdrop-blur-xl shadow-lg">
            {selectedArtist.tracks.map((track, i) => (
              <SongObjectCard
                key={track.id}
                track={track}
                playlistContext={selectedArtist.tracks}
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

  // Main Artists Browsing Grid
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto select-none animate-fadeIn">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Artists</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {allArtistsList.length} {allArtistsList.length === 1 ? 'artist' : 'artists'} represented in your collection
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
              placeholder="Search artists..."
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
              <option value="name" className="bg-zinc-900 text-white">Name (A–Z)</option>
              <option value="tracks" className="bg-zinc-900 text-white">Track Count</option>
              <option value="albums" className="bg-zinc-900 text-white">Album Count</option>
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

      {/* Artist Collection Content */}
      {displayedArtists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl bg-[#0b0d13]/40 border border-white/[0.04] p-8">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
            <User className="w-7 h-7 text-zinc-500" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">
            {searchQuery ? 'No artists match your search' : 'No artists in your library'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            {searchQuery
              ? `No artists found for "${searchQuery}". Clear your search to view all artists.`
              : 'Add music files to your library or import tracks to explore artists in your collection.'}
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
          {displayedArtists.map((artist) => {
            const gradient = getArtistGradient(artist.name);
            const initial = (artist.name.charAt(0) || 'A').toUpperCase();

            return (
              <div
                key={artist.id}
                onClick={() => setSelectedArtistId(artist.id)}
                className="group cursor-pointer flex flex-col items-center text-center gap-3 p-4 rounded-2xl bg-[#0b0d13]/70 hover:bg-[#121520]/80 border border-white/[0.06] hover:border-white/[0.14] backdrop-blur-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02]"
              >
                {/* Circular Avatar Container */}
                <div className="relative">
                  <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl border border-white/15 group-hover:scale-105 transition-transform duration-300 shadow-xl`}>
                    {initial}
                  </div>

                  {/* Quick Play Hover Button */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayArtist(artist);
                    }}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95"
                    title={`Play ${artist.name}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Artist Info */}
                <div className="min-w-0 w-full px-1">
                  <h4 className="text-xs font-semibold text-zinc-100 truncate group-hover:text-indigo-300 transition-colors">
                    {artist.name}
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-500 mt-1">
                    {artist.tracks.length} {artist.tracks.length === 1 ? 'track' : 'tracks'} • {artist.albums.length} {artist.albums.length === 1 ? 'album' : 'albums'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="divide-y divide-white/[0.04] rounded-2xl bg-[#0b0d13]/60 border border-white/[0.06] overflow-hidden backdrop-blur-xl">
          {displayedArtists.map((artist) => {
            const gradient = getArtistGradient(artist.name);
            const initial = (artist.name.charAt(0) || 'A').toUpperCase();

            return (
              <div
                key={artist.id}
                onClick={() => setSelectedArtistId(artist.id)}
                className="group flex items-center justify-between p-3 px-4 hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Avatar Thumbnail */}
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm border border-white/10 shrink-0`}>
                    {initial}
                  </div>

                  {/* Text Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                      {artist.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {artist.albums.length} {artist.albums.length === 1 ? 'album' : 'albums'} in collection
                    </p>
                  </div>
                </div>

                {/* Meta & Actions */}
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 shrink-0">
                  <span>{artist.tracks.length} tracks</span>
                  <span className="hidden sm:inline">{formatDuration(artist.totalDuration)}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayArtist(artist);
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                    title={`Play ${artist.name}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
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
