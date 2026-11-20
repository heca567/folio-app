import {
  buildSlug,
  calculateTextMetrics,
  DomainValidationError,
  extractExcerpt,
  markDirtySyncStatus,
  normalizeTags,
  Note,
  NoteInput,
  NotePatch,
  SyncStatus,
  TextMetrics,
} from '../models/note.model';
import { WritingStage } from '../models/writing-flow.model';
import { MarkdownCodec } from '../ports/markdown.codec';
import { NoteRepository } from '../ports/note.repository';

export interface ManageNotesDependencies {
  readonly noteRepository: NoteRepository;
  readonly markdownCodec: MarkdownCodec;
  readonly generateId?: () => string;
  readonly now?: () => string;
}

function defaultGenerateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `note_${timestamp}_${randomPart}`;
}

function defaultNow(): string {
  return new Date().toISOString();
}

export class ManageNotesUseCase {
  private readonly noteRepository: NoteRepository;
  private readonly markdownCodec: MarkdownCodec;
  private readonly generateId: () => string;
  private readonly now: () => string;

  constructor(deps: ManageNotesDependencies) {
    this.noteRepository = deps.noteRepository;
    this.markdownCodec = deps.markdownCodec;
    this.generateId = deps.generateId ?? defaultGenerateId;
    this.now = deps.now ?? defaultNow;
  }

  public async listNotes(): Promise<readonly Note[]> {
    const notes = await this.noteRepository.getAll();
    return [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  public async getNoteById(id: string): Promise<Note | null> {
    if (!id.trim()) {
      throw new DomainValidationError('El identificador de la nota no puede estar vacío.');
    }
    return this.noteRepository.getById(id);
  }

  public async createNote(input: NoteInput): Promise<Note> {
    const cleanTitle = input.title.trim() || 'Manuscrito sin título';
    const id = input.id?.trim() || this.generateId();
    const timestamp = this.now();
    const content = input.content;

    const note: Note = {
      id,
      folderId: input.folderId ?? null,
      slug: buildSlug(cleanTitle, id),
      title: cleanTitle,
      content,
      excerpt: extractExcerpt(content),
      stage: input.stage ?? WritingStage.SEED,
      tags: normalizeTags(input.tags),
      syncStatus: SyncStatus.LOCAL_ONLY,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return this.noteRepository.save(note);
  }

  public async updateNote(id: string, patch: NotePatch): Promise<Note> {
    const existing = await this.noteRepository.getById(id);
    if (!existing) {
      throw new DomainValidationError(`No existe ninguna nota con el identificador "${id}".`);
    }

    const nextTitle = patch.title !== undefined ? patch.title.trim() || 'Manuscrito sin título' : existing.title;
    const nextContent = patch.content !== undefined ? patch.content : existing.content;
    const nextTags = patch.tags !== undefined ? normalizeTags(patch.tags) : existing.tags;

    const updatedNote: Note = {
      ...existing,
      title: nextTitle,
      slug: buildSlug(nextTitle, existing.id),
      content: nextContent,
      excerpt: extractExcerpt(nextContent),
      tags: nextTags,
      syncStatus: markDirtySyncStatus(existing.syncStatus, Boolean(existing.remoteSha)),
      updatedAt: this.now(),
    };

    return this.noteRepository.save(updatedNote);
  }

  public async deleteNote(id: string): Promise<void> {
    const existing = await this.noteRepository.getById(id);
    if (!existing) {
      throw new DomainValidationError(`No existe ninguna nota con el identificador "${id}".`);
    }
    await this.noteRepository.delete(id);
  }

  public computeMetrics(content: string): TextMetrics {
    return calculateTextMetrics(content);
  }

  public serializeNote(note: Note): string {
    return this.markdownCodec.serialize(note);
  }

  public async exportNoteAsMarkdown(id: string): Promise<string> {
    const existing = await this.noteRepository.getById(id);
    if (!existing) {
      throw new DomainValidationError(`No existe ninguna nota con el identificador "${id}".`);
    }
    return this.markdownCodec.serialize(existing);
  }

  public async importNoteFromMarkdown(rawMarkdown: string): Promise<Note> {
    const fallbackId = this.generateId();
    const parsed = this.markdownCodec.deserialize(rawMarkdown, fallbackId);
    const existing = await this.noteRepository.getById(parsed.id);
    const timestamp = this.now();

    const noteToSave: Note = {
      ...parsed,
      slug: buildSlug(parsed.title, parsed.id),
      excerpt: extractExcerpt(parsed.content),
      syncStatus: existing
        ? markDirtySyncStatus(existing.syncStatus, Boolean(existing.remoteSha))
        : SyncStatus.LOCAL_ONLY,
      remoteSha: existing?.remoteSha,
      createdAt: existing?.createdAt ?? parsed.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    return this.noteRepository.save(noteToSave);
  }
}
