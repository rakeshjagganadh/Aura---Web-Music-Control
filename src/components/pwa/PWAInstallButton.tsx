import React from 'react';
import { AuraIcon } from '../ui/AuraIcon';

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
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-medium transition-colors aura-pressable aura-focus-ring cursor-pointer ${className}`}
        title="Install AURA Studio on your device"
      >
        <AuraIcon name="download" size={14} />
        <span>Install App</span>
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={onInstall}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-colors aura-pressable aura-focus-ring cursor-pointer shadow-sm ${className}`}
      >
        <AuraIcon name="smartphone" size={16} />
        <span>Install AURA Application</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onInstall}
      className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-200 text-xs font-medium transition-colors aura-pressable aura-focus-ring cursor-pointer ${className}`}
      title="Install AURA Studio as standalone PWA"
    >
      <AuraIcon name="download" size={14} className="text-zinc-400" />
      <span>Install App</span>
    </button>
  );
};
