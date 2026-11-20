import React from 'react';
import { Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  readonly isPWAInstallable: boolean;
  readonly isPWAInstalled: boolean;
  readonly isIOSDevice: boolean;
  readonly onInstallPWA: () => void;
  readonly onOpenIOSGuide: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  isPWAInstallable,
  isPWAInstalled,
  isIOSDevice,
  onInstallPWA,
  onOpenIOSGuide,
}) => {
  if (isPWAInstalled) {
    return null;
  }

  if (isPWAInstallable) {
    return (
      <button
        type="button"
        onClick={onInstallPWA}
        className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A5F] px-3 py-1.5 text-xs font-medium text-[#FCFBF8] hover:bg-[#162C49] transition-colors whitespace-nowrap shrink-0"
      >
        <Smartphone className="h-3.5 w-3.5" />
        Instalar App
      </button>
    );
  }

  if (isIOSDevice) {
    return (
      <button
        type="button"
        onClick={onOpenIOSGuide}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#D6D3C9] px-2.5 py-1.5 text-xs font-medium text-[#44403C] hover:bg-[#ECE9DF] transition-colors whitespace-nowrap shrink-0"
      >
        <Smartphone className="h-3.5 w-3.5" />
        Instalar iOS
      </button>
    );
  }

  return null;
};
