import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { LibraryNav } from '../library/LibraryNav';
import { TrackRow } from '../library/TrackRow';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import { MotionFadeSlide } from '../common/motion/MotionSurface';
import { useMotionCapabilities } from '../../motion/useMotionCapabilities';
import { 
  User, 
  Play, 
  ArrowLeft, 
  Disc, 
  Shuffle, 
  ListPlus, 
  Search, 
  X, 
  Clock, 
  Music,
  Plus,
  ArrowUpDown
} from 'lucide-react';

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
    addToQueue,
    setIsUploadModalOpen,
  } = useMusic();

  const { canHover } = useMotionCapabilities();
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'tracks' | 'albums' | 'recent'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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

      if (!artist.tracks.some((t) => t.id === track.id)) {
        artist.tracks.push(track);
        artist.totalDuration += track.duration || 0;
        if (track.dateAdded && track.dateAdded > artist.latestDateAdded) {
          artist.latestDateAdded = track.dateAdded;
        }

        const rawAlbum = (track.album || '').trim();
        const normAlbum = rawAlbum.toLowerCase();
        const isGeneric = !rawAlbum || GENERIC_ALBUM_NAMES.has(normAlbum);
        const albumKey = isGeneric ? 'singles_and_other' : `album:::${normAlbum}`;
        const albumTitle = isGeneric ? 'Singles & Other Releases' : rawAlbum;

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
          if (!existingAlbum.tracks.some((t) => t.id === track.id)) {
            existingAlbum.tracks.push(track);
            if (!existingAlbum.coverUrl && track.coverUrl) {
              existingAlbum.coverUrl = track.coverUrl;
            }
          }
        }
      }
    });

    return map;
  }, [tracks]);

  const artistList = useMemo(() => Object.values(artistsMap), [artistsMap]);

  // Filtered and sorted artists
  const displayedArtists = useMemo(() => {
    let list = [...artistList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      let comp = 0;
      switch (sortBy) {
        case 'name':
          comp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          break;
        case 'tracks':
          comp = a.tracks.length - b.tracks.length;
          break;
        case 'albums':
          comp = a.albums.length - b.albums.length;
          break;
        case 'recent':
        default:
          comp = a.latestDateAdded - b.latestDateAdded;
          break;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

    return list;
  }, [artistList, searchQuery, sortBy, sortOrder]);

  const activeArtist = selectedArtistId ? artistsMap[selectedArtistId] : null;

  const handlePlayArtist = (artist: ArtistInfo, shuffle = false) => {
    if (!artist.tracks || artist.tracks.length === 0) return;
    const queue = shuffle ? [...artist.tracks].sort(() => Math.random() - 0.5) : artist.tracks;
    playTrack(queue[0], queue);
  };

  const handleAddArtistToQueue = (artist: ArtistInfo) => {
    artist.tracks.forEach((t) => addToQueue(t));
  };

  const representativeActiveCover = activeArtist?.tracks.find((t) => t.coverUrl)?.coverUrl;

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {activeArtist ? (
          <MotionFadeSlide
            key={`artist-detail:${activeArtist.id}`}
            direction="up"
            distance={8}
            duration="standard"
            className="flex flex-col gap-6 sm:gap-8 p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto select-none pb-36 sm:pb-44"
          >
            {/* Navigation Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedArtistId(null)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer aura-pressable"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Artists</span>
              </button>
            </div>

            {/* Large Artist Header */}
            <section className="relative overflow-hidden rounded-3xl aura-glass-island p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
              {/* Avatar / Cover */}
              <div className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden shrink-0 bg-zinc-900 border-2 border-white/15 shadow-2xl">
                {representativeActiveCover ? (
                  <img
                    src={representativeActiveCover}
                    alt={activeArtist.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${getArtistGradient(activeArtist.name)} flex items-center justify-center text-white font-bold text-4xl`}>
                    {activeArtist.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 text-center md:text-left">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 inline-block mb-2">
                  ARTIST COLLECTION
                </span>

                <h1 className="text-2xl sm:text-4xl font-page-title text-white tracking-tight line-clamp-2">
                  {activeArtist.name}
                </h1>

                <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-xs sm:text-sm text-zinc-300 font-ui-meta">
                  <span>{activeArtist.tracks.length} tracks in library</span>
                  <span className="text-zinc-600" aria-hidden="true">·</span>
                  <span>{activeArtist.albums.length} releases</span>
                  <span className="text-zinc-600" aria-hidden="true">·</span>
                  <span className="font-mono text-zinc-400">{formatDuration(activeArtist.totalDuration)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center md:justify-start gap-2.5 mt-5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handlePlayArtist(activeArtist, false)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-colors cursor-pointer aura-focus-ring aura-pressable"
                  >
                    <Play className="w-4 h-4 fill-current text-black translate-x-0.2" />
                    <span>Play All</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlayArtist(activeArtist, true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer aura-focus-ring aura-pressable"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-sky-400" />
                    <span>Shuffle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddArtistToQueue(activeArtist)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer aura-focus-ring aura-pressable"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Add to Queue</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Artist Albums in Collection */}
            {activeArtist.albums.length > 0 && (
              <section className="flex flex-col gap-3">
                <h3 className="text-base font-bold text-white font-ui-title">Releases in Library</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {activeArtist.albums.map((album) => (
                    <div
                      key={album.id}
                      onClick={() => handlePlayArtist({ ...activeArtist, tracks: album.tracks }, false)}
                      className="group relative flex flex-col p-3 rounded-2xl aura-glass-ambient hover:border-white/20 transition-colors cursor-pointer shadow-md aura-hover-scale aura-pressable-subtle"
                    >
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10 mb-2">
                        {album.coverUrl ? (
                          <img src={album.coverUrl} alt={album.title} className={`w-full h-full object-cover transition-transform ${canHover ? 'group-hover:scale-105' : ''}`} />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <Disc className="w-8 h-8 text-white/40" />
                          </div>
                        )}
                        <div className={`absolute inset-0 bg-black/40 opacity-0 flex items-center justify-center transition-opacity ${canHover ? 'group-hover:opacity-100' : 'pointer-events-none'}`}>
                          <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                            <Play className="w-3.5 h-3.5 fill-current translate-x-0.2" />
                          </div>
                        </div>
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate">{album.title}</h4>
                      <p className="text-[11px] text-zinc-400">{album.tracks.length} tracks</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Artist All Tracks */}
            <section className="flex flex-col rounded-2xl aura-glass-ambient border border-white/10 overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-ui-title">All Tracks ({activeArtist.tracks.length})</h3>
                <span className="text-xs font-mono text-zinc-400">{formatDuration(activeArtist.totalDuration)}</span>
              </div>

              <div className="divide-y divide-white/[0.03] p-1.5">
                {activeArtist.tracks.map((track, i) => (
                  <TrackRow
                    key={`artist-track-${track.id}`}
                    track={track}
                    index={i + 1}
                    playlistContext={activeArtist.tracks}
                    onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
                  />
                ))}
              </div>
            </section>
          </MotionFadeSlide>
        ) : (
          <MotionFadeSlide
            key="artist-grid"
            direction="up"
            distance={6}
            duration="micro"
            className="flex flex-col gap-6 sm:gap-8 p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto select-none pb-36 sm:pb-44"
          >
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div>
                <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-zinc-400">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span className="uppercase tracking-wider text-[11px] font-semibold text-amber-400">Artist Catalogue</span>
                  <span className="text-zinc-600" aria-hidden="true">·</span>
                  <span>{artistList.length} artists in collection</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-page-title text-white tracking-tight">
                  Artists
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-ui-meta">
                  Discover creators and performers across your local vault and connected streaming libraries.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-colors cursor-pointer aura-focus-ring aura-pressable"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Import Music</span>
                </button>
              </div>
            </section>

      {/* Library Navigation */}
      <LibraryNav activeView="artists" />

      {/* Filter & Sort Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artists by name..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-all font-ui-title"
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
              <option value="name" className="bg-[#12141c] text-white">Artist Name</option>
              <option value="tracks" className="bg-[#12141c] text-white">Track Count</option>
              <option value="albums" className="bg-[#12141c] text-white">Albums</option>
              <option value="recent" className="bg-[#12141c] text-white">Recently Added</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="hover:text-white px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 cursor-pointer"
            >
              {sortOrder}
            </button>
          </div>
        </div>
      </section>

      {/* Artists Grid */}
      {displayedArtists.length > 0 ? (
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {displayedArtists.map((artist) => {
            const representativeCover = artist.tracks.find((t) => t.coverUrl)?.coverUrl;

            return (
              <div
                key={artist.id}
                onClick={() => setSelectedArtistId(artist.id)}
                className="group relative flex flex-col items-center p-4 rounded-2xl aura-glass-ambient hover:border-white/20 transition-colors cursor-pointer select-none shadow-md text-center aura-hover-scale aura-pressable-subtle"
              >
                {/* Circular Portrait Avatar */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-zinc-900 border-2 border-white/10 shadow-md mb-3">
                  {representativeCover ? (
                    <img
                      src={representativeCover}
                      alt={artist.name}
                      className={`w-full h-full object-cover transition-transform duration-500 ${canHover ? 'group-hover:scale-105' : ''}`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${getArtistGradient(artist.name)} flex items-center justify-center text-white font-bold text-2xl`}>
                      {artist.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div className={`absolute inset-0 bg-black/40 opacity-0 flex items-center justify-center transition-opacity duration-200 ${canHover ? 'group-hover:opacity-100' : 'pointer-events-none'}`}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayArtist(artist, false);
                      }}
                      className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl aura-hover-scale aura-pressable cursor-pointer"
                      title={`Play ${artist.name}`}
                    >
                      <Play className="w-4 h-4 fill-current text-black translate-x-0.2" />
                    </button>
                  </div>
                </div>

                {/* Name & Counts */}
                <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-amber-300 transition-colors truncate w-full font-ui-title leading-tight">
                  {artist.name}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1 font-ui-meta">
                  {artist.tracks.length} {artist.tracks.length === 1 ? 'track' : 'tracks'}
                  {artist.albums.length > 0 && ` · ${artist.albums.length} ${artist.albums.length === 1 ? 'release' : 'releases'}`}
                </p>
              </div>
            );
          })}
        </section>
      ) : (
        <div className="p-10 sm:p-16 rounded-2xl aura-glass-ambient border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-500">
            <User className="w-6 h-6 text-zinc-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">No artists found</h3>
          <p className="text-xs text-zinc-400 max-w-sm font-ui-meta">
            {searchQuery 
              ? `No artists match your search query "${searchQuery}".` 
              : 'Artists are automatically catalogued from your imported audio track metadata.'}
          </p>
        </div>
      )}
          </MotionFadeSlide>
        )}
      </AnimatePresence>

      <AddToPlaylistModal
        track={playlistModalTrack}
        isOpen={Boolean(playlistModalTrack)}
        onClose={() => setPlaylistModalTrack(null)}
      />
    </>
  );
};
