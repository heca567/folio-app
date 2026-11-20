import React from 'react';
import { WifiOff, X } from 'lucide-react';
import { StudioUseCases, useNoteStudioHandler } from '../handlers/useNoteStudioHandler';
import { EditorToolbar } from './EditorToolbar';
import { MarkdownCanvas } from './MarkdownCanvas';
import { NewProjectModal } from './NewProjectModal';
import { SidebarIndex } from './SidebarIndex';
import { SyncSettingsModal } from './SyncSettingsModal';

interface WritingStudioPageProps {
  readonly useCases: StudioUseCases;
  readonly onNavigateAfirmaciones?: () => void;
}

export const WritingStudioPage: React.FC<WritingStudioPageProps> = ({
  useCases,
  onNavigateAfirmaciones,
}) => {
  const { vm, actions } = useNoteStudioHandler(useCases);
  const { ui } = vm;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F6F5F0] text-[#18181B]">
      <input
        ref={vm.fileInputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        onChange={actions.handleImportFileChange}
        className="hidden"
      />

      <div className="relative flex flex-1 overflow-hidden">
        {ui.isSidebarOpen && !ui.isFocusMode && (
          <>
            <div
              onClick={actions.toggleSidebar}
              aria-hidden="true"
              className="fixed inset-0 z-30 bg-black/30 md:hidden"
            />
            <SidebarIndex
              user={ui.user}
              isSigningIn={ui.isSigningIn}
              projectOptions={vm.projectOptions}
              selectedProjectId={ui.selectedProjectId}
              isSignedIn={Boolean(ui.user)}
              noteCards={vm.noteCards}
              stageFilters={vm.stageFilters}
              searchQuery={ui.searchQuery}
              metrics={vm.workspaceMetrics}
              isLoading={ui.isLoading}
              onSignIn={actions.signInWithGoogle}
              onSignOut={actions.signOutUser}
              onOpenAfirmaciones={onNavigateAfirmaciones}
              onCloseMobileSidebar={actions.toggleSidebar}
              onSelectProject={actions.selectProject}
              onOpenNewProject={actions.openNewProjectModal}
              onSelectNote={(noteId) => {
                actions.selectNote(noteId);
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  actions.toggleSidebar();
                }
              }}
              onCreateNote={actions.createNote}
              onRequestDelete={actions.requestDeleteNote}
              onCancelDelete={actions.cancelDeleteNote}
              onConfirmDelete={actions.confirmDeleteNote}
              onChangeStageFilter={actions.changeStageFilter}
              onChangeSearchQuery={actions.changeSearchQuery}
              onTriggerImport={actions.triggerImportMarkdown}
            />
          </>
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <EditorToolbar
            user={ui.user}
            isSigningIn={ui.isSigningIn}
            activeNote={vm.activeNote}
            allowedTransitions={vm.allowedTransitions}
            isFocusMode={ui.isFocusMode}
            isPreviewMode={ui.isPreviewMode}
            isSidebarOpen={ui.isSidebarOpen}
            isSaving={ui.isSaving}
            isSyncing={ui.isSyncing}
            isSyncConfigured={ui.isSyncConfigured}
            isPWAInstallable={ui.isPWAInstallable}
            isPWAInstalled={ui.isPWAInstalled}
            isIOSDevice={ui.isIOSDevice}
            onSignIn={actions.signInWithGoogle}
            onSignOut={actions.signOutUser}
            onOpenAfirmaciones={onNavigateAfirmaciones}
            onToggleSidebar={actions.toggleSidebar}
            onToggleFocusMode={actions.toggleFocusMode}
            onTogglePreviewMode={actions.togglePreviewMode}
            onSaveNote={actions.saveActiveNote}
            onExportNote={actions.exportActiveNote}
            onTransitionStage={actions.transitionNoteStage}
            onTriggerSync={actions.triggerSync}
            onOpenSyncModal={actions.openSyncModal}
            onInstallPWA={actions.installPWA}
            onOpenIOSGuide={actions.openIOSInstallGuide}
          />

          <MarkdownCanvas
            activeNote={vm.activeNote}
            isPreviewMode={ui.isPreviewMode}
            isFocusMode={ui.isFocusMode}
            isSignedIn={Boolean(ui.user)}
            isSigningIn={ui.isSigningIn}
            onSignIn={actions.signInWithGoogle}
            onChangeTitle={actions.changeDraftTitle}
            onChangeContent={actions.changeDraftContent}
            onChangeTags={actions.changeDraftTags}
            onCreateNote={actions.createNote}
            onTriggerImport={actions.triggerImportMarkdown}
            onResolveConflictLocal={actions.resolveConflictKeepLocal}
            onResolveConflictRemote={actions.resolveConflictKeepRemote}
          />
        </main>
      </div>

      {!ui.isOnline && (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg border border-[#D97706]/30 bg-[#FEF3C7] px-3 py-1.5 text-xs font-medium text-[#92400E] shadow-sm">
          <WifiOff className="h-3.5 w-3.5" />
          <span>Modo sin conexión — tus textos se guardan en IndexedDB</span>
        </div>
      )}

      {ui.feedback && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-lg border border-[#D6D3C9] bg-[#FCFBF8] px-3.5 py-2 text-xs font-medium text-[#18181B] shadow-md">
          <span>{ui.feedback.message}</span>
          <button
            type="button"
            onClick={actions.dismissFeedback}
            aria-label="Cerrar aviso"
            className="rounded p-0.5 text-[#78716C] hover:bg-[#EFECE4] hover:text-[#18181B]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <NewProjectModal
        isOpen={ui.isProjectModalOpen}
        projectName={ui.newProjectName}
        projectColor={ui.newProjectColor}
        isCreating={ui.isCreatingProject}
        onClose={actions.closeNewProjectModal}
        onNameChange={actions.changeNewProjectName}
        onColorChange={actions.changeNewProjectColor}
        onSubmit={actions.submitNewProject}
      />

      <SyncSettingsModal
        isOpen={ui.isSyncModalOpen}
        isConfigured={ui.isSyncConfigured}
        draft={ui.syncConfigDraft}
        onClose={actions.closeSyncModal}
        onFieldChange={actions.changeSyncConfigField}
        onSubmit={actions.submitSyncConfig}
        onClear={actions.clearSyncConfig}
      />

      {ui.isIOSInstallGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#DDD9CE] bg-[#FCFBF8] p-6 shadow-lg">
            <h3 className="font-serif text-lg font-medium text-[#18181B]">
              Instalar Folio en iPhone o iPad
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#57534E]">
              1. Pulsa el botón Compartir en la barra de Safari.
              <br />
              2. Desplázate hacia abajo y selecciona Añadir a la pantalla de inicio.
            </p>
            <button
              type="button"
              onClick={actions.closeIOSInstallGuide}
              className="mt-4 w-full rounded-md bg-[#1E3A5F] py-2 text-xs font-medium text-[#FCFBF8] hover:bg-[#162C49]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
