import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConflictBannerProps {
  readonly onResolveLocal: () => void;
  readonly onResolveRemote: () => void;
}

export const ConflictBanner: React.FC<ConflictBannerProps> = ({
  onResolveLocal,
  onResolveRemote,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#FECACA] bg-[#FEF2F2] px-6 py-2.5 text-xs text-[#991B1B]">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Conflicto detectado con la versión remota de este manuscrito.</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onResolveLocal}
          className="rounded border border-[#DC2626]/30 bg-white px-2.5 py-1 font-medium text-[#991B1B] hover:bg-[#FEE2E2] transition-colors whitespace-nowrap shrink-0"
        >
          Conservar local
        </button>
        <button
          type="button"
          onClick={onResolveRemote}
          className="rounded bg-[#991B1B] px-2.5 py-1 font-medium text-white hover:bg-[#7F1D1D] transition-colors whitespace-nowrap shrink-0"
        >
          Usar versión remota
        </button>
      </div>
    </div>
  );
};
