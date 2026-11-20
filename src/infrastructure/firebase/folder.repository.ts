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
import { db, handleFirestoreError, OperationType } from '../../firebase';
import type { Folder, UserProfile } from '../../types';

export interface FolderInput {
  readonly name: string;
  readonly color: string;
  readonly icon: string;
}

function sanitizeId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);
  return cleaned || `proj_${Date.now().toString(36)}`;
}

function sanitizeFolderInput(folder: FolderInput): FolderInput {
  return {
    name: (folder.name.trim() || 'Nuevo proyecto').slice(0, 80),
    color: (folder.color.trim() || '#1E3A5F').slice(0, 32),
    icon: (folder.icon.trim() || 'folder').slice(0, 32),
  };
}

export const folderRepository = {
  subscribe(
    userId: string,
    onFolders: (folders: Folder[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const foldersQuery = query(collection(db, 'folders'), where('userId', '==', userId));

    return onSnapshot(
      foldersQuery,
      (snapshot) => {
        const folders = snapshot.docs
          .map((folderDoc) => ({ ...folderDoc.data(), id: folderDoc.id } as Folder))
          .sort((a, b) => a.name.localeCompare(b.name, 'es'));
        onFolders(folders);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'folders');
        } catch (wrapped) {
          if (onError && wrapped instanceof Error) {
            onError(wrapped);
          }
        }
      }
    );
  },

  async create(folder: FolderInput, user: UserProfile, id: string): Promise<Folder> {
    const safeId = sanitizeId(id);
    const sanitized = sanitizeFolderInput(folder);
    const docPath = `folders/${safeId}`;

    const newFolder: Folder = {
      id: safeId,
      userId: user.uid,
      name: sanitized.name,
      color: sanitized.color,
      icon: sanitized.icon,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'folders', safeId), newFolder);
      return newFolder;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  },

  async update(id: string, folder: FolderInput): Promise<void> {
    const safeId = sanitizeId(id);
    const sanitized = sanitizeFolderInput(folder);
    const docPath = `folders/${safeId}`;

    try {
      await updateDoc(doc(db, 'folders', safeId), {
        name: sanitized.name,
        color: sanitized.color,
        icon: sanitized.icon,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  },

  async delete(id: string): Promise<void> {
    const safeId = sanitizeId(id);
    const docPath = `folders/${safeId}`;

    try {
      await deleteDoc(doc(db, 'folders', safeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },
};
