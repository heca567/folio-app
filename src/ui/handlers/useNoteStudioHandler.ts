import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  buildSlug,
  extractExcerpt,
  normalizeTags,
  Note,
  SyncStatus,
} from '../../domain/models/note.model';
import {
  STAGE_DESCRIPTORS,
  WRITING_STAGES_ORDER,
  WritingStage,
} from '../../domain/models/writing-flow.model';
import { ManageNotesUseCase } from '../../domain/use-cases/manage-notes.usecase';
import { SyncWorkspaceUseCase } from '../../domain/use-cases/sync-workspace.usecase';
import { TransitionStageUseCase } from '../../domain/use-cases/transition-stage.usecase';
import { folderRepository } from '../../infrastructure/firebase/folder.repository';
import { notesRepository, timestampToIsoString } from '../../infrastructure/firebase/notes.repository';
import { userProfileRepository } from '../../infrastructure/firebase/user-profile.repository';
import type { FirestoreNote } from '../../types';
import { editorUIReducer } from '../state/editor-ui.reducer';
import {
  ActiveNoteVM,
  createInitialEditorUIState,
  EditorUIState,
  MarkdownBlockVM,
  NoteCardVM,
  ProjectFilterKey,
  ProjectOptionVM,
  StageFilterKey,
  StageFilterOptionVM,
  StageTransitionOptionVM,
  SyncConfigDraftVM,
  WorkspaceMetricsVM,
} from '../state/editor-ui.state';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface StudioUseCases {
  readonly manageNotes: ManageNotesUseCase;
  readonly transitionStage: TransitionStageUseCase;
  readonly syncWorkspace: SyncWorkspaceUseCase;
}

