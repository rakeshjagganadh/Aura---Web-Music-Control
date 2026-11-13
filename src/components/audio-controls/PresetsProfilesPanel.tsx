import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionFadeSlide } from '../common/motion/MotionSurface';
import { useMusic } from '../../context/MusicContext';
import { ListeningDeviceType, UserPreset } from '../../types';
import { 
  Bookmark, 
  Trash2, 
  Copy, 
  Check, 
  Headphones, 
  Speaker, 
  Car, 
  Laptop, 
  Sparkles, 
  Music, 
  Download, 
  Upload,
  Layers,
  Plus
} from 'lucide-react';

const DEVICE_TEMPLATES: {
  type: ListeningDeviceType;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  { type: 'earbuds', label: 'AirPods / In-Ear', desc: 'Slight mid clarity lift and sub warmth compensation', icon: <Headphones className="w-4 h-4" /> },
  { type: 'speakers', label: 'Studio Monitors', desc: 'Flat acoustic curve with transparent dynamics', icon: <Speaker className="w-4 h-4" /> },
  { type: 'car', label: 'Car Stereo', desc: 'Road noise compensation with punchy bass boost', icon: <Car className="w-4 h-4" /> },
  { type: 'headphones', label: 'Over-Ear Headphones', desc: 'Extended soundstage width and high-end air', icon: <Headphones className="w-4 h-4" /> },
  { type: 'bluetooth', label: 'Bluetooth Portable', desc: 'Midrange speech clarity and bass punch tuning', icon: <Laptop className="w-4 h-4" /> },
];

