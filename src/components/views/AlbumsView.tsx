import React, { useState, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track, MusicSourceType } from '../../types';
import { LibraryNav } from '../library/LibraryNav';
import { TrackRow } from '../library/TrackRow';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
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
  Plus,
  ArrowUpDown,
  Calendar
} from 'lucide-react';

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
    addToQueue,
    setIsUploadModalOpen,
    setCurrentView,
  } = useMusic();

  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'tracks' | 'recent'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

      let albumKey: string;
      let displayTitle: string;

      if (isGeneric) {
        albumKey = `generic:::${normAlbum || 'singles'}:::${normArtist}`;
        displayTitle = rawAlbum || 'Singles & Releases';
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

          if (track.year && (!album.year || track.year < album.year)) {
            album.year = track.year;
          }

          if (track.dateAdded && track.dateAdded > album.latestDateAdded) {
            album.latestDateAdded = track.dateAdded;
          }
        }
      }
    });

    return map;
  }, [tracks]);

  const albumList = useMemo(() => Object.values(albumsMap), [albumsMap]);

  // Filtered and sorted albums
  const displayedAlbums = useMemo(() => {
    let list = [...albumList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.artist.toLowerCase().includes(q) ||
        a.genres.some((g) => g.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      let comp = 0;
      switch (sortBy) {
        case 'title':
          comp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
          break;
        case 'artist':
          comp = a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' });
          break;
        case 'tracks':
          comp = a.tracks.length - b.tracks.length;
          break;
        case 'recent':
        default:
          comp = a.latestDateAdded - b.latestDateAdded;
          break;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

    return list;
  }, [albumList, searchQuery, sortBy, sortOrder]);

  const activeAlbum = selectedAlbumId ? albumsMap[selectedAlbumId] : null;

  const handlePlayAlbum = (album: AlbumInfo, shuffle = false) => {
    if (!album.tracks || album.tracks.length === 0) return;
    const queue = shuffle ? [...album.tracks].sort(() => Math.random() - 0.5) : album.tracks;
    playTrack(queue[0], queue);
  };

  const handleAddAlbumToQueue = (album: AlbumInfo) => {
    album.tracks.forEach((t) => addToQueue(t));
  };

  // -------------------------------------------------------------
  // ALBUM DETAIL VIEW
  // -------------------------------------------------------------
  if (activeAlbum) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8 p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto select-none pb-36 sm:pb-44 animate-fadeIn">
        {/* Navigation Breadcrumb / Back Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedAlbumId(null)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Albums</span>
          </button>
        </div>

        {/* Large Album Header */}
        <section className="relative overflow-hidden rounded-3xl aura-glass-island p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
          {/* Cover Art Tile */}
          <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shrink-0 bg-zinc-900 border border-white/15 shadow-2xl">
            {activeAlbum.coverUrl ? (
              <img
                src={activeAlbum.coverUrl}
                alt={activeAlbum.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${activeAlbum.coverColor || 'from-purple-950 to-zinc-900'} flex items-center justify-center`}>
                <Disc className="w-16 h-16 text-white/40" />
              </div>
            )}
          </div>

          {/* Details & Controls */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 inline-block mb-2">
              ALBUM RELEASE
            </span>

            <h1 className="text-2xl sm:text-4xl font-page-title text-white tracking-tight line-clamp-2">
              {activeAlbum.title}
            </h1>

            <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-xs sm:text-sm text-zinc-300 font-ui-meta">
              <span className="font-semibold text-white">{activeAlbum.artist}</span>
              {activeAlbum.year && (
                <>
                  <span className="text-zinc-600" aria-hidden="true">·</span>
                  <span className="text-zinc-400">{activeAlbum.year}</span>
                </>
              )}
              <span className="text-zinc-600" aria-hidden="true">·</span>
              <span className="text-zinc-400">{activeAlbum.tracks.length} tracks</span>
              <span className="text-zinc-600" aria-hidden="true">·</span>
              <span className="text-zinc-400 font-mono">{formatDuration(activeAlbum.totalDuration)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center md:justify-start gap-2.5 mt-5 flex-wrap">
              <button
                type="button"
                onClick={() => handlePlayAlbum(activeAlbum, false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer aura-focus-ring"
              >
                <Play className="w-4 h-4 fill-current text-black translate-x-0.2" />
                <span>Play Album</span>
              </button>

              <button
                type="button"
                onClick={() => handlePlayAlbum(activeAlbum, true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer aura-focus-ring"
              >
                <Shuffle className="w-3.5 h-3.5 text-sky-400" />
                <span>Shuffle</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddAlbumToQueue(activeAlbum)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer aura-focus-ring"
              >
                <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Add to Queue</span>
              </button>
            </div>
          </div>
        </section>

        {/* Album Tracklist */}
        <section className="flex flex-col rounded-2xl aura-glass-ambient border border-white/10 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-ui-title">Tracklist ({activeAlbum.tracks.length})</h3>
            <span className="text-xs font-mono text-zinc-400">{formatDuration(activeAlbum.totalDuration)}</span>
          </div>

          <div className="divide-y divide-white/[0.03] p-1.5">
            {activeAlbum.tracks.map((track, i) => (
              <TrackRow
                key={`album-track-${track.id}`}
                track={track}
                index={i + 1}
                playlistContext={activeAlbum.tracks}
                showAlbum={false}
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        </section>

        {playlistModalTrack && (
          <AddToPlaylistModal
            track={playlistModalTrack}
            isOpen={Boolean(playlistModalTrack)}
            onClose={() => setPlaylistModalTrack(null)}
          />
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN ALBUMS CATALOGUE GRID
  // -------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6 sm:gap-8 p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto select-none pb-36 sm:pb-44">
      
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-zinc-400">
            <Disc className="w-3.5 h-3.5 text-purple-400" />
            <span className="uppercase tracking-wider text-[11px] font-semibold text-purple-400">Album Catalogue</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span>{albumList.length} albums catalogued</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-page-title text-white tracking-tight">
            Albums
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-ui-meta">
            Explore your library through full album releases, EP collections, and curated artwork packages.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer aura-focus-ring"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Import Music</span>
          </button>
        </div>
      </section>

      {/* Library Navigation */}
      <LibraryNav activeView="albums" />

      {/* Filter & Sort Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search albums by name, artist, or genre..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-all font-ui-title"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="relative flex items-center gap-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-zinc-300 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1"
            >
              <option value="title" className="bg-[#12141c] text-white">Album Title</option>
              <option value="artist" className="bg-[#12141c] text-white">Artist</option>
              <option value="tracks" className="bg-[#12141c] text-white">Track Count</option>
              <option value="recent" className="bg-[#12141c] text-white">Recently Added</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="hover:text-white px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 cursor-pointer"
            >
              {sortOrder}
            </button>
          </div>
        </div>
      </section>

      {/* Album Grid */}
      {displayedAlbums.length > 0 ? (
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {displayedAlbums.map((album) => (
            <div
              key={album.id}
              onClick={() => setSelectedAlbumId(album.id)}
              className="group relative flex flex-col p-3 rounded-2xl aura-glass-ambient hover:border-white/20 transition-all duration-300 cursor-pointer select-none shadow-md"
            >
              {/* Artwork Square */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-sm mb-3">
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${album.coverColor || 'from-purple-950 to-zinc-900'} flex items-center justify-center`}>
                    <Disc className="w-10 h-10 text-white/40" />
                  </div>
                )}

                {/* Floating Play/Shuffle Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayAlbum(album, false);
                    }}
                    className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    title={`Play ${album.title}`}
                  >
                    <Play className="w-4 h-4 fill-current text-black translate-x-0.2" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayAlbum(album, true);
                    }}
                    className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    title={`Shuffle ${album.title}`}
                  >
                    <Shuffle className="w-3.5 h-3.5 text-sky-300" />
                  </button>
                </div>

                {/* Track count watermark */}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-zinc-300 tabular-nums">
                  {album.tracks.length} {album.tracks.length === 1 ? 'track' : 'tracks'}
                </div>
              </div>

              {/* Title & Artist */}
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate font-ui-title leading-tight">
                  {album.title}
                </h3>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-ui-meta">
                  {album.artist}
                </p>
                {album.year && (
                  <p className="text-[10px] font-mono text-zinc-500 mt-1">
                    {album.year}
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="p-10 sm:p-16 rounded-2xl aura-glass-ambient border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-500">
            <Disc className="w-6 h-6 text-zinc-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">No albums found</h3>
          <p className="text-xs text-zinc-400 max-w-sm font-ui-meta">
            {searchQuery 
              ? `No albums match your search query "${searchQuery}".` 
              : 'Albums are automatically formed when you import audio tracks with album metadata.'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-semibold shadow cursor-pointer"
              >
                Clear Search
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold shadow cursor-pointer"
              >
                Import Music Files
              </button>
            )}
          </div>
        </div>
      )}

      {playlistModalTrack && (
        <AddToPlaylistModal
          track={playlistModalTrack}
          isOpen={Boolean(playlistModalTrack)}
          onClose={() => setPlaylistModalTrack(null)}
        />
      )}

    </div>
  );
};
