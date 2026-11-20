import { buildSlug, DomainValidationError, extractExcerpt, Note, SyncStatus } from '../models/note.model';
import { MarkdownCodec } from '../ports/markdown.codec';
import { NoteRepository } from '../ports/note.repository';
import { RemoteNoteFile, RemoteSyncConfig, SyncGateway, SyncGatewayError } from '../ports/sync.gateway';

export interface SyncWorkspaceDependencies {
  readonly noteRepository: NoteRepository;
  readonly syncGateway: SyncGateway;
  readonly markdownCodec: MarkdownCodec;
  readonly now?: () => string;
}

export interface SyncConflict {
  readonly noteId: string;
  readonly title: string;
  readonly localUpdatedAt: string;
  readonly remoteSha: string;
  readonly reason: string;
}

export interface SyncSummary {
  readonly pushedCount: number;
  readonly pulledCount: number;
  readonly conflictCount: number;
  readonly conflicts: readonly SyncConflict[];
  readonly syncedAt: string;
  readonly errors: readonly string[];
}

export class SyncWorkspaceUseCase {
  private readonly noteRepository: NoteRepository;
  private readonly syncGateway: SyncGateway;
  private readonly markdownCodec: MarkdownCodec;
  private readonly now: () => string;

  constructor(deps: SyncWorkspaceDependencies) {
    this.noteRepository = deps.noteRepository;
    this.syncGateway = deps.syncGateway;
    this.markdownCodec = deps.markdownCodec;
    this.now = deps.now ?? (() => new Date().toISOString());
  }

  public isSyncConfigured(): boolean {
    return this.syncGateway.isConfigured();
  }

  public getSyncConfig(): RemoteSyncConfig | null {
    return this.syncGateway.getConfig();
  }

  public configureSync(config: RemoteSyncConfig): void {
    this.syncGateway.configure(config);
  }

  public clearSyncConfig(): void {
    this.syncGateway.clearConfig();
  }

  public async checkSyncConnection(): Promise<boolean> {
    return this.syncGateway.checkConnection();
  }

  public async syncAll(): Promise<SyncSummary> {
    if (!this.syncGateway.isConfigured()) {
      throw new SyncGatewayError('La pasarela de sincronización remota no está configurada.');
    }

    const [localNotes, remoteFiles] = await Promise.all([
      this.noteRepository.getAll(),
      this.syncGateway.pullAllFiles(),
    ]);

    const localById = new Map<string, Note>(localNotes.map((note) => [note.id, note]));
    const localByFileName = new Map<string, Note>(
      localNotes.map((note) => [this.buildFileName(note), note])
    );

    let pushedCount = 0;
    let pulledCount = 0;
    const conflicts: SyncConflict[] = [];
    const errors: string[] = [];
    const processedNoteIds = new Set<string>();

    for (const remoteFile of remoteFiles) {
      try {
        const remoteIdFallback = remoteFile.fileName.replace(/\.md$/i, '');
        const parsedRemote = this.markdownCodec.deserialize(remoteFile.rawContent, remoteIdFallback);
        const existingLocal = localById.get(parsedRemote.id) ?? localByFileName.get(remoteFile.fileName);

        if (!existingLocal) {
          const syncedRemoteNote: Note = {
            ...parsedRemote,
            slug: buildSlug(parsedRemote.title, parsedRemote.id),
            excerpt: extractExcerpt(parsedRemote.content),
            syncStatus: SyncStatus.SYNCED,
            remoteSha: remoteFile.sha,
            lastSyncedAt: this.now(),
          };
          await this.noteRepository.save(syncedRemoteNote);
          processedNoteIds.add(syncedRemoteNote.id);
          pulledCount += 1;
          continue;
        }

        processedNoteIds.add(existingLocal.id);

        if (existingLocal.syncStatus === SyncStatus.SYNCED) {
          if (existingLocal.remoteSha !== remoteFile.sha) {
            const updatedFromRemote: Note = {
              ...parsedRemote,
              id: existingLocal.id,
              slug: buildSlug(parsedRemote.title, existingLocal.id),
              excerpt: extractExcerpt(parsedRemote.content),
              syncStatus: SyncStatus.SYNCED,
              remoteSha: remoteFile.sha,
              createdAt: existingLocal.createdAt,
              lastSyncedAt: this.now(),
            };
            await this.noteRepository.save(updatedFromRemote);
            pulledCount += 1;
          }
          continue;
        }

        const hasRemoteDiverged =
          existingLocal.remoteSha !== undefined && existingLocal.remoteSha !== remoteFile.sha;

        if (hasRemoteDiverged || existingLocal.syncStatus === SyncStatus.CONFLICT) {
          const conflictedNote: Note = {
            ...existingLocal,
            syncStatus: SyncStatus.CONFLICT,
          };
          await this.noteRepository.save(conflictedNote);
          conflicts.push({
            noteId: existingLocal.id,
            title: existingLocal.title,
            localUpdatedAt: existingLocal.updatedAt,
            remoteSha: remoteFile.sha,
            reason: 'El archivo remoto cambió desde la última sincronización local.',
          });
          continue;
        }

        await this.pushNoteWithSha(existingLocal, remoteFile.sha);
        pushedCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido al procesar archivo remoto.';
        errors.push(`${remoteFile.fileName}: ${message}`);
      }
    }

    for (const localNote of localNotes) {
      if (processedNoteIds.has(localNote.id)) {
        continue;
      }

      if (
        localNote.syncStatus === SyncStatus.LOCAL_ONLY ||
        localNote.syncStatus === SyncStatus.PENDING_SYNC
      ) {
        try {
          await this.pushNoteWithSha(localNote, localNote.remoteSha);
          pushedCount += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error desconocido al subir nota local.';
          errors.push(`${localNote.title}: ${message}`);
        }
      }
    }

    return {
      pushedCount,
      pulledCount,
      conflictCount: conflicts.length,
      conflicts,
      syncedAt: this.now(),
      errors,
    };
  }

