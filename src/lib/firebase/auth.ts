// src/lib/firebase/auth.ts
import { auth, db } from './config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { User } from '@/types';

// Function to create a user profile in Firestore
export const createUserProfileDocument = async (firebaseUser: FirebaseUser, additionalData?: Record<string, any>) => {
  if (!firebaseUser) return;

  const userRef = doc(db, `users/${firebaseUser.uid}`);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email } = firebaseUser;
    const createdAt = new Date().toISOString();
    const username = email?.split('@')[0] || `user_${Date.now()}`; // Basic username generation

    try {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email,
        username,
        name: additionalData?.name || username,
        avatarUrl: 'https://placehold.co/100x100.png', // Default avatar
        coverPhotoUrl: 'https://placehold.co/1000x300.png', // Default cover
        bio: 'Welcome to Dandali Connect!',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt,
        ...additionalData,
      });
    } catch (error) {
      console.error("Error creating user document", error);
      throw error;
    }
  }
  return userRef;
};

export const signUp = async (email: string, password: string, name: string) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await createUserProfileDocument(user, { name });
  return user;
};

export const signIn = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const doSignOut = async () => {
  return signOut(auth);
};

export const onAuthUserChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userRef = doc(db, `users/${firebaseUser.uid}`);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        callback(userSnap.data() as User);
      } else {
        // This case might happen if user doc creation failed or was delayed
        // For now, we'll create it if it's missing, assuming basic info is enough
        // Or, you might want to log them out / show an error.
        try {
            await createUserProfileDocument(firebaseUser);
            const freshUserSnap = await getDoc(userRef);
            if (freshUserSnap.exists()) {
                callback(freshUserSnap.data() as User);
            } else {
                 callback(null); // Fallback if still not found
            }
        } catch (error) {
            console.error("Error ensuring user profile document:", error);
            callback(null);
        }
      }
    } else {
      callback(null);
    }
  });
};
