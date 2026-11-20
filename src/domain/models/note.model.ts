import { WritingStage } from './writing-flow.model';

export enum SyncStatus {
  LOCAL_ONLY = 'LOCAL_ONLY',
  PENDING_SYNC = 'PENDING_SYNC',
  SYNCED = 'SYNCED',
  CONFLICT = 'CONFLICT',
}

export interface TextMetrics {
  readonly wordCount: number;
  readonly characterCount: number;
  readonly characterCountNoSpaces: number;
  readonly paragraphCount: number;
  readonly readingTimeMinutes: number;
}

export interface Note {
  readonly id: string;
  readonly folderId?: string | null;
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly excerpt: string;
  readonly stage: WritingStage;
  readonly tags: readonly string[];
  readonly syncStatus: SyncStatus;
  readonly remoteSha?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastSyncedAt?: string;
}

export interface NoteInput {
  readonly id?: string;
  readonly folderId?: string | null;
  readonly title: string;
  readonly content: string;
  readonly stage?: WritingStage;
  readonly tags?: readonly string[];
}

export interface NotePatch {
  readonly title?: string;
  readonly content?: string;
  readonly tags?: readonly string[];
}

export class DomainValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainValidationError';
  }
}

const WORDS_PER_MINUTE = 200;

export function calculateTextMetrics(content: string): TextMetrics {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return {
      wordCount: 0,
      characterCount: content.length,
      characterCountNoSpaces: 0,
      paragraphCount: 0,
      readingTimeMinutes: 0,
    };
  }

  const words = trimmed.split(/\s+/).filter((token) => token.length > 0);
  const wordCount = words.length;
  const characterCount = content.length;
  const characterCountNoSpaces = content.replace(/\s+/g, '').length;
  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
  const paragraphCount = paragraphs.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));

  return {
    wordCount,
    characterCount,
    characterCountNoSpaces,
    paragraphCount,
    readingTimeMinutes,
  };
}

export function buildSlug(title: string, fallbackId: string): string {
  const normalized = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  if (normalized.length > 0) {
    return normalized;
  }

  const safeFallback = fallbackId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 16);

  return safeFallback.length > 0 ? `nota-${safeFallback}` : 'nota-sin-titulo';
}

export function extractExcerpt(content: string, maxLength = 140): string {
  const plain = content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`~>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, maxLength - 1).trimEnd()}…`;
}

export function normalizeTags(tags: readonly string[] | undefined): readonly string[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawTag of tags) {
    const cleaned = rawTag.trim().toLowerCase();
    if (cleaned.length > 0 && !seen.has(cleaned)) {
      seen.add(cleaned);
      result.push(cleaned);
    }
  }

  return result;
}

export function markDirtySyncStatus(currentStatus: SyncStatus, hasRemoteSha: boolean): SyncStatus {
  if (currentStatus === SyncStatus.CONFLICT) {
    return SyncStatus.CONFLICT;
  }
  if (hasRemoteSha || currentStatus === SyncStatus.SYNCED || currentStatus === SyncStatus.PENDING_SYNC) {
    return SyncStatus.PENDING_SYNC;
  }
  return SyncStatus.LOCAL_ONLY;
}

export function isValidSyncStatus(value: string): value is SyncStatus {
  return Object.values(SyncStatus).includes(value as SyncStatus);
}
