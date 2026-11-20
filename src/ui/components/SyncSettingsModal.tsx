import React, { ChangeEvent, FormEvent } from 'react';
import { X } from 'lucide-react';
import { SyncConfigDraftVM } from '../state/editor-ui.state';

interface SyncSettingsModalProps {
  readonly isOpen: boolean;
  readonly isConfigured: boolean;
  readonly draft: SyncConfigDraftVM;
  readonly onClose: () => void;
  readonly onFieldChange: (
    field: keyof SyncConfigDraftVM
  ) => (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onClear: () => void;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  isOpen,
  isConfigured,
  draft,
  onClose,
  onFieldChange,
  onSubmit,
  onClear,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#DDD9CE] bg-[#FCFBF8] p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-medium text-[#18181B]">
            Sincronización con GitHub
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar configuración"
            className="rounded p-1 text-[#78716C] hover:bg-[#EFECE4] hover:text-[#18181B]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-[#57534E]">
          Conecta un repositorio para respaldar tus manuscritos en archivos Markdown con YAML frontmatter.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-[#44403C]">
              Propietario
              <input
                type="text"
                required
                value={draft.owner}
                onChange={onFieldChange('owner')}
                placeholder="usuario"
                className="mt-1 w-full rounded-md border border-[#D6D3C9] bg-white px-2.5 py-1.5 text-xs text-[#18181B] focus:border-[#1E3A5F] focus:outline-none"
              />
            </label>
            <label className="block text-xs font-medium text-[#44403C]">
              Repositorio
              <input
                type="text"
                required
                value={draft.repo}
                onChange={onFieldChange('repo')}
                placeholder="cuaderno-md"
                className="mt-1 w-full rounded-md border border-[#D6D3C9] bg-white px-2.5 py-1.5 text-xs text-[#18181B] focus:border-[#1E3A5F] focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-[#44403C]">
              Rama
              <input
                type="text"
                required
                value={draft.branch}
                onChange={onFieldChange('branch')}
                placeholder="main"
                className="mt-1 w-full rounded-md border border-[#D6D3C9] bg-white px-2.5 py-1.5 text-xs text-[#18181B] focus:border-[#1E3A5F] focus:outline-none"
              />
            </label>
            <label className="block text-xs font-medium text-[#44403C]">
              Carpeta destino
              <input
                type="text"
                value={draft.basePath}
                onChange={onFieldChange('basePath')}
                placeholder="notas"
                className="mt-1 w-full rounded-md border border-[#D6D3C9] bg-white px-2.5 py-1.5 text-xs text-[#18181B] focus:border-[#1E3A5F] focus:outline-none"
              />
            </label>
          </div>

          <label className="block text-xs font-medium text-[#44403C]">
            Token personal de GitHub (Contents: Read &amp; Write)
            <input
              type="password"
              required
              value={draft.token}
              onChange={onFieldChange('token')}
              placeholder="ghp_..."
              className="mt-1 w-full rounded-md border border-[#D6D3C9] bg-white px-2.5 py-1.5 font-mono text-xs text-[#18181B] focus:border-[#1E3A5F] focus:outline-none"
            />
          </label>

          <div className="flex items-center justify-between pt-2">
            {isConfigured ? (
              <button
                type="button"
                onClick={onClear}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors"
              >
                Desconectar
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[#D6D3C9] px-3 py-1.5 text-xs font-medium text-[#44403C] hover:bg-[#EFECE4] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-[#1E3A5F] px-4 py-1.5 text-xs font-medium text-[#FCFBF8] hover:bg-[#162C49] transition-colors"
              >
                Guardar conexión
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
