import React, { ChangeEvent } from 'react';
import { FilePlus2, Upload } from 'lucide-react';
import { ActiveNoteVM } from '../state/editor-ui.state';
import { ConflictBanner } from './ConflictBanner';
import { GoogleSignInButton } from './GoogleSignInButton';
import { MarkdownPreviewPane } from './MarkdownPreviewPane';

interface MarkdownCanvasProps {
  readonly activeNote: ActiveNoteVM | null;
  readonly isPreviewMode: boolean;
  readonly isFocusMode: boolean;
  readonly isSignedIn: boolean;
  readonly isSigningIn: boolean;
  readonly onSignIn: () => void;
  readonly onChangeTitle: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onChangeContent: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  readonly onChangeTags: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onCreateNote: () => void;
  readonly onTriggerImport: () => void;
  readonly onResolveConflictLocal: () => void;
  readonly onResolveConflictRemote: () => void;
}

export const MarkdownCanvas: React.FC<MarkdownCanvasProps> = ({
  activeNote,
  isPreviewMode,
  isFocusMode,
  isSignedIn,
  isSigningIn,
  onSignIn,
  onChangeTitle,
  onChangeContent,
  onChangeTags,
  onCreateNote,
  onTriggerImport,
  onResolveConflictLocal,
  onResolveConflictRemote,
}) => {
  if (!activeNote) {
    return (
      <section className="flex flex-1 items-center justify-center bg-[#F6F5F0] px-6 py-12">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#18181B]">
            Mesa de escritura vacía
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#57534E]">
            Crea un nuevo manuscrito para comenzar desde una semilla o importa un archivo Markdown con frontmatter YAML.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onCreateNote}
              className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-[#FCFBF8] hover:bg-[#162C49] transition-colors whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="h-4 w-4" />
              Nuevo manuscrito
            </button>
            <button
              type="button"
              onClick={onTriggerImport}
              className="inline-flex items-center gap-2 rounded-md border border-[#D6D3C9] bg-[#FCFBF8] px-4 py-2 text-sm font-medium text-[#44403C] hover:bg-[#EFECE4] transition-colors whitespace-nowrap shrink-0"
            >
              <Upload className="h-4 w-4" />
              Importar .md
            </button>
          </div>
          {!isSignedIn && (
            <div className="mt-4 flex justify-center">
              <GoogleSignInButton isSigningIn={isSigningIn} onClick={onSignIn} />
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col overflow-hidden bg-[#FCFBF8]">
      {activeNote.hasConflict && (
        <ConflictBanner
          onResolveLocal={onResolveConflictLocal}
          onResolveRemote={onResolveConflictRemote}
        />
      )}

      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 lg:px-16">
        <div className={`mx-auto flex h-full flex-col ${isFocusMode ? 'max-w-2xl' : 'max-w-3xl'}`}>
          <input
            type="text"
            value={activeNote.title}
            onChange={onChangeTitle}
            placeholder="Título del manuscrito…"
            className="w-full border-0 bg-transparent font-serif text-3xl font-medium tracking-tight text-[#18181B] placeholder:text-[#C7C2B6] focus:outline-none md:text-4xl"
          />

          <div className="mt-3 border-b border-[#EFECE4] pb-4 text-xs text-[#78716C]">
            {activeNote.stageDescription}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <label htmlFor="note-tags-input" className="text-xs font-medium text-[#78716C] shrink-0">
              Etiquetas:
            </label>
            <input
              id="note-tags-input"
              type="text"
              value={activeNote.tagsInput}
              onChange={onChangeTags}
              placeholder="ensayo, capítulo-1, bitácora"
              className="w-full border-0 bg-transparent text-xs text-[#44403C] placeholder:text-[#B8B2A6] focus:outline-none"
            />
          </div>

          <div className="mt-6 flex-1">
            {isPreviewMode ? (
              <MarkdownPreviewPane blocks={activeNote.previewBlocks} />
            ) : (
              <textarea
                value={activeNote.content}
                onChange={onChangeContent}
                placeholder="Comienza a escribir en Markdown…"
                className="h-full min-h-[420px] w-full resize-none border-0 bg-transparent font-serif text-[17px] leading-[1.85] text-[#27272A] placeholder:text-[#C7C2B6] focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-[#EFECE4] bg-[#FAF9F4] px-6 py-2 text-[11px] text-[#78716C] tabular-nums">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>{activeNote.wordCount} palabras</span>
            <span aria-hidden="true">·</span>
            <span>{activeNote.paragraphCount} párrafos</span>
            <span aria-hidden="true">·</span>
            <span>{activeNote.readingTimeLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{activeNote.syncLabel}</span>
            <span aria-hidden="true">·</span>
            <span>Actualizado {activeNote.updatedAtLabel}</span>
          </div>
        </div>
      </footer>
    </section>
  );
};
