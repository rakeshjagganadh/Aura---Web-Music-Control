import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { User, Play, Music, ArrowLeft } from 'lucide-react';

interface ArtistInfo {
  name: string;
  tracks: Track[];
}

export const ArtistsView: React.FC = () => {
  const { tracks, playTrack } = useMusic();
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // Group tracks by artist
  const artistsMap: Record<string, ArtistInfo> = tracks.reduce((acc: Record<string, ArtistInfo>, track) => {
    const artistName = track.artist || 'Unknown Artist';
    if (!acc[artistName]) {
      acc[artistName] = {
        name: artistName,
        tracks: [],
      };
    }
    acc[artistName].tracks.push(track);
    return acc;
  }, {});

  const artistsList: ArtistInfo[] = Object.values(artistsMap);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (selectedArtist && artistsMap[selectedArtist]) {
    const artist = artistsMap[selectedArtist];
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto">
        <button
          onClick={() => setSelectedArtist(null)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Artists
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-zinc-900/40 border border-white/5">
          <div className="w-28 h-28 rounded-full overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-500 to-purple-800 flex items-center justify-center shrink-0 border border-white/10 text-white font-bold text-3xl">
            {artist.name.charAt(0)}
          </div>

          <div className="flex flex-col gap-1 text-center sm:text-left">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">Artist</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{artist.name}</h1>
            <p className="text-xs text-zinc-400">{artist.tracks.length} {artist.tracks.length === 1 ? 'track' : 'tracks'}</p>

            <button
              onClick={() => playTrack(artist.tracks[0], artist.tracks)}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold w-fit mx-auto sm:mx-0 shadow-md shadow-indigo-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Play Artist
            </button>
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex flex-col divide-y divide-white/5 rounded-2xl bg-zinc-900/30 border border-white/5">
          {artist.tracks.map((track, i) => (
            <div
              key={track.id}
              onClick={() => playTrack(track, artist.tracks)}
              className="group flex items-center justify-between p-3 px-4 hover:bg-zinc-900/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-zinc-500 w-5">{i + 1}</span>
                <span className="text-xs font-medium text-zinc-200 truncate group-hover:text-indigo-300">
                  {track.title}
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-500">{formatTime(track.duration)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Artists</h1>
        <p className="text-xs text-zinc-400 mt-0.5">{artistsList.length} artists in your library</p>
      </div>

      {artistsList.length === 0 ? (
        <div className="text-center py-16 text-xs text-zinc-500">
          No artists available yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {artistsList.map((artist) => (
            <div
              key={artist.name}
              onClick={() => setSelectedArtist(artist.name)}
              className="group cursor-pointer flex flex-col items-center text-center gap-3 p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5 transition-all"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600/60 to-purple-800/60 flex items-center justify-center text-white font-bold text-2xl border border-white/10 group-hover:scale-105 transition-transform shadow-lg">
                {artist.name.charAt(0)}
              </div>
              <div className="min-w-0 w-full">
                <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-indigo-300">
                  {artist.name}
                </h4>
                <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  {artist.tracks.length} tracks
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
