import {
  PushNoteResult,
  RemoteNoteFile,
  RemoteSyncConfig,
  SyncGateway,
  SyncGatewayError,
} from '../../domain/ports/sync.gateway';

const CONFIG_STORAGE_KEY = 'scriptorium_github_sync_config_v1';
const GITHUB_API_BASE = 'https://api.github.com';

interface GitHubDirectoryItem {
  readonly name: string;
  readonly path: string;
  readonly sha: string;
  readonly type: string;
}

interface GitHubFileResponse {
  readonly name: string;
  readonly path: string;
  readonly sha: string;
  readonly content?: string;
  readonly encoding?: string;
}

interface GitHubCommitFileResponse {
  readonly content?: {
    readonly path: string;
    readonly sha: string;
  };
}

export class GitHubRepoGateway implements SyncGateway {
  private config: RemoteSyncConfig | null = null;

  constructor() {
    this.config = this.loadPersistedConfig();
  }

  public isConfigured(): boolean {
    return Boolean(
      this.config &&
        this.config.owner.trim() &&
        this.config.repo.trim() &&
        this.config.branch.trim() &&
        this.config.token.trim()
    );
  }

  public configure(config: RemoteSyncConfig): void {
    const normalized: RemoteSyncConfig = {
      owner: config.owner.trim(),
      repo: config.repo.trim(),
      branch: config.branch.trim() || 'main',
      basePath: this.normalizeBasePath(config.basePath),
      token: config.token.trim(),
    };

    this.config = normalized;
    this.persistConfig(normalized);
  }

  public getConfig(): RemoteSyncConfig | null {
    return this.config ? { ...this.config } : null;
  }

