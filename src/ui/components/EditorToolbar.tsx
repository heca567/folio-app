import React from 'react';
import {
  Cloud,
  Download,
  Eye,
  ListChecks,
  LogOut,
  Maximize2,
  Minimize2,
  PanelLeft,
  Pencil,
  RefreshCw,
  Save,
  Settings,
} from 'lucide-react';
import { WritingStage } from '../../domain/models/writing-flow.model';
import type { UserProfile } from '../../types';
import { ActiveNoteVM, StageTransitionOptionVM } from '../state/editor-ui.state';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PWAInstallButton } from './PWAInstallButton';
import { StageTransitionBar } from './StageTransitionBar';

interface EditorToolbarProps {
  readonly user: UserProfile | null;
  readonly isSigningIn: boolean;
  readonly activeNote: ActiveNoteVM | null;
  readonly allowedTransitions: readonly StageTransitionOptionVM[];
  readonly isFocusMode: boolean;
  readonly isPreviewMode: boolean;
  readonly isSidebarOpen: boolean;
  readonly isSaving: boolean;
  readonly isSyncing: boolean;
  readonly isSyncConfigured: boolean;
  readonly isPWAInstallable: boolean;
  readonly isPWAInstalled: boolean;
  readonly isIOSDevice: boolean;
  readonly onSignIn: () => void;
  readonly onSignOut: () => void;
  readonly onOpenAfirmaciones?: () => void;
  readonly onToggleSidebar: () => void;
  readonly onToggleFocusMode: () => void;
  readonly onTogglePreviewMode: () => void;
  readonly onSaveNote: () => void;
  readonly onExportNote: () => void;
  readonly onTransitionStage: (stage: WritingStage) => void;
  readonly onTriggerSync: () => void;
  readonly onOpenSyncModal: () => void;
  readonly onInstallPWA: () => void;
  readonly onOpenIOSGuide: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = (props) => {
  const { activeNote, allowedTransitions, isFocusMode, isPreviewMode, user, isSigningIn } = props;
  const saveLabel = props.isSaving ? 'Guardando…' : activeNote?.isDirty ? 'Guardar' : 'Guardado';
  const syncLabel = props.isSyncing ? 'Sincronizando…' : props.isSyncConfigured ? 'Sincronizar' : 'Conectar GitHub';

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E2D9] bg-[#FAF9F4] px-4 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        {!isFocusMode && (
          <button
            type="button"
            onClick={props.onToggleSidebar}
            title={props.isSidebarOpen ? 'Ocultar índice' : 'Mostrar índice'}
            className="rounded-md p-2 text-[#57534E] hover:bg-[#ECE9DF] hover:text-[#18181B] transition-colors shrink-0"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}

        {activeNote && (
          <StageTransitionBar
            currentStageLabel={activeNote.stageLabel}
            allowedTransitions={allowedTransitions}
            onTransitionStage={props.onTransitionStage}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {activeNote && (
          <>
            <button
              type="button"
              onClick={props.onSaveNote}
              disabled={!activeNote.isDirty || props.isSaving}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#44403C] hover:bg-[#ECE9DF] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
            >
              <Save className="h-3.5 w-3.5" />
              {saveLabel}
            </button>
            <button
              type="button"
              onClick={props.onTogglePreviewMode}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#44403C] hover:bg-[#ECE9DF] transition-colors whitespace-nowrap shrink-0"
            >
              {isPreviewMode ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {isPreviewMode ? 'Editar' : 'Vista previa'}
            </button>
            <button
              type="button"
              onClick={props.onExportNote}
              title="Descargar como .md con frontmatter YAML"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#44403C] hover:bg-[#ECE9DF] transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar
            </button>
            <button
              type="button"
              onClick={props.onToggleFocusMode}
              title={isFocusMode ? 'Salir de modo enfoque' : 'Modo enfoque'}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#44403C] hover:bg-[#ECE9DF] transition-colors whitespace-nowrap shrink-0"
            >
              {isFocusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              {isFocusMode ? 'Salir' : 'Enfoque'}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={props.onTriggerSync}
          disabled={props.isSyncing}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#D6D3C9] bg-[#FCFBF8] px-3 py-1.5 text-xs font-medium text-[#1E3A5F] hover:bg-[#EDF1F6] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
        >
          {props.isSyncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Cloud className="h-3.5 w-3.5" />}
          {syncLabel}
        </button>
        <button
          type="button"
          onClick={props.onOpenSyncModal}
          aria-label="Configurar repositorio remoto"
          className="rounded-md p-2 text-[#57534E] hover:bg-[#ECE9DF] hover:text-[#18181B] transition-colors shrink-0"
        >
          <Settings className="h-4 w-4" />
        </button>

        {props.onOpenAfirmaciones && (
          <a
            href="/afirmaciones"
            onClick={(event) => {
              event.preventDefault();
              props.onOpenAfirmaciones?.();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#D6D3C9] bg-[#FCFBF8] px-3 py-1.5 text-xs font-medium text-[#44403C] hover:bg-[#EFECE4] transition-colors whitespace-nowrap shrink-0"
          >
            <ListChecks className="h-3.5 w-3.5 text-[#1E3A5F]" />
            Afirmaciones
          </a>
        )}

        <PWAInstallButton
          isPWAInstallable={props.isPWAInstallable}
          isPWAInstalled={props.isPWAInstalled}
          isIOSDevice={props.isIOSDevice}
          onInstallPWA={props.onInstallPWA}
          onOpenIOSGuide={props.onOpenIOSGuide}
        />

        {user ? (
          <div className="flex items-center gap-1.5 border-l border-[#E5E2D9] pl-2 ml-0.5">
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
            <span className="hidden max-w-[120px] truncate text-xs font-medium text-[#44403C] sm:inline">
              {user.displayName}
            </span>
            <button
              type="button"
              onClick={props.onSignOut}
              title="Cerrar sesión"
              className="inline-flex items-center gap-1 rounded-md border border-[#D6D3C9] bg-[#FCFBF8] px-2.5 py-1.5 text-xs font-medium text-[#57534E] hover:bg-[#EFECE4] hover:text-[#18181B] transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        ) : (
          <GoogleSignInButton isSigningIn={isSigningIn} onClick={props.onSignIn} />
        )}
      </div>
    </header>
  );
};