  public async pushSingleNote(noteId: string): Promise<Note> {
    if (!this.syncGateway.isConfigured()) {
      throw new SyncGatewayError('La pasarela de sincronización remota no está configurada.');
    }

    const note = await this.noteRepository.getById(noteId);
    if (!note) {
      throw new DomainValidationError(`No existe ninguna nota con el identificador "${noteId}".`);
    }

    return this.pushNoteWithSha(note, note.remoteSha);
  }

  public async resolveConflictKeepLocal(noteId: string): Promise<Note> {
    if (!this.syncGateway.isConfigured()) {
      throw new SyncGatewayError('La pasarela de sincronización remota no está configurada.');
    }

    const localNote = await this.noteRepository.getById(noteId);
    if (!localNote) {
      throw new DomainValidationError(`No existe ninguna nota con el identificador "${noteId}".`);
    }

    const remoteFiles = await this.syncGateway.pullAllFiles();
    const matchingRemote = this.findMatchingRemoteFile(localNote, remoteFiles);

    return this.pushNoteWithSha(localNote, matchingRemote?.sha ?? localNote.remoteSha);
  }

  public async resolveConflictKeepRemote(noteId: string): Promise<Note> {
    if (!this.syncGateway.isConfigured()) {
      throw new SyncGatewayError('La pasarela de sincronización remota no está configurada.');
    }

    const localNote = await this.noteRepository.getById(noteId);
    if (!localNote) {
      throw new DomainValidationError(`No existe ninguna nota con el identificador "${noteId}".`);
    }

    const remoteFiles = await this.syncGateway.pullAllFiles();
    const matchingRemote = this.findMatchingRemoteFile(localNote, remoteFiles);
    if (!matchingRemote) {
      throw new SyncGatewayError(`No se encontró una versión remota para "${localNote.title}".`);
    }

    const parsedRemote = this.markdownCodec.deserialize(matchingRemote.rawContent, localNote.id);
    const resolvedNote: Note = {
      ...parsedRemote,
      id: localNote.id,
      slug: buildSlug(parsedRemote.title, localNote.id),
      excerpt: extractExcerpt(parsedRemote.content),
      syncStatus: SyncStatus.SYNCED,
      remoteSha: matchingRemote.sha,
      createdAt: localNote.createdAt,
      lastSyncedAt: this.now(),
    };

    return this.noteRepository.save(resolvedNote);
  }

  private async pushNoteWithSha(note: Note, existingSha?: string): Promise<Note> {
    const fileName = this.buildFileName(note);
    const serialized = this.markdownCodec.serialize(note);
    const pushResult = await this.syncGateway.pushFile(fileName, serialized, existingSha);

    const syncedNote: Note = {
      ...note,
      syncStatus: SyncStatus.SYNCED,
      remoteSha: pushResult.sha,
      lastSyncedAt: pushResult.syncedAt,
    };

    return this.noteRepository.save(syncedNote);
  }

  private buildFileName(note: Note): string {
    return `${note.slug || note.id}.md`;
  }

  private findMatchingRemoteFile(note: Note, remoteFiles: readonly RemoteNoteFile[]): RemoteNoteFile | undefined {
    const expectedName = this.buildFileName(note);
    return remoteFiles.find((file) => {
      if (file.fileName === expectedName) {
        return true;
      }
      try {
        const parsed = this.markdownCodec.deserialize(file.rawContent, '');
        return parsed.id === note.id;
      } catch {
        return false;
      }
    });
  }
}
