import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { WritingStage } from '../../domain/models/writing-flow.model';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import type { FirestoreNote, UserProfile } from '../../types';

export type FirestoreNoteInput = Pick<
  FirestoreNote,
  'folderId' | 'title' | 'slug' | 'content' | 'excerpt' | 'stage' | 'isPinned' | 'isArchived' | 'color'
> & {
  readonly tags?: readonly string[];
};

export type FirestoreNoteUpdates = Partial<
  Omit<FirestoreNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

function sanitizeId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);
  return cleaned || `note_${Date.now().toString(36)}`;
}

function sanitizeTags(tags: readonly string[] | undefined): string[] {
  if (!tags || tags.length === 0) {
    return [];
  }
  return tags
    .map((tag) => tag.trim().slice(0, 40))
    .filter((tag) => tag.length > 0)
    .slice(0, 20);
}

function sanitizeStage(stage: WritingStage | undefined): WritingStage {
  if (
    stage === WritingStage.SEED ||
    stage === WritingStage.DRAFT ||
    stage === WritingStage.REVISION ||
    stage === WritingStage.POLISHED
  ) {
    return stage;
  }
  return WritingStage.SEED;
}

export function timestampToIsoString(value: unknown, fallbackIso?: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value && typeof value === 'object') {
    const maybeTs = value as { toDate?: () => Date; toMillis?: () => number; seconds?: number };
    if (typeof maybeTs.toDate === 'function') {
      return maybeTs.toDate().toISOString();
    }
    if (typeof maybeTs.toMillis === 'function') {
      return new Date(maybeTs.toMillis()).toISOString();
    }
    if (typeof maybeTs.seconds === 'number') {
      return new Date(maybeTs.seconds * 1000).toISOString();
    }
  }
  return fallbackIso ?? new Date().toISOString();
}

export const notesRepository = {
  subscribe(
    userId: string,
    onNotes: (notes: FirestoreNote[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const notesQuery = query(collection(db, 'notes'), where('userId', '==', userId));

    return onSnapshot(
      notesQuery,
      (snapshot) => {
        const notes = snapshot.docs
          .map((noteDoc) => ({ ...noteDoc.data(), id: noteDoc.id } as FirestoreNote))
          .sort((a, b) => {
            if (a.isPinned !== b.isPinned) {
              return a.isPinned ? -1 : 1;
            }
            const isoA = timestampToIsoString(a.updatedAt, '');
            const isoB = timestampToIsoString(b.updatedAt, '');
            return isoB.localeCompare(isoA);
          });
        onNotes(notes);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'notes');
        } catch (wrapped) {
          if (onError && wrapped instanceof Error) {
            onError(wrapped);
          }
        }
      }
    );
  },

  async create(note: FirestoreNoteInput, user: UserProfile, id: string): Promise<FirestoreNote> {
    const safeId = sanitizeId(id);
    const docPath = `notes/${safeId}`;
    const safeTitle = (note.title.trim() || 'Manuscrito sin título').slice(0, 200);
    const safeSlug = (note.slug.trim() || safeId).slice(0, 200);
    const safeContent = note.content.slice(0, 500000);
    const safeExcerpt = note.excerpt.slice(0, 300);

    const payload = {
      id: safeId,
      userId: user.uid,
      folderId: note.folderId ? sanitizeId(note.folderId) : null,
      title: safeTitle,
      slug: safeSlug,
      content: safeContent,
      excerpt: safeExcerpt,
      stage: sanitizeStage(note.stage),
      tags: sanitizeTags(note.tags),
      isPinned: Boolean(note.isPinned),
      isArchived: Boolean(note.isArchived),
      color: (note.color ?? '').slice(0, 32),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'notes', safeId), payload);
      const nowIso = new Date().toISOString();
      return {
        ...payload,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  },

  async update(id: string, updates: FirestoreNoteUpdates): Promise<void> {
    const safeId = sanitizeId(id);
    const docPath = `notes/${safeId}`;
    const sanitizedUpdates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (updates.folderId !== undefined) {
      sanitizedUpdates.folderId = updates.folderId ? sanitizeId(updates.folderId) : null;
    }
    if (updates.title !== undefined) {
      sanitizedUpdates.title = (updates.title.trim() || 'Manuscrito sin título').slice(0, 200);
    }
    if (updates.slug !== undefined) {
      sanitizedUpdates.slug = (updates.slug.trim() || safeId).slice(0, 200);
    }
    if (updates.content !== undefined) {
      sanitizedUpdates.content = updates.content.slice(0, 500000);
    }
    if (updates.excerpt !== undefined) {
      sanitizedUpdates.excerpt = updates.excerpt.slice(0, 300);
    }
    if (updates.stage !== undefined) {
      sanitizedUpdates.stage = sanitizeStage(updates.stage);
    }
    if (updates.tags !== undefined) {
      sanitizedUpdates.tags = sanitizeTags(updates.tags);
    }
    if (updates.isPinned !== undefined) {
      sanitizedUpdates.isPinned = Boolean(updates.isPinned);
    }
    if (updates.isArchived !== undefined) {
      sanitizedUpdates.isArchived = Boolean(updates.isArchived);
    }
    if (updates.color !== undefined) {
      sanitizedUpdates.color = updates.color.slice(0, 32);
    }

    try {
      await updateDoc(doc(db, 'notes', safeId), sanitizedUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  },

  async delete(id: string): Promise<void> {
    const safeId = sanitizeId(id);
    const docPath = `notes/${safeId}`;

    try {
      await deleteDoc(doc(db, 'notes', safeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },
};
