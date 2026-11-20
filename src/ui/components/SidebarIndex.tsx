import React, { ChangeEvent } from 'react';
import { BookOpen, FolderPlus, ListChecks, LogOut, Plus, Search, Upload, X } from 'lucide-react';
import type { UserProfile } from '../../types';
import {
  NoteCardVM,
  ProjectFilterKey,
  ProjectOptionVM,
  StageFilterKey,
  StageFilterOptionVM,
  WorkspaceMetricsVM,
} from '../state/editor-ui.state';
import { GoogleSignInButton } from './GoogleSignInButton';
import { NoteListItem } from './NoteListItem';
import { ProjectDropdown } from './ProjectDropdown';

interface SidebarIndexProps {
  readonly user: UserProfile | null;
  readonly isSigningIn: boolean;
  readonly projectOptions: readonly ProjectOptionVM[];
  readonly selectedProjectId: ProjectFilterKey;
  readonly isSignedIn: boolean;
  readonly noteCards: readonly NoteCardVM[];
  readonly stageFilters: readonly StageFilterOptionVM[];
  readonly searchQuery: string;
  readonly metrics: WorkspaceMetricsVM;
  readonly isLoading: boolean;
  readonly onSignIn: () => void;
  readonly onSignOut: () => void;
  readonly onOpenAfirmaciones?: () => void;
  readonly onCloseMobileSidebar?: () => void;
  readonly onSelectProject: (projectId: ProjectFilterKey) => void;
  readonly onOpenNewProject: () => void;
  readonly onSelectNote: (noteId: string) => void;
  readonly onCreateNote: () => void;
  readonly onRequestDelete: (noteId: string) => void;
  readonly onCancelDelete: () => void;
  readonly onConfirmDelete: (noteId: string) => void;
  readonly onChangeStageFilter: (filter: StageFilterKey) => void;
  readonly onChangeSearchQuery: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onTriggerImport: () => void;
}

export const SidebarIndex: React.FC<SidebarIndexProps> = ({
  user,
  isSigningIn,
  projectOptions,
  selectedProjectId,
  isSignedIn,
  noteCards,
  stageFilters,
  searchQuery,
  metrics,
  isLoading,
  onSignIn,
  onSignOut,
  onOpenAfirmaciones,
  onCloseMobileSidebar,
  onSelectProject,
  onOpenNewProject,
  onSelectNote,
  onCreateNote,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onChangeStageFilter,
  onChangeSearchQuery,
  onTriggerImport,
}) => {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex h-full w-[86vw] max-w-80 shrink-0 flex-col border-r border-[#E5E2D9] bg-[#F3F1EA] shadow-xl md:static md:z-auto md:w-80 md:shadow-none">
      <div className="flex items-center justify-between border-b border-[#E5E2D9] px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-4 w-4 text-[#1E3A5F]" />
          <span className="font-serif text-lg font-semibold tracking-tight text-[#18181B]">
            Folio
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onTriggerImport}
            title="Importar archivo Markdown"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#D6D3C9] bg-[#FCFBF8] px-2.5 py-1.5 text-xs font-medium text-[#44403C] hover:bg-[#EFECE4] transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="h-3.5 w-3.5" />
            Importar
          </button>
          <button
            type="button"
            onClick={onCreateNote}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A5F] px-3 py-1.5 text-xs font-medium text-[#FCFBF8] hover:bg-[#162C49] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva
          </button>
          {onCloseMobileSidebar && (
            <button
              type="button"
              onClick={onCloseMobileSidebar}
              aria-label="Cerrar panel lateral"
              className="rounded-md p-1.5 text-[#57534E] hover:bg-[#E5E2D9] hover:text-[#18181B] md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {onOpenAfirmaciones && (
        <div className="border-b border-[#E5E2D9] px-4 py-2">
          <a
            href="/afirmaciones"
            onClick={(event) => {
              event.preventDefault();
              onOpenAfirmaciones();
            }}
            className="flex w-full items-center justify-between rounded-md border border-[#D6D3C9] bg-[#FCFBF8] px-3 py-1.5 text-xs font-medium text-[#1E3A5F] hover:bg-[#EDF1F6] transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <ListChecks className="h-3.5 w-3.5" />
              Explorador de Afirmaciones
            </span>
            <span className="text-[11px] text-[#78716C]">Abrir →</span>
          </a>
        </div>
      )}

      <div className="border-b border-[#E5E2D9] px-4 py-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#78716C]">
            Proyectos
          </span>
          {isSignedIn && (
            <span className="text-[10px] font-medium text-[#2D6A4F]">
              Firestore conectado
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <ProjectDropdown
            projects={projectOptions}
            selectedProjectId={selectedProjectId}
            isSignedIn={isSignedIn}
            onSelectProject={onSelectProject}
          />
          <button
            type="button"
            onClick={onOpenNewProject}
            title="Crear nuevo proyecto en Firestore"
            className="inline-flex items-center gap-1 rounded-md border border-[#D6D3C9] bg-[#FCFBF8] px-2.5 py-1.5 text-xs font-medium text-[#1E3A5F] hover:bg-[#EDF1F6] transition-colors whitespace-nowrap shrink-0"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Nuevo proyecto
          </button>
        </div>
      </div>

      <div className="border-b border-[#E5E2D9] px-4 py-3 space-y-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#78716C]" />
          <input
            type="search"
            value={searchQuery}
            onChange={onChangeSearchQuery}
            placeholder="Buscar título, texto o etiqueta…"
            className="w-full rounded-md border border-[#DDD9CE] bg-[#FCFBF8] py-1.5 pl-8 pr-3 text-xs text-[#18181B] placeholder:text-[#A8A29E] focus:border-[#1E3A5F] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {stageFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => onChangeStageFilter(filter.key)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                filter.isActive
                  ? 'bg-[#1E3A5F] text-[#FCFBF8]'
                  : 'bg-[#E9E6DC]/70 text-[#57534E] hover:bg-[#E2DFD3] hover:text-[#18181B]'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-1">
        {isLoading ? (
          <div className="px-3 py-8 text-center text-xs text-[#78716C]">
            Cargando archivo local…
          </div>
        ) : noteCards.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs leading-relaxed text-[#78716C]">
            No hay manuscritos que coincidan con el filtro actual.
          </div>
        ) : (
          noteCards.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              onSelect={onSelectNote}
              onRequestDelete={onRequestDelete}
              onCancelDelete={onCancelDelete}
              onConfirmDelete={onConfirmDelete}
            />
          ))
        )}
      </div>

      <div className="border-t border-[#E5E2D9] px-4 py-2.5">
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  referrerPolicy="no-referrer"
                  className="h-6 w-6 rounded-full border border-[#D6D3C9] object-cover shrink-0"
                />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E3A5F] text-[11px] font-semibold text-[#FCFBF8] shrink-0">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-[#18181B]">
                  {user.displayName}
                </p>
                {user.email && (
                  <p className="truncate text-[10px] text-[#78716C]">{user.email}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              title="Cerrar sesión"
              className="rounded-md p-1.5 text-[#57534E] hover:bg-[#E5E2D9] hover:text-[#18181B] transition-colors shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <GoogleSignInButton isSigningIn={isSigningIn} onClick={onSignIn} fullWidth />
        )}
      </div>

      <footer className="border-t border-[#E5E2D9] px-4 py-2.5 text-[11px] text-[#78716C] tabular-nums">
        <div className="flex items-center justify-between gap-2">
          <span>{metrics.totalNotes} manuscritos</span>
          <span>{metrics.totalWordsLabel}</span>
        </div>
      </footer>
    </aside>
  );
};
