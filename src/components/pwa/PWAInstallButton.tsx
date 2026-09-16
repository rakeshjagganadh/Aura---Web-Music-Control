import React from 'react';
import { Download, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  canInstall: boolean;
  isInstalled: boolean;
  onInstall: () => void;
  variant?: 'compact' | 'badge' | 'full';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  canInstall,
  isInstalled,
  onInstall,
  variant = 'compact',
  className = '',
}) => {
  // If already installed, never show install triggers
  if (isInstalled || !canInstall) {
    return null;
  }

  if (variant === 'badge') {
    return (
      <button
        type="button"
        onClick={onInstall}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-medium transition-all active:scale-95 cursor-pointer ${className}`}
        title="Install AURA Studio on your device"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={onInstall}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm ${className}`}
      >
        <Smartphone className="w-4 h-4" />
        <span>Install AURA Application</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onInstall}
      className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-200 text-xs font-medium transition-colors cursor-pointer ${className}`}
      title="Install AURA Studio as standalone PWA"
    >
      <Download className="w-3.5 h-3.5 text-zinc-400" />
      <span>Install App</span>
    </button>
  );
};
