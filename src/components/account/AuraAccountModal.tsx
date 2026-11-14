import React, { useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionBackdrop, MotionModal } from '../common/motion/MotionSurface';
import { useMusic } from '../../context/MusicContext';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import { 
  User, 
  X, 
  Download, 
  Upload, 
  CheckCircle2, 
  HardDrive,
  Lock
} from 'lucide-react';
import { AuraUserAccount } from '../../types';

interface AuraAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuraAccountModal: React.FC<AuraAccountModalProps> = ({ isOpen, onClose }) => {
  const {
    playlists,
    userPresets,
    markers,
    moments,
    importStudioBackup,
    showToast,
  } = useMusic();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useDialogAccessibility<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const [account, setAccount] = useState<AuraUserAccount>(() => {
    const saved = localStorage.getItem('aura_user_account');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      id: 'usr-local-audiophile',
      username: 'audiophile',
      displayName: 'Aura Listener',
      isSignedIn: false,
      syncEnabled: false,
    };
  });

  const [displayName, setDisplayName] = useState(account.displayName);
  const [email, setEmail] = useState(account.email || '');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AuraUserAccount = {
      ...account,
      displayName: displayName.trim() || 'Aura Listener',
      email: email.trim() || undefined,
      isSignedIn: true,
      syncEnabled: false,
      lastSyncedAt: Date.now(),
    };
    setAccount(updated);
    localStorage.setItem('aura_user_account', JSON.stringify(updated));
    showToast('Local AURA Studio profile saved on this device', 'success');
  };

  const handleExportBackup = () => {
    const backupData = {
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      account,
      playlists,
      userPresets,
      markers,
      moments,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-studio-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('AURA Studio JSON backup downloaded', 'success');
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') {
        showToast('Invalid AURA Studio backup file.', 'error');
        return;
      }
      if (parsed.account && typeof parsed.account === 'object') {
        const nextAccount: AuraUserAccount = {
          ...account,
          displayName: typeof parsed.account.displayName === 'string' ? parsed.account.displayName : account.displayName,
          email: typeof parsed.account.email === 'string' ? parsed.account.email : account.email,
        };
        setAccount(nextAccount);
        setDisplayName(nextAccount.displayName);
        setEmail(nextAccount.email || '');
        localStorage.setItem('aura_user_account', JSON.stringify(nextAccount));
      }
      const res = await importStudioBackup(parsed);
      const total = res.playlistsCount + res.presetsCount + res.markersCount + res.momentsCount;
      if (total > 0) {
        showToast(
          `Restored ${res.playlistsCount} spaces, ${res.presetsCount} presets, ${res.markersCount} markers, ${res.momentsCount} moments`,
          'success'
        );
      } else {
        showToast('Backup imported (no new items found).', 'info');
      }
    } catch {
      showToast('Failed to parse AURA Studio JSON backup.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <MotionBackdrop
          onClick={onClose}
          style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 select-none"
        >
          <MotionModal
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="AURA Profile and Local Backup"
            variant="center"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl bg-[#0c0e15] border border-white/10 shadow-2xl p-6 flex flex-col gap-6"
          >
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AURA Profile & Local Backup</h3>
              <p className="text-xs text-zinc-400">Personalize your device profile & export/import JSON backups</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile dialog"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer aura-pressable aura-focus-ring"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {(displayName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Listener Name"
                aria-label="Listener Name"
                className="w-full bg-transparent font-bold text-white text-sm focus:outline-none border-b border-transparent focus:border-indigo-500 py-0.5"
              />
              <p className="text-[11px] text-zinc-400 font-mono">On-Device Studio Profile</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="aura-profile-email" className="text-xs font-semibold text-zinc-300">
              Contact Label (Optional, Stored Locally)
            </label>
            <input
              id="aura-profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="listener@aura.audio"
              className="p-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer aura-pressable aura-focus-ring"
          >
            Save Local Profile
          </button>
        </form>

        {/* Included in JSON Backup */}
        <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-zinc-950/80 border border-white/5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>Included in Local JSON Studio Backup:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-zinc-400 text-[11px]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{playlists.length} Playlists & Spaces</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{userPresets.length} EQ & DSP Presets</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{markers.length} Waveform Markers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{moments.length} AURA Moments</span>
            </div>
          </div>
        </div>

        {/* Local Storage Privacy Guarantee */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-zinc-300">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-zinc-400">
            <strong className="text-emerald-300">100% On-Device Storage:</strong> Your profile, presets, and local audio files are never uploaded to any cloud server. Use JSON export/import to move settings between browsers.
          </p>
        </div>

        {/* Backup & Restore JSON */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs border border-white/5 transition-colors cursor-pointer aura-pressable aura-focus-ring"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              Export Backup (JSON)
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs border border-white/5 transition-colors cursor-pointer aura-pressable aura-focus-ring"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              Import Backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </div>

          <span className="text-[10px] font-mono text-zinc-500">v3.0 Local</span>
        </div>

          </MotionModal>
        </MotionBackdrop>
      )}
    </AnimatePresence>
  );
};
