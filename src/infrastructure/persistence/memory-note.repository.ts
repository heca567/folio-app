import { Note } from '../../domain/models/note.model';
import { NoteRepository } from '../../domain/ports/note.repository';

export class MemoryNoteRepository implements NoteRepository {
  private readonly store = new Map<string, Note>();

  constructor(initialNotes: readonly Note[] = []) {
    for (const note of initialNotes) {
      this.store.set(note.id, this.cloneNote(note));
    }
  }

  public async getAll(): Promise<readonly Note[]> {
    return Array.from(this.store.values(), (note) => this.cloneNote(note));
  }

  public async getById(id: string): Promise<Note | null> {
    const found = this.store.get(id);
    return found ? this.cloneNote(found) : null;
  }

  public async save(note: Note): Promise<Note> {
    const copy = this.cloneNote(note);
    this.store.set(note.id, copy);
    return this.cloneNote(copy);
  }

  public async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  public clear(): void {
    this.store.clear();
  }

  private cloneNote(note: Note): Note {
    return {
      ...note,
      tags: [...note.tags],
    };
  }
}
