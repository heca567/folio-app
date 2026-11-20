import { Note } from '../../domain/models/note.model';
import type { Folder, UserProfile } from '../../types';
import {
  EditorUIState,
  FeedbackNoticeVM,
  ProjectFilterKey,
  StageFilterKey,
  SyncConfigDraftVM,
} from './editor-ui.state';

export type EditorUIAction =
  | { readonly type: 'SET_AUTH_STATE'; readonly payload: { readonly user: UserProfile | null } }
  | { readonly type: 'SIGN_IN_START' }
  | { readonly type: 'SIGN_IN_ERROR'; readonly payload: { readonly message: string } }
  | { readonly type: 'SIGN_OUT_SUCCESS' }
  | { readonly type: 'SET_PROJECTS'; readonly payload: { readonly projects: readonly Folder[] } }
  | { readonly type: 'SELECT_PROJECT'; readonly payload: { readonly projectId: ProjectFilterKey } }
  | { readonly type: 'OPEN_PROJECT_MODAL' }
  | { readonly type: 'CLOSE_PROJECT_MODAL' }
  | { readonly type: 'UPDATE_NEW_PROJECT_NAME'; readonly payload: { readonly name: string } }
  | { readonly type: 'UPDATE_NEW_PROJECT_COLOR'; readonly payload: { readonly color: string } }
  | { readonly type: 'CREATE_PROJECT_START' }
  | { readonly type: 'CREATE_PROJECT_SUCCESS'; readonly payload: { readonly project: Folder } }
  | { readonly type: 'CREATE_PROJECT_ERROR'; readonly payload: { readonly message: string } }
  | { readonly type: 'LOAD_NOTES_START' }
  | { readonly type: 'LOAD_NOTES_SUCCESS'; readonly payload: { readonly notes: readonly Note[] } }
  | { readonly type: 'LOAD_NOTES_ERROR'; readonly payload: { readonly message: string } }
  | { readonly type: 'SELECT_NOTE'; readonly payload: { readonly note: Note } }
  | { readonly type: 'CREATE_NOTE_SUCCESS'; readonly payload: { readonly note: Note } }
  | { readonly type: 'UPDATE_DRAFT_TITLE'; readonly payload: { readonly title: string } }
  | { readonly type: 'UPDATE_DRAFT_CONTENT'; readonly payload: { readonly content: string } }
  | { readonly type: 'UPDATE_DRAFT_TAGS'; readonly payload: { readonly tagsInput: string } }
  | { readonly type: 'SAVE_NOTE_START' }
  | { readonly type: 'SAVE_NOTE_SUCCESS'; readonly payload: { readonly note: Note } }
  | { readonly type: 'SAVE_NOTE_ERROR'; readonly payload: { readonly message: string } }
  | { readonly type: 'DELETE_NOTE_REQUEST'; readonly payload: { readonly noteId: string } }
  | { readonly type: 'DELETE_NOTE_CANCEL' }
  | { readonly type: 'DELETE_NOTE_SUCCESS'; readonly payload: { readonly noteId: string } }
  | { readonly type: 'TRANSITION_STAGE_SUCCESS'; readonly payload: { readonly note: Note } }
  | { readonly type: 'SET_STAGE_FILTER'; readonly payload: { readonly stageFilter: StageFilterKey } }
  | { readonly type: 'SET_SEARCH_QUERY'; readonly payload: { readonly query: string } }
  | { readonly type: 'TOGGLE_FOCUS_MODE' }
  | { readonly type: 'TOGGLE_PREVIEW_MODE' }
  | { readonly type: 'TOGGLE_SIDEBAR' }
  | { readonly type: 'SYNC_START' }
  | {
      readonly type: 'SYNC_SUCCESS';
      readonly payload: { readonly notes: readonly Note[]; readonly notice: FeedbackNoticeVM };
    }
  | { readonly type: 'SYNC_ERROR'; readonly payload: { readonly message: string } }
  | {
      readonly type: 'OPEN_SYNC_MODAL';
      readonly payload: { readonly config: SyncConfigDraftVM; readonly isConfigured: boolean };
    }
  | { readonly type: 'CLOSE_SYNC_MODAL' }
  | {
      readonly type: 'UPDATE_SYNC_CONFIG_FIELD';
      readonly payload: { readonly field: keyof SyncConfigDraftVM; readonly value: string };
    }
  | { readonly type: 'SAVE_SYNC_CONFIG_SUCCESS'; readonly payload: { readonly message: string } }
  | { readonly type: 'CLEAR_SYNC_CONFIG_SUCCESS' }
  | { readonly type: 'SET_SYNC_STATUS_FLAG'; readonly payload: { readonly isConfigured: boolean } }
  | { readonly type: 'SET_ONLINE_STATUS'; readonly payload: { readonly isOnline: boolean } }
  | {
      readonly type: 'SET_PWA_STATE';
      readonly payload: {
        readonly isInstallable: boolean;
        readonly isInstalled: boolean;
        readonly isIOSDevice: boolean;
      };
    }
  | { readonly type: 'TOGGLE_IOS_GUIDE'; readonly payload: { readonly isOpen: boolean } }
  | { readonly type: 'SET_FEEDBACK'; readonly payload: { readonly notice: FeedbackNoticeVM } }
  | { readonly type: 'DISMISS_FEEDBACK' };

