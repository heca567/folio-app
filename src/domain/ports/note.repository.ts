import { Note } from '../models/note.model';

export interface NoteRepository {
  getAll(): Promise<readonly Note[]>;
  getById(id: string): Promise<Note | null>;
  save(note: Note): Promise<Note>;
  delete(id: string): Promise<void>;
}
