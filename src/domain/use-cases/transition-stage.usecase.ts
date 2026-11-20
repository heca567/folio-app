import { DomainValidationError, markDirtySyncStatus, Note } from '../models/note.model';
import {
  canTransitionStage,
  getAllowedTransitions,
  StageTransitionError,
  WritingStage,
} from '../models/writing-flow.model';
import { NoteRepository } from '../ports/note.repository';

export interface TransitionStageDependencies {
  readonly noteRepository: NoteRepository;
  readonly now?: () => string;
}

export class TransitionStageUseCase {
  private readonly noteRepository: NoteRepository;
  private readonly now: () => string;

  constructor(deps: TransitionStageDependencies) {
    this.noteRepository = deps.noteRepository;
    this.now = deps.now ?? (() => new Date().toISOString());
  }

  public async execute(noteId: string, targetStage: WritingStage): Promise<Note> {
    const note = await this.noteRepository.getById(noteId);
    if (!note) {
      throw new DomainValidationError(`No se encontró la nota "${noteId}" para cambiar de etapa.`);
    }

    if (note.stage === targetStage) {
      return note;
    }

    if (!canTransitionStage(note.stage, targetStage)) {
      throw new StageTransitionError(note.stage, targetStage);
    }

    const updatedNote: Note = {
      ...note,
      stage: targetStage,
      syncStatus: markDirtySyncStatus(note.syncStatus, Boolean(note.remoteSha)),
      updatedAt: this.now(),
    };

    return this.noteRepository.save(updatedNote);
  }

  public getAvailableTransitions(currentStage: WritingStage): readonly WritingStage[] {
    return getAllowedTransitions(currentStage);
  }

  public validateTransition(from: WritingStage, to: WritingStage): boolean {
    return canTransitionStage(from, to);
  }
}