export interface NoteStudioViewModel {
  readonly ui: EditorUIState;
  readonly projectOptions: readonly ProjectOptionVM[];
  readonly noteCards: readonly NoteCardVM[];
  readonly activeNote: ActiveNoteVM | null;
  readonly stageFilters: readonly StageFilterOptionVM[];
  readonly allowedTransitions: readonly StageTransitionOptionVM[];
  readonly workspaceMetrics: WorkspaceMetricsVM;
  readonly fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export interface NoteStudioActions {
  readonly signInWithGoogle: () => Promise<void>;
  readonly signOutUser: () => Promise<void>;
  readonly selectProject: (projectId: ProjectFilterKey) => void;
  readonly openNewProjectModal: () => void;
  readonly closeNewProjectModal: () => void;
  readonly changeNewProjectName: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly changeNewProjectColor: (color: string) => void;
  readonly submitNewProject: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  readonly selectNote: (noteId: string) => void;
  readonly createNote: () => Promise<void>;
  readonly saveActiveNote: () => Promise<void>;
  readonly requestDeleteNote: (noteId: string) => void;
  readonly cancelDeleteNote: () => void;
  readonly confirmDeleteNote: (noteId: string) => Promise<void>;
  readonly transitionNoteStage: (targetStage: WritingStage) => Promise<void>;
  readonly changeDraftTitle: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly changeDraftContent: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  readonly changeDraftTags: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly changeStageFilter: (filter: StageFilterKey) => void;
  readonly changeSearchQuery: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly toggleFocusMode: () => void;
  readonly togglePreviewMode: () => void;
  readonly toggleSidebar: () => void;
  readonly exportActiveNote: () => Promise<void>;
  readonly triggerImportMarkdown: () => void;
  readonly handleImportFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  readonly triggerSync: () => Promise<void>;
  readonly openSyncModal: () => void;
  readonly closeSyncModal: () => void;
  readonly changeSyncConfigField: (
    field: keyof SyncConfigDraftVM
  ) => (event: ChangeEvent<HTMLInputElement>) => void;
  readonly submitSyncConfig: (event: FormEvent<HTMLFormElement>) => void;
  readonly clearSyncConfig: () => void;
  readonly resolveConflictKeepLocal: () => Promise<void>;
  readonly resolveConflictKeepRemote: () => Promise<void>;
  readonly installPWA: () => Promise<void>;
  readonly openIOSInstallGuide: () => void;
  readonly closeIOSInstallGuide: () => void;
  readonly dismissFeedback: () => void;
}

const SYNC_STATUS_LABELS: Readonly<Record<SyncStatus, string>> = {
  [SyncStatus.LOCAL_ONLY]: 'Solo local',
  [SyncStatus.PENDING_SYNC]: 'Pendiente',
  [SyncStatus.SYNCED]: 'Sincronizado',
  [SyncStatus.CONFLICT]: 'Conflicto',
};

function generateFirestoreId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${timestamp}_${randomPart}`;
}

function mapFirestoreNoteToDomain(raw: FirestoreNote): Note {
  const title = raw.title || 'Manuscrito sin título';
  const content = raw.content || '';
  return {
    id: raw.id,
    folderId: raw.folderId ?? null,
    slug: raw.slug || buildSlug(title, raw.id),
    title,
    content,
    excerpt: raw.excerpt ?? extractExcerpt(content),
    stage: raw.stage || WritingStage.SEED,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    syncStatus: SyncStatus.SYNCED,
    createdAt: timestampToIsoString(raw.createdAt),
    updatedAt: timestampToIsoString(raw.updatedAt),
  };
}

function parseTagsInput(rawInput: string): readonly string[] {
  return rawInput
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function formatRelativeDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return 'Reciente';
  }
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function parseMarkdownPreviewBlocks(markdown: string): readonly MarkdownBlockVM[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlockVM[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  lines.forEach((rawLine, index) => {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          id: `block-${index}`,
          kind: 'code',
          text: codeLines.join('\n'),
        });
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      return;
    }

    if (!trimmed) {
      return;
    }

    if (trimmed === '---' || trimmed === '***') {
      blocks.push({ id: `block-${index}`, kind: 'hr', text: '' });
      return;
    }

    if (trimmed.startsWith('### ')) {
      blocks.push({ id: `block-${index}`, kind: 'h3', text: trimmed.slice(4) });
      return;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push({ id: `block-${index}`, kind: 'h2', text: trimmed.slice(3) });
      return;
    }

    if (trimmed.startsWith('# ')) {
      blocks.push({ id: `block-${index}`, kind: 'h1', text: trimmed.slice(2) });
      return;
    }

    if (trimmed.startsWith('> ')) {
      blocks.push({ id: `block-${index}`, kind: 'quote', text: trimmed.slice(2) });
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({ id: `block-${index}`, kind: 'list-item', text: trimmed.slice(2) });
      return;
    }

    blocks.push({ id: `block-${index}`, kind: 'paragraph', text: trimmed });
  });

  if (codeLines.length > 0) {
    blocks.push({ id: 'block-code-tail', kind: 'code', text: codeLines.join('\n') });
  }

  return blocks;
}

export function useNoteStudioHandler(useCases: StudioUseCases): {
  readonly vm: NoteStudioViewModel;
  readonly actions: NoteStudioActions;
} {
  const { manageNotes, transitionStage, syncWorkspace } = useCases;
  const [state, dispatch] = useReducer(editorUIReducer, undefined, createInitialEditorUIState);

  const deferredInstallPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const persistCurrentDraft = useCallback(
    async (noteId: string, title: string, content: string, tagsInput: string): Promise<Note | null> => {
      dispatch({ type: 'SAVE_NOTE_START' });
      try {
        if (state.user) {
          const existingNote = state.notes.find((item) => item.id === noteId);
          const cleanTitle = title.trim() || 'Manuscrito sin título';
          const normalizedTags = normalizeTags(parseTagsInput(tagsInput));
          const slug = buildSlug(cleanTitle, noteId);
          const excerpt = extractExcerpt(content);

          await notesRepository.update(noteId, {
            title: cleanTitle,
            slug,
            content,
            excerpt,
            tags: [...normalizedTags],
          });

          const saved: Note = {
            id: noteId,
            folderId: existingNote?.folderId ?? null,
            slug,
            title: cleanTitle,
            content,
            excerpt,
            stage: existingNote?.stage ?? WritingStage.SEED,
            tags: normalizedTags,
            syncStatus: SyncStatus.SYNCED,
            createdAt: existingNote?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          dispatch({ type: 'SAVE_NOTE_SUCCESS', payload: { note: saved } });
          return saved;
        }

        const saved = await manageNotes.updateNote(noteId, {
          title,
          content,
          tags: parseTagsInput(tagsInput),
        });
        dispatch({ type: 'SAVE_NOTE_SUCCESS', payload: { note: saved } });
        return saved;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo guardar la nota.';
        dispatch({ type: 'SAVE_NOTE_ERROR', payload: { message } });
        return null;
      }
    },
    [manageNotes, state.user, state.notes]
  );

  useEffect(() => {
    const unsubscribe = userProfileRepository.subscribe(
      (profile) => {
        dispatch({ type: 'SET_AUTH_STATE', payload: { user: profile } });
      },
      (error) => {
        dispatch({
          type: 'SIGN_IN_ERROR',
          payload: { message: error.message || 'Error al verificar la sesión.' },
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!state.isAuthReady) {
      return;
    }

    if (state.user) {
      dispatch({ type: 'LOAD_NOTES_START' });

      const unsubFolders = folderRepository.subscribe(
        state.user.uid,
        (folders) => {
          dispatch({ type: 'SET_PROJECTS', payload: { projects: folders } });
        },
        (error) => {
          dispatch({
            type: 'CREATE_PROJECT_ERROR',
            payload: { message: `Error al cargar proyectos: ${error.message}` },
          });
        }
      );

      const unsubNotes = notesRepository.subscribe(
        state.user.uid,
        (firestoreNotes) => {
          const domainNotes = firestoreNotes.map(mapFirestoreNoteToDomain);
          dispatch({ type: 'LOAD_NOTES_SUCCESS', payload: { notes: domainNotes } });
          dispatch({
            type: 'SET_SYNC_STATUS_FLAG',
            payload: { isConfigured: syncWorkspace.isSyncConfigured() },
          });
        },
        (error) => {
          dispatch({
            type: 'LOAD_NOTES_ERROR',
            payload: { message: `Error al sincronizar con Firestore: ${error.message}` },
          });
        }
      );

      return () => {
        unsubFolders();
        unsubNotes();
      };
    }

    let isMounted = true;

    const bootstrapLocalWorkspace = async () => {
      dispatch({ type: 'LOAD_NOTES_START' });
      try {
        const notes = await manageNotes.listNotes();
        if (!isMounted) {
          return;
        }
        dispatch({ type: 'LOAD_NOTES_SUCCESS', payload: { notes } });
        dispatch({
          type: 'SET_SYNC_STATUS_FLAG',
          payload: { isConfigured: syncWorkspace.isSyncConfigured() },
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Error al cargar notas locales.';
        dispatch({ type: 'LOAD_NOTES_ERROR', payload: { message } });
      }
    };

    void bootstrapLocalWorkspace();

    return () => {
      isMounted = false;
    };
  }, [state.isAuthReady, state.user, manageNotes, syncWorkspace]);

  useEffect(() => {
    const updateOnline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: { isOnline: navigator.onLine } });
    };

    updateOnline();
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

    dispatch({
      type: 'SET_PWA_STATE',
      payload: {
        isInstallable: Boolean(deferredInstallPromptRef.current),
        isInstalled: isStandalone,
        isIOSDevice: isIOS,
      },
    });

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredInstallPromptRef.current = event as BeforeInstallPromptEvent;
      dispatch({
        type: 'SET_PWA_STATE',
        payload: { isInstallable: true, isInstalled: isStandalone, isIOSDevice: isIOS },
      });
    };

    const onAppInstalled = () => {
      deferredInstallPromptRef.current = null;
      dispatch({
        type: 'SET_PWA_STATE',
        payload: { isInstallable: false, isInstalled: true, isIOSDevice: isIOS },
      });
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!state.isDirty || !state.activeNoteId) {
      return;
    }

    const activeId = state.activeNoteId;
    const title = state.draftTitle;
    const content = state.draftContent;
    const tagsInput = state.draftTagsInput;

    const timerId = window.setTimeout(() => {
      void persistCurrentDraft(activeId, title, content, tagsInput);
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    state.isDirty,
    state.activeNoteId,
    state.draftTitle,
    state.draftContent,
    state.draftTagsInput,
    persistCurrentDraft,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (state.activeNoteId && state.isDirty) {
          void persistCurrentDraft(
            state.activeNoteId,
            state.draftTitle,
            state.draftContent,
            state.draftTagsInput
          );
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    state.activeNoteId,
    state.isDirty,
    state.draftTitle,
    state.draftContent,
    state.draftTagsInput,
    persistCurrentDraft,
  ]);

  const signInWithGoogle = useCallback(async () => {
    dispatch({ type: 'SIGN_IN_START' });
    try {
      const profile = await userProfileRepository.signInWithGoogle();
      dispatch({
        type: 'SET_FEEDBACK',
        payload: {
          notice: {
            id: `signin-${Date.now()}`,
            tone: 'success',
            message: `Sesión iniciada como ${profile.displayName}.`,
          },
        },
      });
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        dispatch({ type: 'SET_AUTH_STATE', payload: { user: state.user } });
        return;
      }
      const message =
        error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google.';
      dispatch({ type: 'SIGN_IN_ERROR', payload: { message } });
    }
  }, [state.user]);

  const signOutUser = useCallback(async () => {
    if (state.activeNoteId && state.isDirty) {
      await persistCurrentDraft(
        state.activeNoteId,
        state.draftTitle,
        state.draftContent,
        state.draftTagsInput
      );
    }
    await userProfileRepository.logout();
    dispatch({ type: 'SIGN_OUT_SUCCESS' });
  }, [
    state.activeNoteId,
    state.isDirty,
    state.draftTitle,
    state.draftContent,
    state.draftTagsInput,
    persistCurrentDraft,
  ]);

  const selectProject = useCallback((projectId: ProjectFilterKey) => {
    dispatch({ type: 'SELECT_PROJECT', payload: { projectId } });
  }, []);

  const openNewProjectModal = useCallback(() => {
    if (!state.user) {
      dispatch({
        type: 'SET_FEEDBACK',
        payload: {
          notice: {
            id: `proj-auth-req-${Date.now()}`,
            tone: 'info',
            message: 'Inicia sesión con Google para crear y sincronizar proyectos en Firestore.',
          },
        },
      });
      return;
    }
    dispatch({ type: 'OPEN_PROJECT_MODAL' });
  }, [state.user]);

  const closeNewProjectModal = useCallback(() => {
    dispatch({ type: 'CLOSE_PROJECT_MODAL' });
  }, []);

  const changeNewProjectName = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'UPDATE_NEW_PROJECT_NAME', payload: { name: event.target.value } });
  }, []);

  const changeNewProjectColor = useCallback((color: string) => {
    dispatch({ type: 'UPDATE_NEW_PROJECT_COLOR', payload: { color } });
  }, []);

  const submitNewProject = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!state.user) {
        dispatch({
          type: 'CREATE_PROJECT_ERROR',
          payload: { message: 'Debes iniciar sesión antes de crear un proyecto.' },
        });
        return;
      }
      const cleanName = state.newProjectName.trim();
      if (!cleanName) {
        return;
      }
      dispatch({ type: 'CREATE_PROJECT_START' });
      try {
        const projectId = generateFirestoreId('proj');
        const created = await folderRepository.create(
          {
            name: cleanName,
            color: state.newProjectColor,
            icon: 'folder',
          },
          state.user,
          projectId
        );
        dispatch({ type: 'CREATE_PROJECT_SUCCESS', payload: { project: created } });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo crear el proyecto en Firestore.';
        dispatch({ type: 'CREATE_PROJECT_ERROR', payload: { message } });
      }
    },
    [state.user, state.newProjectName, state.newProjectColor]
  );

  const selectNote = useCallback(
    (noteId: string) => {
      if (state.activeNoteId === noteId) {
        return;
      }

      if (state.activeNoteId && state.isDirty) {
        void persistCurrentDraft(
          state.activeNoteId,
          state.draftTitle,
          state.draftContent,
          state.draftTagsInput
        );
      }

      const target = state.notes.find((item) => item.id === noteId);
      if (target) {
        dispatch({ type: 'SELECT_NOTE', payload: { note: target } });
      }
    },
    [
      state.activeNoteId,
      state.isDirty,
      state.draftTitle,
      state.draftContent,
      state.draftTagsInput,
      state.notes,
      persistCurrentDraft,
    ]
  );

  const createNote = useCallback(async () => {
    if (state.activeNoteId && state.isDirty) {
      await persistCurrentDraft(
        state.activeNoteId,
        state.draftTitle,
        state.draftContent,
        state.draftTagsInput
      );
    }

    const initialStage =
      state.stageFilter !== 'ALL' ? state.stageFilter : WritingStage.SEED;
    const assignedFolderId =
      state.selectedProjectId !== 'ALL' ? state.selectedProjectId : null;

    if (state.user) {
      try {
        const id = generateFirestoreId('note');
        const title = 'Nuevo manuscrito';
        const slug = buildSlug(title, id);
        const createdRemote = await notesRepository.create(
          {
            folderId: assignedFolderId,
            title,
            slug,
            content: '',
            excerpt: '',
            stage: initialStage,
            tags: [],
            isPinned: false,
            isArchived: false,
            color: '',
          },
          state.user,
          id
        );
        const domainNote = mapFirestoreNoteToDomain(createdRemote);
        dispatch({ type: 'CREATE_NOTE_SUCCESS', payload: { note: domainNote } });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo crear el manuscrito en Firestore.';
        dispatch({
          type: 'SET_FEEDBACK',
          payload: { notice: { id: `create-err-${Date.now()}`, tone: 'error', message } },
        });
      }
      return;
    }

    const created = await manageNotes.createNote({
      folderId: assignedFolderId,
      title: 'Nuevo manuscrito',
      content: '',
      stage: initialStage,
      tags: [],
    });

    dispatch({ type: 'CREATE_NOTE_SUCCESS', payload: { note: created } });
  }, [
    state.activeNoteId,
    state.isDirty,
    state.draftTitle,
    state.draftContent,
    state.draftTagsInput,
    state.stageFilter,
    state.selectedProjectId,
    state.user,
    manageNotes,
    persistCurrentDraft,
  ]);

  const saveActiveNote = useCallback(async () => {
    if (!state.activeNoteId) {
      return;
    }
    const saved = await persistCurrentDraft(
      state.activeNoteId,
      state.draftTitle,
      state.draftContent,
      state.draftTagsInput
    );
    if (saved) {
      dispatch({
        type: 'SET_FEEDBACK',
        payload: {
          notice: {
            id: `saved-${Date.now()}`,
            tone: 'success',
            message: state.user
              ? 'Manuscrito guardado en Firestore.'
              : 'Manuscrito guardado localmente.',
          },
        },
      });
    }
  }, [
    state.activeNoteId,
    state.draftTitle,
    state.draftContent,
    state.draftTagsInput,
    state.user,
    persistCurrentDraft,
  ]);

  const requestDeleteNote = useCallback((noteId: string) => {
    dispatch({ type: 'DELETE_NOTE_REQUEST', payload: { noteId } });
  }, []);

  const cancelDeleteNote = useCallback(() => {
    dispatch({ type: 'DELETE_NOTE_CANCEL' });
  }, []);

  const confirmDeleteNote = useCallback(
    async (noteId: string) => {
      if (state.user) {
        await notesRepository.delete(noteId);
      } else {
        await manageNotes.deleteNote(noteId);
      }
      dispatch({ type: 'DELETE_NOTE_SUCCESS', payload: { noteId } });
    },
    [manageNotes, state.user]
  );

  const transitionNoteStage = useCallback(
    async (targetStage: WritingStage) => {
      if (!state.activeNoteId) {
        return;
      }

      if (state.isDirty) {
        await persistCurrentDraft(
          state.activeNoteId,
          state.draftTitle,
          state.draftContent,
          state.draftTagsInput
        );
      }

      try {
        if (state.user) {
          const current = state.notes.find((item) => item.id === state.activeNoteId);
          if (!current) {
            return;
          }
          const allowed = transitionStage.getAvailableTransitions(current.stage);
          if (!allowed.includes(targetStage)) {
            throw new Error('Transición de etapa no permitida.');
          }
          await notesRepository.update(state.activeNoteId, { stage: targetStage });
          const updated: Note = {
            ...current,
            stage: targetStage,
            updatedAt: new Date().toISOString(),
          };
          dispatch({ type: 'TRANSITION_STAGE_SUCCESS', payload: { note: updated } });
        } else {
          const updated = await transitionStage.execute(state.activeNoteId, targetStage);
          dispatch({ type: 'TRANSITION_STAGE_SUCCESS', payload: { note: updated } });
        }

        dispatch({
          type: 'SET_FEEDBACK',
          payload: {
            notice: {
              id: `stage-${Date.now()}`,
              tone: 'success',
              message: `Etapa actualizada a "${STAGE_DESCRIPTORS[targetStage].label}".`,
            },
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo cambiar la etapa del manuscrito.';
        dispatch({
          type: 'SET_FEEDBACK',
          payload: { notice: { id: `stage-err-${Date.now()}`, tone: 'error', message } },
        });
      }
    },
    [
      state.activeNoteId,
      state.isDirty,
      state.draftTitle,
      state.draftContent,
      state.draftTagsInput,
      state.user,
      state.notes,
      transitionStage,
      persistCurrentDraft,
    ]
  );

  const changeDraftTitle = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'UPDATE_DRAFT_TITLE', payload: { title: event.target.value } });
  }, []);

  const changeDraftContent = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'UPDATE_DRAFT_CONTENT', payload: { content: event.target.value } });
  }, []);

  const changeDraftTags = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'UPDATE_DRAFT_TAGS', payload: { tagsInput: event.target.value } });
  }, []);

  const changeStageFilter = useCallback((stageFilter: StageFilterKey) => {
    dispatch({ type: 'SET_STAGE_FILTER', payload: { stageFilter } });
  }, []);

  const changeSearchQuery = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: { query: event.target.value } });
  }, []);

  const toggleFocusMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_FOCUS_MODE' });
  }, []);

  const togglePreviewMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_PREVIEW_MODE' });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const exportActiveNote = useCallback(async () => {
    if (!state.activeNoteId) {
      return;
    }

    let currentNote = state.notes.find((item) => item.id === state.activeNoteId);
    if (state.isDirty) {
      const saved = await persistCurrentDraft(
        state.activeNoteId,
        state.draftTitle,
        state.draftContent,
        state.draftTagsInput
      );
      if (saved) {
        currentNote = saved;
      }
    }

    const markdown = currentNote
      ? manageNotes.serializeNote(currentNote)
      : await manageNotes.exportNoteAsMarkdown(state.activeNoteId);
    const fileName = `${currentNote?.slug || state.activeNoteId}.md`;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);

    dispatch({
      type: 'SET_FEEDBACK',
      payload: {
        notice: {
          id: `export-${Date.now()}`,
          tone: 'success',
          message: `Exportado "${fileName}" con YAML frontmatter.`,
        },
      },
    });
  }, [
    state.activeNoteId,
    state.isDirty,
    state.draftTitle,
    state.draftContent,
    state.draftTagsInput,
    state.notes,
    manageNotes,
    persistCurrentDraft,
  ]);

  const triggerImportMarkdown = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) {
        return;
      }

      try {
        const rawText = await file.text();
        const imported = await manageNotes.importNoteFromMarkdown(rawText);
        let finalNote = imported;

        if (state.user) {
          const assignedFolderId =
            state.selectedProjectId !== 'ALL' ? state.selectedProjectId : null;
          const safeId = imported.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);
          const createdRemote = await notesRepository.create(
            {
              folderId: assignedFolderId,
              title: imported.title,
              slug: imported.slug,
              content: imported.content,
              excerpt: imported.excerpt,
              stage: imported.stage,
              tags: imported.tags,
              isPinned: false,
              isArchived: false,
              color: '',
            },
            state.user,
            safeId
          );
          finalNote = mapFirestoreNoteToDomain(createdRemote);
        }

        dispatch({ type: 'CREATE_NOTE_SUCCESS', payload: { note: finalNote } });
        dispatch({
          type: 'SET_FEEDBACK',
          payload: {
            notice: {
              id: `import-${Date.now()}`,
              tone: 'success',
              message: `Importado "${finalNote.title}" correctamente.`,
            },
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'El archivo Markdown no pudo importarse.';
        dispatch({
          type: 'SET_FEEDBACK',
          payload: { notice: { id: `import-err-${Date.now()}`, tone: 'error', message } },
        });
      }
    },
    [manageNotes, state.user, state.selectedProjectId]
  );

  const openSyncModal = useCallback(() => {
    const existing = syncWorkspace.getSyncConfig();
    dispatch({
      type: 'OPEN_SYNC_MODAL',
      payload: {
        isConfigured: syncWorkspace.isSyncConfigured(),
        config: existing
          ? {
              owner: existing.owner,
              repo: existing.repo,
              branch: existing.branch,
              basePath: existing.basePath,
              token: existing.token,
            }
          : {
              owner: '',
              repo: '',
              branch: 'main',
              basePath: 'notas',
              token: '',
            },
      },
    });
  }, [syncWorkspace]);

  const closeSyncModal = useCallback(() => {
    dispatch({ type: 'CLOSE_SYNC_MODAL' });
  }, []);

  const changeSyncConfigField = useCallback(
    (field: keyof SyncConfigDraftVM) => (event: ChangeEvent<HTMLInputElement>) => {
      dispatch({
        type: 'UPDATE_SYNC_CONFIG_FIELD',
        payload: { field, value: event.target.value },
      });
    },
    []
  );

  const submitSyncConfig = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      syncWorkspace.configureSync(state.syncConfigDraft);
      dispatch({
        type: 'SAVE_SYNC_CONFIG_SUCCESS',
        payload: { message: 'Repositorio GitHub vinculado correctamente.' },
      });
    },
    [state.syncConfigDraft, syncWorkspace]
  );

  const clearSyncConfig = useCallback(() => {
    syncWorkspace.clearSyncConfig();
    dispatch({ type: 'CLEAR_SYNC_CONFIG_SUCCESS' });
  }, [syncWorkspace]);

  const triggerSync = useCallback(async () => {
    if (!syncWorkspace.isSyncConfigured()) {
      openSyncModal();
      return;
    }

    if (!state.isOnline) {
      dispatch({
        type: 'SYNC_ERROR',
        payload: { message: 'Sin conexión a internet. Los cambios permanecen seguros en local.' },
      });
      return;
    }

    if (state.activeNoteId && state.isDirty) {
      await persistCurrentDraft(
        state.activeNoteId,
        state.draftTitle,
        state.draftContent,
        state.draftTagsInput
      );
    }

    dispatch({ type: 'SYNC_START' });
    try {
      const summary = await syncWorkspace.syncAll();
      const refreshedNotes = await manageNotes.listNotes();
      const tone = summary.conflictCount > 0 || summary.errors.length > 0 ? 'warning' : 'success';
      const summaryText = `Sincronización: ${summary.pushedCount} subidas, ${summary.pulledCount} descargadas${
        summary.conflictCount > 0 ? `, ${summary.conflictCount} conflictos` : ''
      }.`;

      dispatch({
        type: 'SYNC_SUCCESS',
        payload: {
          notes: refreshedNotes,
          notice: {
            id: `sync-${Date.now()}`,
            tone,
            message: summaryText,
          },
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Fallo al sincronizar con el repositorio remoto.';
      dispatch({ type: 'SYNC_ERROR', payload: { message } });
    }
  }, [
    state.isOnline,
    state.activeNoteId,
    state.isDirty,
    state.draftTitle,
    state.draftContent,
    state.draftTagsInput,
    syncWorkspace,
    manageNotes,
    openSyncModal,
    persistCurrentDraft,
  ]);

  const resolveConflictKeepLocal = useCallback(async () => {
    if (!state.activeNoteId) {
      return;
    }
    dispatch({ type: 'SYNC_START' });
    try {
      await syncWorkspace.resolveConflictKeepLocal(state.activeNoteId);
      const refreshed = await manageNotes.listNotes();
      dispatch({
        type: 'SYNC_SUCCESS',
        payload: {
          notes: refreshed,
          notice: {
            id: `resolve-local-${Date.now()}`,
            tone: 'success',
            message: 'Conflicto resuelto conservando la versión local.',
          },
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo resolver el conflicto.';
      dispatch({ type: 'SYNC_ERROR', payload: { message } });
    }
  }, [state.activeNoteId, syncWorkspace, manageNotes]);

  const resolveConflictKeepRemote = useCallback(async () => {
    if (!state.activeNoteId) {
      return;
    }
    dispatch({ type: 'SYNC_START' });
    try {
      const resolved = await syncWorkspace.resolveConflictKeepRemote(state.activeNoteId);
      const refreshed = await manageNotes.listNotes();
      dispatch({ type: 'SELECT_NOTE', payload: { note: resolved } });
      dispatch({
        type: 'SYNC_SUCCESS',
        payload: {
          notes: refreshed,
          notice: {
            id: `resolve-remote-${Date.now()}`,
            tone: 'success',
            message: 'Conflicto resuelto aplicando la versión remota.',
          },
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo aplicar la versión remota.';
      dispatch({ type: 'SYNC_ERROR', payload: { message } });
    }
  }, [state.activeNoteId, syncWorkspace, manageNotes]);

  const installPWA = useCallback(async () => {
    const promptEvent = deferredInstallPromptRef.current;
    if (!promptEvent) {
      return;
    }
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      deferredInstallPromptRef.current = null;
      dispatch({
        type: 'SET_PWA_STATE',
        payload: {
          isInstallable: false,
          isInstalled: true,
          isIOSDevice: state.isIOSDevice,
        },
      });
    }
  }, [state.isIOSDevice]);

  const openIOSInstallGuide = useCallback(() => {
    dispatch({ type: 'TOGGLE_IOS_GUIDE', payload: { isOpen: true } });
  }, []);

  const closeIOSInstallGuide = useCallback(() => {
    dispatch({ type: 'TOGGLE_IOS_GUIDE', payload: { isOpen: false } });
  }, []);

  const dismissFeedback = useCallback(() => {
    dispatch({ type: 'DISMISS_FEEDBACK' });
  }, []);

  const projectScopedNotes = useMemo<readonly Note[]>(() => {
    if (state.selectedProjectId === 'ALL') {
      return state.notes;
    }
    return state.notes.filter((note) => note.folderId === state.selectedProjectId);
  }, [state.notes, state.selectedProjectId]);

  const projectOptions = useMemo<readonly ProjectOptionVM[]>(() => {
    const countByProject = new Map<string, number>();
    for (const note of state.notes) {
      if (note.folderId) {
        countByProject.set(note.folderId, (countByProject.get(note.folderId) ?? 0) + 1);
      }
    }

    const allProjectsOption: ProjectOptionVM = {
      id: 'ALL',
      name: 'Todos los proyectos',
      color: '#1E3A5F',
      noteCount: state.notes.length,
      isActive: state.selectedProjectId === 'ALL',
    };

    const items: ProjectOptionVM[] = state.projects.map((folder) => ({
      id: folder.id,
      name: folder.name,
      color: folder.color || '#1E3A5F',
      noteCount: countByProject.get(folder.id) ?? 0,
      isActive: state.selectedProjectId === folder.id,
    }));

    return [allProjectsOption, ...items];
  }, [state.projects, state.notes, state.selectedProjectId]);

  const noteCards = useMemo<readonly NoteCardVM[]>(() => {
    const query = state.searchQuery.trim().toLowerCase();

    return projectScopedNotes
      .filter((note) => {
        if (state.stageFilter !== 'ALL' && note.stage !== state.stageFilter) {
          return false;
        }
        if (!query) {
          return true;
        }
        const haystack = `${note.title} ${note.content} ${note.tags.join(' ')}`.toLowerCase();
        return haystack.includes(query);
      })
      .map((note) => {
        const isSelected = note.id === state.activeNoteId;
        const effectiveTitle = isSelected ? state.draftTitle || 'Manuscrito sin título' : note.title;
        const effectiveContent = isSelected ? state.draftContent : note.content;
        const metrics = manageNotes.computeMetrics(effectiveContent);
        const wordLabel = `${metrics.wordCount} ${metrics.wordCount === 1 ? 'palabra' : 'palabras'}`;

        return {
          id: note.id,
          title: effectiveTitle,
          excerpt: note.excerpt || 'Sin contenido redactado aún.',
          stage: note.stage,
          stageLabel: STAGE_DESCRIPTORS[note.stage].label,
          syncStatus: note.syncStatus,
          syncLabel: SYNC_STATUS_LABELS[note.syncStatus],
          hasConflict: note.syncStatus === SyncStatus.CONFLICT,
          wordCountLabel: wordLabel,
          updatedAtLabel: formatRelativeDate(note.updatedAt),
          tagsLine: note.tags.join(' · '),
          isSelected,
          isConfirmingDelete: state.confirmDeleteId === note.id,
        };
      });
  }, [
    projectScopedNotes,
    state.stageFilter,
    state.searchQuery,
    state.activeNoteId,
    state.draftTitle,
    state.draftContent,
    state.confirmDeleteId,
    manageNotes,
  ]);

  const activeNote = useMemo<ActiveNoteVM | null>(() => {
    if (!state.activeNoteId) {
      return null;
    }
    const baseNote = state.notes.find((item) => item.id === state.activeNoteId);
    if (!baseNote) {
      return null;
    }

    const metrics = manageNotes.computeMetrics(state.draftContent);
    const descriptor = STAGE_DESCRIPTORS[baseNote.stage];

    return {
      id: baseNote.id,
      title: state.draftTitle,
      content: state.draftContent,
      tagsInput: state.draftTagsInput,
      stage: baseNote.stage,
      stageLabel: descriptor.label,
      stageDescription: descriptor.description,
      syncStatus: baseNote.syncStatus,
      syncLabel: SYNC_STATUS_LABELS[baseNote.syncStatus],
      hasConflict: baseNote.syncStatus === SyncStatus.CONFLICT,
      updatedAtLabel: formatRelativeDate(baseNote.updatedAt),
      wordCount: metrics.wordCount,
      characterCount: metrics.characterCount,
      paragraphCount: metrics.paragraphCount,
      readingTimeLabel:
        metrics.readingTimeMinutes === 0 ? '0 min lectura' : `${metrics.readingTimeMinutes} min lectura`,
      isDirty: state.isDirty,
      previewBlocks: state.isPreviewMode ? parseMarkdownPreviewBlocks(state.draftContent) : [],
    };
  }, [
    state.activeNoteId,
    state.notes,
    state.draftTitle,
    state.draftContent,
    state.draftTagsInput,
    state.isDirty,
    state.isPreviewMode,
    manageNotes,
  ]);

  const stageFilters = useMemo<readonly StageFilterOptionVM[]>(() => {
    const countByStage = new Map<WritingStage, number>();
    for (const note of projectScopedNotes) {
      countByStage.set(note.stage, (countByStage.get(note.stage) ?? 0) + 1);
    }

    const allOption: StageFilterOptionVM = {
      key: 'ALL',
      label: 'Todas',
      count: projectScopedNotes.length,
      isActive: state.stageFilter === 'ALL',
    };

    const stageOptions: StageFilterOptionVM[] = WRITING_STAGES_ORDER.map((stage) => ({
      key: stage,
      label: STAGE_DESCRIPTORS[stage].label,
      count: countByStage.get(stage) ?? 0,
      isActive: state.stageFilter === stage,
    }));

    return [allOption, ...stageOptions];
  }, [projectScopedNotes, state.stageFilter]);

  const allowedTransitions = useMemo<readonly StageTransitionOptionVM[]>(() => {
    if (!activeNote) {
      return [];
    }
    return transitionStage.getAvailableTransitions(activeNote.stage).map((targetStage) => ({
      targetStage,
      label: STAGE_DESCRIPTORS[targetStage].label,
      description: STAGE_DESCRIPTORS[targetStage].description,
    }));
  }, [activeNote, transitionStage]);

  const workspaceMetrics = useMemo<WorkspaceMetricsVM>(() => {
    let totalWords = 0;
    let pendingSyncCount = 0;
    let conflictCount = 0;

    for (const note of projectScopedNotes) {
      const text = note.id === state.activeNoteId ? state.draftContent : note.content;
      totalWords += manageNotes.computeMetrics(text).wordCount;
      if (note.syncStatus === SyncStatus.LOCAL_ONLY || note.syncStatus === SyncStatus.PENDING_SYNC) {
        pendingSyncCount += 1;
      }
      if (note.syncStatus === SyncStatus.CONFLICT) {
        conflictCount += 1;
      }
    }

    return {
      totalNotes: projectScopedNotes.length,
      totalWordsLabel: `${totalWords.toLocaleString('es-ES')} palabras`,
      pendingSyncCount,
      conflictCount,
    };
  }, [projectScopedNotes, state.activeNoteId, state.draftContent, manageNotes]);

  return {
    vm: {
      ui: state,
      projectOptions,
      noteCards,
      activeNote,
      stageFilters,
      allowedTransitions,
      workspaceMetrics,
      fileInputRef,
    },
    actions: {
      signInWithGoogle,
      signOutUser,
      selectProject,
      openNewProjectModal,
      closeNewProjectModal,
      changeNewProjectName,
      changeNewProjectColor,
      submitNewProject,
      selectNote,
      createNote,
      saveActiveNote,
      requestDeleteNote,
      cancelDeleteNote,
      confirmDeleteNote,
      transitionNoteStage,
      changeDraftTitle,
      changeDraftContent,
      changeDraftTags,
      changeStageFilter,
      changeSearchQuery,
      toggleFocusMode,
      togglePreviewMode,
      toggleSidebar,
      exportActiveNote,
      triggerImportMarkdown,
      handleImportFileChange,
      triggerSync,
      openSyncModal,
      closeSyncModal,
      changeSyncConfigField,
      submitSyncConfig,
      clearSyncConfig,
      resolveConflictKeepLocal,
      resolveConflictKeepRemote,
      installPWA,
      openIOSInstallGuide,
      closeIOSInstallGuide,
      dismissFeedback,
    },
  };
}
