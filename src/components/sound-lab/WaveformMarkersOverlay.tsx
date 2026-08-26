import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { formatSeconds } from '../../utils/formatTime';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Play, 
  Flag, 
  Tag, 
  Sparkles,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { MarkerType, WaveformMarker } from '../../types';

export const WaveformMarkersOverlay: React.FC = () => {
  const {
    currentTrack,
    currentTime,
    duration,
    markers,
    addMarker,
    jumpToMarker,
    deleteMarker,
    updateMarker,
  } = useMusic();

  const [markerLabel, setMarkerLabel] = useState('');
  const [markerType, setMarkerType] = useState<MarkerType>('custom');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const markerTypes: { type: MarkerType; label: string; color: string }[] = [
    { type: 'custom', label: 'Marker', color: '#06b6d4' },
    { type: 'intro', label: 'Intro', color: '#3b82f6' },
    { type: 'chorus', label: 'Chorus', color: '#ec4899' },
    { type: 'drop', label: 'Drop / Climax', color: '#eab308' },
    { type: 'solo', label: 'Solo / Riff', color: '#a855f7' },
    { type: 'favorite', label: 'Favorite Section', color: '#10b981' },
  ];

  const handleAddMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTrack) return;
    const activeTypeObj = markerTypes.find((m) => m.type === markerType);
    const label = markerLabel.trim() || `${activeTypeObj?.label || 'Marker'} (${formatSeconds(currentTime)})`;
    addMarker(currentTime, label, markerType, activeTypeObj?.color || '#06b6d4');
    setMarkerLabel('');
  };

  const handleStartEdit = (marker: WaveformMarker) => {
    setEditingId(marker.id);
    setEditLabel(marker.label);
  };

  const handleSaveEdit = (id: string) => {
    if (editLabel.trim()) {
      updateMarker(id, editLabel.trim());
    }
    setEditingId(null);
  };

  return (
    <div id="waveform-markers-overlay" className="flex flex-col gap-6 p-6 rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Flag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Cue Points & Waveform Markers</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tag song sections (Intro, Chorus, Drop, Solo) to quickly seek and analyze arrangement.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-pink-300 bg-pink-950/40 px-3 py-1 rounded-xl border border-pink-800/30 self-start sm:self-auto">
          {markers.length} Cue Points
        </span>
      </div>

      {/* Add Marker Form */}
      <form onSubmit={handleAddMarker} className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-950/70 border border-white/5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400">Marker Tag:</span>
          {markerTypes.map((t) => (
            <button
              type="button"
              key={t.type}
              onClick={() => setMarkerType(t.type)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all border ${
                markerType === t.type
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-zinc-200'
              }`}
              style={{
                borderColor: markerType === t.type ? t.color : undefined,
                color: markerType === t.type ? t.color : undefined,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            placeholder={`Add marker label (defaults to "${markerTypes.find((m) => m.type === markerType)?.label} at ${formatSeconds(currentTime)}")`}
            value={markerLabel}
            onChange={(e) => setMarkerLabel(e.target.value)}
            disabled={!currentTrack}
            className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!currentTrack}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-pink-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Cue at {formatSeconds(currentTime)}
          </button>
        </div>
      </form>

      {/* Markers Timeline List */}
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
        {markers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-zinc-950/30 border border-dashed border-white/10 text-center">
            <Flag className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-xs font-medium text-zinc-400">No cue points set for this track</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Add markers during playback to pinpoint drops, solos, and choruses!
            </p>
          </div>
        ) : (
          markers.map((marker) => {
            const isEditing = editingId === marker.id;
            return (
              <div
                key={marker.id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-950/60 border border-white/5 hover:border-pink-500/30 hover:bg-zinc-950 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => jumpToMarker(marker)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                    style={{
                      backgroundColor: `${marker.color || '#ec4899'}25`,
                      color: marker.color || '#ec4899',
                    }}
                    title="Jump to cue point"
                  >
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  </button>

                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="text-xs font-mono font-bold px-2 py-0.5 rounded border flex-shrink-0"
                      style={{
                        backgroundColor: `${marker.color || '#ec4899'}15`,
                        borderColor: `${marker.color || '#ec4899'}40`,
                        color: marker.color || '#ec4899',
                      }}
                    >
                      {formatSeconds(marker.time)}
                    </span>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="flex-1 bg-zinc-900 border border-pink-500/50 rounded-lg px-2 py-1 text-xs text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(marker.id)}
                          className="p-1 rounded-lg bg-pink-600 text-white hover:bg-pink-500"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-white truncate">{marker.label}</span>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleStartEdit(marker)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
                      title="Edit label"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMarker(marker.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition-colors"
                      title="Delete marker"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
