export interface RemoteSyncConfig {
  readonly owner: string;
  readonly repo: string;
  readonly branch: string;
  readonly basePath: string;
  readonly token: string;
}

export interface RemoteNoteFile {
  readonly path: string;
  readonly fileName: string;
  readonly rawContent: string;
  readonly sha: string;
}

export interface PushNoteResult {
  readonly path: string;
  readonly sha: string;
  readonly syncedAt: string;
}

export class SyncGatewayError extends Error {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'SyncGatewayError';
    this.statusCode = statusCode;
  }
}

export interface SyncGateway {
  isConfigured(): boolean;
  configure(config: RemoteSyncConfig): void;
  getConfig(): RemoteSyncConfig | null;
  clearConfig(): void;
  checkConnection(): Promise<boolean>;
  pullAllFiles(): Promise<readonly RemoteNoteFile[]>;
  pushFile(fileName: string, content: string, existingSha?: string): Promise<PushNoteResult>;
  deleteRemoteFile(fileName: string, sha: string): Promise<void>;
}