function upsertSortedNote(notes: readonly Note[], target: Note): readonly Note[] {
  const withoutTarget = notes.filter((item) => item.id !== target.id);
  return [target, ...withoutTarget].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function formatTagsForDraft(tags: readonly string[]): string {
  return tags.join(', ');
}

function hydrateDraftFromNote(note: Note | null): {
  readonly activeNoteId: string | null;
  readonly draftTitle: string;
  readonly draftContent: string;
  readonly draftTagsInput: string;
} {
  if (!note) {
    return {
      activeNoteId: null,
      draftTitle: '',
      draftContent: '',
      draftTagsInput: '',
    };
  }
  return {
    activeNoteId: note.id,
    draftTitle: note.title,
    draftContent: note.content,
    draftTagsInput: formatTagsForDraft(note.tags),
  };
}

export function editorUIReducer(state: EditorUIState, action: EditorUIAction): EditorUIState {
  switch (action.type) {
    case 'SET_AUTH_STATE':
      return {
        ...state,
        user: action.payload.user,
        isAuthReady: true,
        isSigningIn: false,
        ...(action.payload.user
          ? {}
          : { projects: [], selectedProjectId: 'ALL' }),
      };

    case 'SIGN_IN_START':
      return {
        ...state,
        isSigningIn: true,
      };

    case 'SIGN_IN_ERROR':
      return {
        ...state,
        isSigningIn: false,
        feedback: {
          id: `auth-err-${Date.now()}`,
          tone: 'error',
          message: action.payload.message,
        },
      };

    case 'SIGN_OUT_SUCCESS':
      return {
        ...state,
        user: null,
        projects: [],
        selectedProjectId: 'ALL',
        isProjectModalOpen: false,
        feedback: {
          id: `signout-${Date.now()}`,
          tone: 'info',
          message: 'Sesión cerrada. Trabajando en modo local.',
        },
      };

    case 'SET_PROJECTS': {
      const stillExists =
        state.selectedProjectId === 'ALL' ||
        action.payload.projects.some((p) => p.id === state.selectedProjectId);
      return {
        ...state,
        projects: action.payload.projects,
        selectedProjectId: stillExists ? state.selectedProjectId : 'ALL',
      };
    }

    case 'SELECT_PROJECT':
      return {
        ...state,
        selectedProjectId: action.payload.projectId,
      };

    case 'OPEN_PROJECT_MODAL':
      return {
        ...state,
        isProjectModalOpen: true,
        newProjectName: '',
        newProjectColor: '#1E3A5F',
      };

    case 'CLOSE_PROJECT_MODAL':
      return {
        ...state,
        isProjectModalOpen: false,
        isCreatingProject: false,
      };

    case 'UPDATE_NEW_PROJECT_NAME':
      return {
        ...state,
        newProjectName: action.payload.name,
      };

    case 'UPDATE_NEW_PROJECT_COLOR':
      return {
        ...state,
        newProjectColor: action.payload.color,
      };

    case 'CREATE_PROJECT_START':
      return {
        ...state,
        isCreatingProject: true,
      };

    case 'CREATE_PROJECT_SUCCESS': {
      const exists = state.projects.some((p) => p.id === action.payload.project.id);
      const nextProjects = exists
        ? state.projects
        : [...state.projects, action.payload.project].sort((a, b) =>
            a.name.localeCompare(b.name, 'es')
          );
      return {
        ...state,
        projects: nextProjects,
        selectedProjectId: action.payload.project.id,
        isCreatingProject: false,
        isProjectModalOpen: false,
        newProjectName: '',
        feedback: {
          id: `proj-created-${Date.now()}`,
          tone: 'success',
          message: `Proyecto "${action.payload.project.name}" creado en Firestore.`,
        },
      };
    }

    case 'CREATE_PROJECT_ERROR':
      return {
        ...state,
        isCreatingProject: false,
        feedback: {
          id: `proj-err-${Date.now()}`,
          tone: 'error',
          message: action.payload.message,
        },
      };

    case 'LOAD_NOTES_START':
      return {
        ...state,
        isLoading: true,
      };

    case 'LOAD_NOTES_SUCCESS': {
      const sorted = [...action.payload.notes].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt)
      );
      const currentSelected = sorted.find((note) => note.id === state.activeNoteId) ?? sorted[0] ?? null;
      const hydrated = state.isDirty
        ? {
            activeNoteId: state.activeNoteId,
            draftTitle: state.draftTitle,
            draftContent: state.draftContent,
            draftTagsInput: state.draftTagsInput,
          }
        : hydrateDraftFromNote(currentSelected);

      return {
        ...state,
        notes: sorted,
        ...hydrated,
        isLoading: false,
      };
    }

    case 'LOAD_NOTES_ERROR':
      return {
        ...state,
        isLoading: false,
        feedback: {
          id: 'load-error',
          tone: 'error',
          message: action.payload.message,
        },
      };

    case 'SELECT_NOTE':
      return {
        ...state,
        ...hydrateDraftFromNote(action.payload.note),
        isDirty: false,
        confirmDeleteId: null,
      };

    case 'CREATE_NOTE_SUCCESS': {
      const nextNotes = upsertSortedNote(state.notes, action.payload.note);
      return {
        ...state,
        notes: nextNotes,
        ...hydrateDraftFromNote(action.payload.note),
        isDirty: false,
        isPreviewMode: false,
        confirmDeleteId: null,
      };
    }

    case 'UPDATE_DRAFT_TITLE':
      return {
        ...state,
        draftTitle: action.payload.title,
        isDirty: true,
      };

    case 'UPDATE_DRAFT_CONTENT':
      return {
        ...state,
        draftContent: action.payload.content,
        isDirty: true,
      };

    case 'UPDATE_DRAFT_TAGS':
      return {
        ...state,
        draftTagsInput: action.payload.tagsInput,
        isDirty: true,
      };

    case 'SAVE_NOTE_START':
      return {
        ...state,
        isSaving: true,
      };

    case 'SAVE_NOTE_SUCCESS': {
      const saved = action.payload.note;
      const nextNotes = upsertSortedNote(state.notes, saved);
      const isStillActive = state.activeNoteId === saved.id;
      return {
        ...state,
        notes: nextNotes,
        isSaving: false,
        isDirty: isStillActive ? false : state.isDirty,
      };
    }

    case 'SAVE_NOTE_ERROR':
      return {
        ...state,
        isSaving: false,
        feedback: {
          id: 'save-error',
          tone: 'error',
          message: action.payload.message,
        },
      };

    case 'DELETE_NOTE_REQUEST':
      return {
        ...state,
        confirmDeleteId: action.payload.noteId,
      };

    case 'DELETE_NOTE_CANCEL':
      return {
        ...state,
        confirmDeleteId: null,
      };

    case 'DELETE_NOTE_SUCCESS': {
      const remaining = state.notes.filter((note) => note.id !== action.payload.noteId);
      const nextActive =
        state.activeNoteId === action.payload.noteId
          ? remaining[0] ?? null
          : remaining.find((note) => note.id === state.activeNoteId) ?? null;

      return {
        ...state,
        notes: remaining,
        ...(state.activeNoteId === action.payload.noteId
          ? { ...hydrateDraftFromNote(nextActive), isDirty: false }
          : {}),
        confirmDeleteId: null,
        feedback: {
          id: `deleted-${action.payload.noteId}`,
          tone: 'info',
          message: 'Manuscrito eliminado del archivo local.',
        },
      };
    }

    case 'TRANSITION_STAGE_SUCCESS': {
      const updated = action.payload.note;
      return {
        ...state,
        notes: upsertSortedNote(state.notes, updated),
      };
    }

    case 'SET_STAGE_FILTER':
      return {
        ...state,
        stageFilter: action.payload.stageFilter,
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload.query,
      };

    case 'TOGGLE_FOCUS_MODE':
      return {
        ...state,
        isFocusMode: !state.isFocusMode,
        isSidebarOpen: state.isFocusMode ? true : false,
      };

    case 'TOGGLE_PREVIEW_MODE':
      return {
        ...state,
        isPreviewMode: !state.isPreviewMode,
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        isSidebarOpen: !state.isSidebarOpen,
      };

    case 'SYNC_START':
      return {
        ...state,
        isSyncing: true,
      };

    case 'SYNC_SUCCESS': {
      const sorted = [...action.payload.notes].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt)
      );
      const refreshedActive = sorted.find((note) => note.id === state.activeNoteId) ?? sorted[0] ?? null;
      return {
        ...state,
        notes: sorted,
        ...(state.isDirty ? {} : hydrateDraftFromNote(refreshedActive)),
        isSyncing: false,
        feedback: action.payload.notice,
      };
    }

    case 'SYNC_ERROR':
      return {
        ...state,
        isSyncing: false,
        feedback: {
          id: 'sync-error',
          tone: 'error',
          message: action.payload.message,
        },
      };

    case 'OPEN_SYNC_MODAL':
      return {
        ...state,
        isSyncModalOpen: true,
        syncConfigDraft: action.payload.config,
        isSyncConfigured: action.payload.isConfigured,
      };

    case 'CLOSE_SYNC_MODAL':
      return {
        ...state,
        isSyncModalOpen: false,
      };

    case 'UPDATE_SYNC_CONFIG_FIELD':
      return {
        ...state,
        syncConfigDraft: {
          ...state.syncConfigDraft,
          [action.payload.field]: action.payload.value,
        },
      };

    case 'SAVE_SYNC_CONFIG_SUCCESS':
      return {
        ...state,
        isSyncConfigured: true,
        isSyncModalOpen: false,
        feedback: {
          id: 'sync-config-saved',
          tone: 'success',
          message: action.payload.message,
        },
      };

    case 'CLEAR_SYNC_CONFIG_SUCCESS':
      return {
        ...state,
        isSyncConfigured: false,
        syncConfigDraft: {
          owner: '',
          repo: '',
          branch: 'main',
          basePath: 'notas',
          token: '',
        },
        isSyncModalOpen: false,
        feedback: {
          id: 'sync-config-cleared',
          tone: 'info',
          message: 'Credenciales de sincronización eliminadas.',
        },
      };

    case 'SET_SYNC_STATUS_FLAG':
      return {
        ...state,
        isSyncConfigured: action.payload.isConfigured,
      };

    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload.isOnline,
      };

    case 'SET_PWA_STATE':
      return {
        ...state,
        isPWAInstallable: action.payload.isInstallable,
        isPWAInstalled: action.payload.isInstalled,
        isIOSDevice: action.payload.isIOSDevice,
      };

    case 'TOGGLE_IOS_GUIDE':
      return {
        ...state,
        isIOSInstallGuideOpen: action.payload.isOpen,
      };

    case 'SET_FEEDBACK':
      return {
        ...state,
        feedback: action.payload.notice,
      };

    case 'DISMISS_FEEDBACK':
      return {
        ...state,
        feedback: null,
      };

    default:
      return state;
  }
}
