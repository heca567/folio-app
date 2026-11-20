import { Note } from '../models/note.model';

export class MarkdownCodecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarkdownCodecError';
  }
}

export interface MarkdownCodec {
  serialize(note: Note): string;
  deserialize(rawMarkdown: string, fallbackId: string): Note;
}
