import {
  buildSlug,
  extractExcerpt,
  isValidSyncStatus,
  normalizeTags,
  Note,
  SyncStatus,
} from '../../domain/models/note.model';
import { isValidWritingStage, WritingStage } from '../../domain/models/writing-flow.model';
import { MarkdownCodec, MarkdownCodecError } from '../../domain/ports/markdown.codec';

interface ParsedFrontmatter {
  readonly metadata: Readonly<Record<string, string | readonly string[]>>;
  readonly body: string;
}

export class FrontmatterMarkdownCodec implements MarkdownCodec {
  public serialize(note: Note): string {
    const serializedTags =
      note.tags.length > 0
        ? `[${note.tags.map((tag) => this.quoteYamlString(tag)).join(', ')}]`
        : '[]';

    const lines: string[] = [
      '---',
      `id: ${this.quoteYamlString(note.id)}`,
      `title: ${this.quoteYamlString(note.title)}`,
      `slug: ${this.quoteYamlString(note.slug)}`,
      `stage: ${note.stage}`,
      `tags: ${serializedTags}`,
      `syncStatus: ${note.syncStatus}`,
      `createdAt: ${this.quoteYamlString(note.createdAt)}`,
      `updatedAt: ${this.quoteYamlString(note.updatedAt)}`,
    ];

    if (note.lastSyncedAt) {
      lines.push(`lastSyncedAt: ${this.quoteYamlString(note.lastSyncedAt)}`);
    }

    lines.push('---', '');

    const cleanContent = note.content.replace(/^\n+/, '');
    return `${lines.join('\n')}${cleanContent}`;
  }

  public deserialize(rawMarkdown: string, fallbackId: string): Note {
    const normalizedInput = rawMarkdown.replace(/\r\n/g, '\n');
    const parsed = this.extractFrontmatter(normalizedInput);

    const id = this.readStringField(parsed.metadata, 'id') || fallbackId;
    if (!id) {
      throw new MarkdownCodecError('El documento Markdown no contiene un identificador válido.');
    }

    const body = parsed.body;
    const titleFromBody = this.inferTitleFromBody(body);
    const title = this.readStringField(parsed.metadata, 'title') || titleFromBody || 'Manuscrito sin título';
    const slug = this.readStringField(parsed.metadata, 'slug') || buildSlug(title, id);

    const rawStage = this.readStringField(parsed.metadata, 'stage');
    const stage = isValidWritingStage(rawStage) ? rawStage : WritingStage.SEED;

    const rawSyncStatus = this.readStringField(parsed.metadata, 'syncStatus');
    const syncStatus = isValidSyncStatus(rawSyncStatus) ? rawSyncStatus : SyncStatus.LOCAL_ONLY;

    const rawTags = parsed.metadata.tags;
    const tags = Array.isArray(rawTags) ? normalizeTags(rawTags) : [];

    const nowIso = new Date().toISOString();
    const createdAt = this.readStringField(parsed.metadata, 'createdAt') || nowIso;
    const updatedAt = this.readStringField(parsed.metadata, 'updatedAt') || createdAt;
    const lastSyncedAt = this.readStringField(parsed.metadata, 'lastSyncedAt') || undefined;

    return {
      id,
      slug,
      title,
      content: body,
      excerpt: extractExcerpt(body),
      stage,
      tags,
      syncStatus,
      createdAt,
      updatedAt,
      lastSyncedAt,
    };
  }

  private extractFrontmatter(source: string): ParsedFrontmatter {
    if (!source.startsWith('---\n') && source !== '---') {
      return { metadata: {}, body: source };
    }

    const closingIndex = source.indexOf('\n---', 3);
    if (closingIndex === -1) {
      throw new MarkdownCodecError('Bloque YAML frontmatter sin delimitador de cierre "---".');
    }

    const yamlBlock = source.slice(4, closingIndex);
    const afterClosing = source.slice(closingIndex + 4);
    const body = afterClosing.startsWith('\n') ? afterClosing.slice(1) : afterClosing;

    const metadata: Record<string, string | readonly string[]> = {};
    const lines = yamlBlock.split('\n');

    let currentArrayKey: string | null = null;
    let currentArrayItems: string[] = [];

    const flushPendingArray = () => {
      if (currentArrayKey !== null) {
        metadata[currentArrayKey] = currentArrayItems;
        currentArrayKey = null;
        currentArrayItems = [];
      }
    };

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      if (currentArrayKey !== null && trimmed.startsWith('- ')) {
        const item = this.unquoteYamlString(trimmed.slice(2).trim());
        if (item) {
          currentArrayItems.push(item);
        }
        continue;
      }

      flushPendingArray();

      const separatorIndex = rawLine.indexOf(':');
      if (separatorIndex === -1) {
        continue;
      }

      const key = rawLine.slice(0, separatorIndex).trim();
      const rawValue = rawLine.slice(separatorIndex + 1).trim();

      if (!key) {
        continue;
      }

      if (rawValue === '') {
        currentArrayKey = key;
        currentArrayItems = [];
        continue;
      }

      if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
        metadata[key] = this.parseInlineArray(rawValue);
        continue;
      }

      metadata[key] = this.unquoteYamlString(rawValue);
    }

    flushPendingArray();

    return { metadata, body };
  }

  private parseInlineArray(rawArray: string): readonly string[] {
    const inner = rawArray.slice(1, -1).trim();
    if (!inner) {
      return [];
    }

    const items: string[] = [];
    let current = '';
    let inQuotes: '"' | "'" | null = null;
    let escaped = false;

    for (const char of inner) {
      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if ((char === '"' || char === "'") && inQuotes === null) {
        inQuotes = char;
        continue;
      }

      if (char === inQuotes) {
        inQuotes = null;
        continue;
      }

      if (char === ',' && inQuotes === null) {
        const cleaned = current.trim();
        if (cleaned) {
          items.push(this.unquoteYamlString(cleaned));
        }
        current = '';
        continue;
      }

      current += char;
    }

    const tail = current.trim();
    if (tail) {
      items.push(this.unquoteYamlString(tail));
    }

    return items;
  }

  private quoteYamlString(value: string): string {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
    return `"${escaped}"`;
  }

  private unquoteYamlString(value: string): string {
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      return value
        .slice(1, -1)
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }

    if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1).replace(/''/g, "'");
    }

    return value;
  }

  private readStringField(
    metadata: Readonly<Record<string, string | readonly string[]>>,
    key: string
  ): string {
    const value = metadata[key];
    return typeof value === 'string' ? value.trim() : '';
  }

  private inferTitleFromBody(body: string): string {
    const headingMatch = body.match(/^#\s+(.+)$/m);
    return headingMatch ? headingMatch[1].trim() : '';
  }
}
