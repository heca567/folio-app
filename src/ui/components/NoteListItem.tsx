import React from 'react';
import { Trash2, Check, X } from 'lucide-react';
import { NoteCardVM } from '../state/editor-ui.state';

interface NoteListItemProps {
  readonly note: NoteCardVM;
  readonly onSelect: (noteId: string) => void;
  readonly onRequestDelete: (noteId: string) => void;
  readonly onCancelDelete: () => void;
  readonly onConfirmDelete: (noteId: string) => void;
}

export const NoteListItem: React.FC<NoteListItemProps> = ({
  note,
  onSelect,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}) => {
  const rowBackground = note.isSelected
    ? 'bg-[#FCFBF8] border-[#1E3A5F]/25 shadow-xs'
    : 'bg-transparent border-transparent hover:bg-[#EFECE4]/70';

  return (
    <div
      className={`group rounded-lg border px-3 py-2.5 transition-colors duration-150 ${rowBackground}`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelect(note.id)}
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] rounded-sm"
        >
          <div className="truncate font-serif text-[15px] font-medium text-[#18181B]">
            {note.title}
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#57534E]">
            {note.excerpt}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#78716C] tabular-nums">
            <span className="font-medium text-[#1E3A5F]">{note.stageLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{note.wordCountLabel}</span>
            <span aria-hidden="true">·</span>
            <span className={note.hasConflict ? 'font-medium text-[#B91C1C]' : ''}>
              {note.syncLabel}
            </span>
          </div>
        </button>

        <div className="flex shrink-0 items-center pt-0.5">
          {note.isConfirmingDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onConfirmDelete(note.id)}
                aria-label="Confirmar eliminación"
                className="rounded p-1.5 text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                aria-label="Cancelar eliminación"
                className="rounded p-1.5 text-[#57534E] hover:bg-[#E7E5E4] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onRequestDelete(note.id)}
              aria-label={`Eliminar ${note.title}`}
              className="rounded p-1.5 text-[#A8A29E] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-[#E7E5E4] hover:text-[#B91C1C] transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
