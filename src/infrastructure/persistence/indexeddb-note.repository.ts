import { Note } from '../../domain/models/note.model';
import { NoteRepository } from '../../domain/ports/note.repository';

const DEFAULT_DB_NAME = 'scriptorium_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

export class IndexedDBPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IndexedDBPersistenceError';
  }
}

export class IndexedDBNoteRepository implements NoteRepository {
  private readonly dbName: string;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(dbName: string = DEFAULT_DB_NAME) {
    this.dbName = dbName;
  }

  public async getAll(): Promise<readonly Note[]> {
    const db = await this.getDatabase();

    return new Promise<readonly Note[]>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = (request.result as Note[] | undefined) ?? [];
        resolve(result.map((note) => this.cloneNote(note)));
      };

      request.onerror = () => {
        reject(
          new IndexedDBPersistenceError(
            request.error?.message ?? 'Error al leer las notas desde IndexedDB.'
          )
        );
      };
    });
  }

  public async getById(id: string): Promise<Note | null> {
    const db = await this.getDatabase();

    return new Promise<Note | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result as Note | undefined;
        resolve(record ? this.cloneNote(record) : null);
      };

      request.onerror = () => {
        reject(
          new IndexedDBPersistenceError(
            request.error?.message ?? `Error al obtener la nota "${id}" desde IndexedDB.`
          )
        );
      };
    });
  }

  public async save(note: Note): Promise<Note> {
    const db = await this.getDatabase();
    const recordToStore = this.cloneNote(note);

    return new Promise<Note>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(recordToStore);

      request.onerror = () => {
        reject(
          new IndexedDBPersistenceError(
            request.error?.message ?? `Error al guardar la nota "${note.id}" en IndexedDB.`
          )
        );
      };

      transaction.oncomplete = () => {
        resolve(this.cloneNote(recordToStore));
      };

      transaction.onerror = () => {
        reject(
          new IndexedDBPersistenceError(
            transaction.error?.message ?? 'Error en la transacción de escritura de IndexedDB.'
          )
        );
      };
    });
  }

  public async delete(id: string): Promise<void> {
    const db = await this.getDatabase();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => {
        reject(
          new IndexedDBPersistenceError(
            request.error?.message ?? `Error al eliminar la nota "${id}" de IndexedDB.`
          )
        );
      };

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(
          new IndexedDBPersistenceError(
            transaction.error?.message ?? 'Error en la transacción de eliminación de IndexedDB.'
          )
        );
      };
    });
  }

  private getDatabase(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') {
      return Promise.reject(
        new IndexedDBPersistenceError('IndexedDB no está disponible en este entorno.')
      );
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const openRequest = indexedDB.open(this.dbName, DB_VERSION);

      openRequest.onupgradeneeded = () => {
        const database = openRequest.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('stage', 'stage', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
        }
      };

      openRequest.onsuccess = () => {
        const database = openRequest.result;
        database.onversionchange = () => {
          database.close();
          this.dbPromise = null;
        };
        database.onclose = () => {
          this.dbPromise = null;
        };
        resolve(database);
      };

      openRequest.onerror = () => {
        this.dbPromise = null;
        reject(
          new IndexedDBPersistenceError(
            openRequest.error?.message ?? 'No se pudo abrir la base de datos IndexedDB.'
          )
        );
      };

      openRequest.onblocked = () => {
        this.dbPromise = null;
        reject(
          new IndexedDBPersistenceError(
            'La apertura de IndexedDB fue bloqueada por otra pestaña activa.'
          )
        );
      };
    });

    return this.dbPromise;
  }

  private cloneNote(note: Note): Note {
    return {
      ...note,
      tags: [...note.tags],
    };
  }
}
