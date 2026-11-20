import { WritingStage } from './domain/models/writing-flow.model';

export interface UserProfile {
  readonly uid: string;
  readonly displayName: string;
  readonly email: string | null;
  readonly photoURL: string | null;
}

export interface Folder {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly color: string;
  readonly icon: string;
  readonly createdAt?: unknown;
  readonly updatedAt?: unknown;
}

export interface FirestoreNote {
  readonly id: string;
  readonly userId: string;
  readonly folderId: string | null;
  readonly title: string;
  readonly slug: string;
  readonly content: string;
  readonly excerpt: string;
  readonly stage: WritingStage;
  readonly tags: string[];
  readonly isPinned: boolean;
  readonly isArchived: boolean;
  readonly color: string;
  readonly createdAt?: unknown;
  readonly updatedAt?: unknown;
}