export const PresetsProfilesPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const {
    userPresets,
    saveCurrentAsPreset,
    applyPresetSnapshot,
    deleteUserPreset,
    useSongProfiles,
    toggleUseSongProfiles,
    hasSongProfile,
    saveCurrentAsSongProfile,
    clearSongProfile,
    currentTrack,
    hasCopiedSettings,
    copyCurrentSettings,
    pasteSettings,
    showToast
  } = useMusic();

  const [newPresetName, setNewPresetName] = useState('');
  const [isAddingPreset, setIsAddingPreset] = useState(false);

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    await saveCurrentAsPreset(newPresetName.trim(), 'custom');
    setNewPresetName('');
    setIsAddingPreset(false);
  };

  const exportPresetsJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(userPresets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aura_audio_presets_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Presets exported to JSON', 'success');
  };

  const importPresetsJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.name && item.settings) {
              await saveCurrentAsPreset(item.name, item.category || 'custom');
            }
          }
          showToast(`Successfully imported presets!`, 'success');
        }
      } catch {
        showToast('Invalid JSON preset file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/30">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Presets, Profiles & Device Calibration</h3>
            <p className="text-[11px] text-zinc-400">
              Manage custom DSP presets, link settings per song, and calibrate for specific listening hardware.
            </p>
          </div>
        </div>

        {/* Copy / Paste Settings Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyCurrentSettings}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-white/10 transition-colors cursor-pointer aura-pressable aura-focus-ring"
          >
            <Copy className="w-3.5 h-3.5 text-violet-400" />
            Copy Studio Settings
          </button>

          <button
            type="button"
            onClick={pasteSettings}
            disabled={!hasCopiedSettings}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-white/10 transition-colors cursor-pointer aura-pressable aura-focus-ring"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Paste Settings
          </button>
        </div>
      </div>

      {/* Section 1: Per-Song Audio Profile */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-violet-400" />
            <div>
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Per-Song Audio Profile</span>
              <span className="text-[10px] text-zinc-400 block">
                Automatically load customized EQ, dynamics, and spatial settings when this specific song plays.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleUseSongProfiles}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer aura-pressable aura-focus-ring ${
              useSongProfiles
                ? 'bg-violet-500/25 text-violet-300 border border-violet-500/40'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {useSongProfiles ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        {currentTrack ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-zinc-100 truncate block">{currentTrack.title}</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {hasSongProfile ? 'Custom Song Audio Profile is ACTIVE' : 'Currently using Global Session Settings'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={saveCurrentAsSongProfile}
                className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer aura-pressable aura-focus-ring"
              >
                Save for this Song
              </button>
              {hasSongProfile && (
                <button
                  type="button"
                  onClick={clearSongProfile}
                  className="px-2.5 py-1 text-zinc-400 hover:text-rose-400 text-xs font-medium transition-colors cursor-pointer aura-pressable aura-focus-ring rounded-lg"
                >
                  Clear Song Override
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic">Play a track to configure its custom audio profile.</p>
        )}
      </div>

      {/* Section 2: Listening Device Calibration Profiles */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
            Listening Device Calibration Profiles
          </span>
          <span className="text-[10px] text-zinc-500">Acoustic target curves</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DEVICE_TEMPLATES.map((dev) => (
            <button
              key={dev.type}
              type="button"
              onClick={() => {
                // Apply a device-optimized target curve
                if (dev.type === 'earbuds') {
                  applyPresetSnapshot({
                    name: dev.label,
                    eqGains: [2, 1, 0, 0, 1.5, 2, 2, 2.5, 3, 2],
                    bass: 1,
                    treble: 1.5,
                  }, dev.label);
                } else if (dev.type === 'speakers') {
                  applyPresetSnapshot({
                    name: dev.label,
                    eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    bass: 0,
                    treble: 0,
                  }, dev.label);
                } else if (dev.type === 'car') {
                  applyPresetSnapshot({
                    name: dev.label,
                    eqGains: [5, 4, 3, 1, 0, 1, 2, 3, 3, 2],
                    bass: 4,
                    treble: 2,
                  }, dev.label);
                } else if (dev.type === 'bluetooth') {
                  applyPresetSnapshot({
                    name: dev.label,
                    eqGains: [-2, 0, 1, 2, 3, 2, 2, 1, 0, -1],
                    bass: 1,
                    treble: 1,
                  }, dev.label);
                } else {
                  applyPresetSnapshot({
                    name: dev.label,
                    eqGains: [1, 1, 0, 0, 0, 1, 1.5, 2, 3, 3],
                    bass: 1,
                    treble: 2,
                  }, dev.label);
                }
              }}
              className="p-3 rounded-xl bg-zinc-950/60 hover:bg-zinc-900 border border-white/5 text-left flex flex-col gap-1.5 transition-colors group cursor-pointer aura-pressable-subtle aura-focus-ring"
            >
              <div className="flex items-center gap-2 text-zinc-300 group-hover:text-white">
                <span className="text-violet-400">{dev.icon}</span>
                <span className="text-xs font-semibold">{dev.label}</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-snug">{dev.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Section 3: Custom User Presets List & Management */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
              Saved User Presets ({userPresets.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Import / Export buttons */}
            <label className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-950 rounded-lg border border-white/5 cursor-pointer transition-colors">
              <Upload className="w-3 h-3" />
              Import
              <input type="file" accept=".json" onChange={importPresetsJSON} className="hidden" />
            </label>

            {userPresets.length > 0 && (
              <button
                type="button"
                onClick={exportPresetsJSON}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-950 rounded-lg border border-white/5 transition-colors cursor-pointer aura-pressable aura-focus-ring"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddingPreset(!isAddingPreset)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors cursor-pointer aura-pressable aura-focus-ring"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Preset
            </button>
          </div>
        </div>

        {/* Add Preset Form */}
        <AnimatePresence initial={false}>
          {isAddingPreset && (
            <MotionFadeSlide key="add-preset-form" direction="down" distance={6} duration="micro">
              <form onSubmit={handleSavePreset} className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950 border border-violet-500/30">
                <input
                  type="text"
                  placeholder="Preset Name (e.g. Midnight Lo-Fi, Acoustic Warmth)..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newPresetName.trim()}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer aura-pressable aura-focus-ring"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingPreset(false)}
                  className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer aura-pressable aura-focus-ring rounded-lg"
                >
                  Cancel
                </button>
              </form>
            </MotionFadeSlide>
          )}
        </AnimatePresence>

        {/* Presets List */}
        {userPresets.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-2">
            No custom user presets saved yet. Create a preset to store your favorite EQ, dynamics, and spatial acoustics combinations.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {userPresets.map((preset) => (
              <div
                key={preset.id}
                className="p-3 rounded-xl bg-zinc-950/80 border border-white/5 flex items-center justify-between gap-2 hover:border-violet-500/30 transition-colors group"
              >
                <button
                  type="button"
                  onClick={() => applyPresetSnapshot(preset.settings, preset.name)}
                  className="flex-1 text-left min-w-0 cursor-pointer aura-focus-ring rounded"
                >
                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-violet-300 truncate block">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(preset.createdAt).toLocaleDateString()}
                  </span>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => applyPresetSnapshot(preset.settings, preset.name)}
                    className="px-2 py-0.5 text-[11px] font-medium bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 rounded-md transition-colors cursor-pointer aura-pressable aura-focus-ring"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteUserPreset(preset.id)}
                    title="Delete preset"
                    aria-label={`Delete preset ${preset.name}`}
                    className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer aura-pressable aura-focus-ring rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
