import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { Disc, Play, ArrowLeft, LayoutGrid, List } from 'lucide-react';
import { SongObjectCard } from '../common/SongObjectCard';

interface AlbumInfo {
  title: string;
  artist: string;
  coverUrl?: string;
  coverColor?: string;
  tracks: Track[];
}

export const AlbumsView: React.FC = () => {
  const { tracks, playTrack } = useMusic();
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'row' | 'grid'>('row');

  // Group tracks by album
  const albumsMap: Record<string, AlbumInfo> = tracks.reduce((acc: Record<string, AlbumInfo>, track) => {
    const albumName = track.album || 'Unknown Album';
    if (!acc[albumName]) {
      acc[albumName] = {
        title: albumName,
        artist: track.artist,
        coverUrl: track.coverUrl,
        coverColor: track.coverColor,
        tracks: [],
      };
    }
    acc[albumName].tracks.push(track);
    return acc;
  }, {});

  const albumsList: AlbumInfo[] = Object.values(albumsMap);

  if (selectedAlbum && albumsMap[selectedAlbum]) {
    const album = albumsMap[selectedAlbum];
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto select-none">
        <button
          onClick={() => setSelectedAlbum(null)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Albums
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-[#0b0d13]/70 border border-white/[0.08] backdrop-blur-2xl shadow-xl">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-2xl bg-[#0e1017] shrink-0 border border-white/10">
            {album.coverUrl ? (
              <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${album.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center`}>
                <Disc className="w-14 h-14 text-white/70" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 text-center sm:text-left">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">Album</span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">{album.title}</h1>
            <p className="text-xs text-zinc-400">{album.artist} • {album.tracks.length} tracks</p>

            <button
              onClick={() => playTrack(album.tracks[0], album.tracks)}
              className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold w-fit mx-auto sm:mx-0 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Play Album
            </button>
          </div>
        </div>

        {/* Tracks List */}
        <div className="divide-y divide-white/[0.04] rounded-2xl bg-[#0b0d13]/60 border border-white/5 overflow-hidden p-2">
          {album.tracks.map((track, i) => (
            <SongObjectCard
              key={track.id}
              track={track}
              playlistContext={album.tracks}
              variant="row"
              showIndex={i + 1}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto select-none">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Albums</h1>
        <p className="text-xs text-zinc-400 mt-0.5">{albumsList.length} albums in your collection</p>
      </div>

      {albumsList.length === 0 ? (
        <div className="text-center py-16 text-xs text-zinc-500">
          No albums available. Upload some songs to populate your albums!
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {albumsList.map((album) => (
            <div
              key={album.title}
              onClick={() => setSelectedAlbum(album.title)}
              className="group cursor-pointer flex flex-col gap-2.5 p-3 rounded-2xl bg-[#0b0d13]/60 hover:bg-[#12151f] border border-white/5 hover:border-white/10 transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0e1017] border border-white/10 shadow-md">
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${album.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center`}>
                    <Disc className="w-10 h-10 text-white/70" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play className="w-6 h-6 text-white fill-current" />
                </div>
              </div>

              <div className="px-0.5">
                <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                  {album.title}
                </h4>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">{album.artist}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
