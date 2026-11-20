import React, { ChangeEvent, FormEvent } from 'react';
import { FolderPlus, X } from 'lucide-react';

interface NewProjectModalProps {
  readonly isOpen: boolean;
  readonly projectName: string;
  readonly projectColor: string;
  readonly isCreating: boolean;
  readonly onClose: () => void;
  readonly onNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onColorChange: (color: string) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const PROJECT_COLORS = [
  { label: 'Azul tinta', value: '#1E3A5F' },
  { label: 'Verde bosque', value: '#2D6A4F' },
  { label: 'Terracota', value: '#9A3412' },
  { label: 'Ciruela', value: '#6B21A8' },
  { label: 'Ámbar', value: '#B45309' },
  { label: 'Grafito', value: '#3F3F46' },
] as const;

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  projectName,
  projectColor,
  isCreating,
  onClose,
  onNameChange,
  onColorChange,
  onSubmit,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-[#DDD9CE] bg-[#FCFBF8] p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4 text-[#1E3A5F]" />
            <h2 className="font-serif text-xl font-medium text-[#18181B]">
              Nuevo proyecto
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de nuevo proyecto"
            className="rounded p-1 text-[#78716C] hover:bg-[#EFECE4] hover:text-[#18181B]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1.5 text-xs leading-relaxed text-[#57534E]">
          Crea una carpeta o proyecto editorial en Firestore para organizar tus manuscritos.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <label className="block text-xs font-medium text-[#44403C]">
            Nombre del proyecto
            <input
              type="text"
              required
              maxLength={80}
              autoFocus
              value={projectName}
              onChange={onNameChange}
              placeholder="Ej. Novela de invierno, Ensayos…"
              className="mt-1 w-full rounded-md border border-[#D6D3C9] bg-white px-2.5 py-1.5 text-xs text-[#18181B] focus:border-[#1E3A5F] focus:outline-none"
            />
          </label>

          <div>
            <span className="block text-xs font-medium text-[#44403C]">
              Color identificador
            </span>
            <div className="mt-2 flex items-center gap-2">
              {PROJECT_COLORS.map((swatch) => {
                const isSelected = projectColor === swatch.value;
                return (
                  <button
                    key={swatch.value}
                    type="button"
                    title={swatch.label}
                    aria-label={swatch.label}
                    onClick={() => onColorChange(swatch.value)}
                    className={`h-6 w-6 rounded-full transition-transform ${
                      isSelected ? 'ring-2 ring-[#18181B] ring-offset-2 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: swatch.value }}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#D6D3C9] px-3 py-1.5 text-xs font-medium text-[#44403C] hover:bg-[#EFECE4] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || projectName.trim().length === 0}
              className="rounded-md bg-[#1E3A5F] px-4 py-1.5 text-xs font-medium text-[#FCFBF8] hover:bg-[#162C49] disabled:opacity-50 transition-colors"
            >
              {isCreating ? 'Creando…' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
