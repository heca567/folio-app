import { ManageNotesUseCase } from '../domain/use-cases/manage-notes.usecase';
import { SyncWorkspaceUseCase } from '../domain/use-cases/sync-workspace.usecase';
import { TransitionStageUseCase } from '../domain/use-cases/transition-stage.usecase';
import { FrontmatterMarkdownCodec } from '../infrastructure/codecs/frontmatter-markdown.codec';
import { IndexedDBNoteRepository } from '../infrastructure/persistence/indexeddb-note.repository';
import { MemoryNoteRepository } from '../infrastructure/persistence/memory-note.repository';
import { GitHubRepoGateway } from '../infrastructure/sync/github-repo.gateway';

export interface AppContainer {
  readonly manageNotes: ManageNotesUseCase;
  readonly transitionStage: TransitionStageUseCase;
  readonly syncWorkspace: SyncWorkspaceUseCase;
}

export interface ContainerOptions {
  readonly useMemoryPersistence?: boolean;
}

export function createAppContainer(options: ContainerOptions = {}): AppContainer {
  const shouldUseMemory =
    options.useMemoryPersistence ?? typeof indexedDB === 'undefined';

  const noteRepository = shouldUseMemory
    ? new MemoryNoteRepository()
    : new IndexedDBNoteRepository();

  const markdownCodec = new FrontmatterMarkdownCodec();
  const syncGateway = new GitHubRepoGateway();

  const manageNotes = new ManageNotesUseCase({
    noteRepository,
    markdownCodec,
  });

  const transitionStage = new TransitionStageUseCase({
    noteRepository,
  });

  const syncWorkspace = new SyncWorkspaceUseCase({
    noteRepository,
    syncGateway,
    markdownCodec,
  });

  return {
    manageNotes,
    transitionStage,
    syncWorkspace,
  };
}

export const appContainer: AppContainer = createAppContainer();
