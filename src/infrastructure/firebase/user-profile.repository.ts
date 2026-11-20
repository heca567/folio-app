import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import type { UserProfile } from '../../types';

const toUserProfile = (user: User): UserProfile => ({
  uid: user.uid,
  displayName: user.displayName || 'Usuario',
  email: user.email,
  photoURL: user.photoURL,
});

export const userProfileRepository = {
  getCurrent(): UserProfile | null {
    return auth.currentUser ? toUserProfile(auth.currentUser) : null;
  },

  subscribe(
    onProfileChanged: (profile: UserProfile | null) => void,
    onError: (error: Error) => void
  ): () => void {
    return onAuthStateChanged(
      auth,
      (user) => onProfileChanged(user ? toUserProfile(user) : null),
      onError
    );
  },

  async signInWithGoogle(): Promise<UserProfile> {
    const credential = await signInWithPopup(auth, googleProvider);
    return toUserProfile(credential.user);
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },
};