  public clearConfig(): void {
    this.config = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
    }
  }

  public async checkConnection(): Promise<boolean> {
    const activeConfig = this.requireConfig();
    const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(activeConfig.owner)}/${encodeURIComponent(activeConfig.repo)}`;

    const response = await this.authorizedFetch(url, { method: 'GET' }, activeConfig.token);
    return response.ok;
  }

  public async pullAllFiles(): Promise<readonly RemoteNoteFile[]> {
    const activeConfig = this.requireConfig();
    const dirUrl = this.buildContentsUrl(activeConfig, '');

    const response = await this.authorizedFetch(
      `${dirUrl}?ref=${encodeURIComponent(activeConfig.branch)}`,
      { method: 'GET' },
      activeConfig.token
    );

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new SyncGatewayError(
        `No se pudo listar el repositorio remoto (${response.status}).`,
        response.status
      );
    }

    const entries = (await response.json()) as GitHubDirectoryItem[] | GitHubDirectoryItem;
    if (!Array.isArray(entries)) {
      return [];
    }

    const markdownFiles = entries.filter(
      (entry) => entry.type === 'file' && entry.name.toLowerCase().endsWith('.md')
    );

    const results: RemoteNoteFile[] = [];

    for (const fileEntry of markdownFiles) {
      const fileUrl = `${GITHUB_API_BASE}/repos/${encodeURIComponent(activeConfig.owner)}/${encodeURIComponent(activeConfig.repo)}/contents/${this.encodeRepoPath(fileEntry.path)}?ref=${encodeURIComponent(activeConfig.branch)}`;
      const fileResponse = await this.authorizedFetch(fileUrl, { method: 'GET' }, activeConfig.token);

      if (!fileResponse.ok) {
        throw new SyncGatewayError(
          `No se pudo descargar "${fileEntry.name}" (${fileResponse.status}).`,
          fileResponse.status
        );
      }

      const payload = (await fileResponse.json()) as GitHubFileResponse;
      if (!payload.content) {
        continue;
      }

      results.push({
        path: payload.path,
        fileName: payload.name,
        rawContent: this.decodeBase64Utf8(payload.content),
        sha: payload.sha,
      });
    }

    return results;
  }

  public async pushFile(
    fileName: string,
    content: string,
    existingSha?: string
  ): Promise<PushNoteResult> {
    const activeConfig = this.requireConfig();
    const url = this.buildContentsUrl(activeConfig, fileName);

    const bodyPayload: Record<string, string> = {
      message: existingSha ? `docs(notes): update ${fileName}` : `docs(notes): create ${fileName}`,
      content: this.encodeBase64Utf8(content),
      branch: activeConfig.branch,
    };

    if (existingSha) {
      bodyPayload.sha = existingSha;
    }

    const response = await this.authorizedFetch(
      url,
      {
        method: 'PUT',
        body: JSON.stringify(bodyPayload),
      },
      activeConfig.token
    );

    if (!response.ok) {
      throw new SyncGatewayError(
        `Error al sincronizar "${fileName}" en GitHub (${response.status}).`,
        response.status
      );
    }

    const data = (await response.json()) as GitHubCommitFileResponse;
    return {
      path: data.content?.path ?? this.joinPath(activeConfig.basePath, fileName),
      sha: data.content?.sha ?? existingSha ?? '',
      syncedAt: new Date().toISOString(),
    };
  }

  public async deleteRemoteFile(fileName: string, sha: string): Promise<void> {
    const activeConfig = this.requireConfig();
    const url = this.buildContentsUrl(activeConfig, fileName);

    const response = await this.authorizedFetch(
      url,
      {
        method: 'DELETE',
        body: JSON.stringify({
          message: `docs(notes): delete ${fileName}`,
          sha,
          branch: activeConfig.branch,
        }),
      },
      activeConfig.token
    );

    if (!response.ok && response.status !== 404) {
      throw new SyncGatewayError(
        `Error al eliminar "${fileName}" del repositorio remoto (${response.status}).`,
        response.status
      );
    }
  }

  private requireConfig(): RemoteSyncConfig {
    if (!this.isConfigured() || !this.config) {
      throw new SyncGatewayError('Configura propietario, repositorio y token de GitHub antes de sincronizar.');
    }
    return this.config;
  }

  private buildContentsUrl(config: RemoteSyncConfig, fileName: string): string {
    const fullPath = this.joinPath(config.basePath, fileName);
    const encodedPath = fullPath ? `/${this.encodeRepoPath(fullPath)}` : '';
    return `${GITHUB_API_BASE}/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents${encodedPath}`;
  }

  private normalizeBasePath(rawPath: string): string {
    return rawPath.trim().replace(/^\/+|\/+$/g, '');
  }

  private joinPath(basePath: string, fileName: string): string {
    const cleanFile = fileName.replace(/^\/+/, '');
    if (!basePath) {
      return cleanFile;
    }
    if (!cleanFile) {
      return basePath;
    }
    return `${basePath}/${cleanFile}`;
  }

  private encodeRepoPath(repoPath: string): string {
    return repoPath
      .split('/')
      .filter((segment) => segment.length > 0)
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }

  private async authorizedFetch(
    url: string,
    init: RequestInit,
    token: string
  ): Promise<Response> {
    try {
      return await fetch(url, {
        ...init,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
        },
      });
    } catch {
      throw new SyncGatewayError('No hay conexión de red para contactar con GitHub.');
    }
  }

  private encodeBase64Utf8(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  private decodeBase64Utf8(base64: string): string {
    const cleanBase64 = base64.replace(/\s+/g, '');
    const binary = atob(cleanBase64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new TextDecoder().decode(bytes);
  }

  private loadPersistedConfig(): RemoteSyncConfig | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    try {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<RemoteSyncConfig>;
      if (!parsed.owner || !parsed.repo || !parsed.token) {
        return null;
      }
      return {
        owner: parsed.owner,
        repo: parsed.repo,
        branch: parsed.branch || 'main',
        basePath: parsed.basePath || '',
        token: parsed.token,
      };
    } catch {
      return null;
    }
  }

  private persistConfig(config: RemoteSyncConfig): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  }
}
