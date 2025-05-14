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
    const username = email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') || `user_${Date.now()}`; // Basic username generation

    try {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email,
        username,
        name: additionalData?.name || username,
        avatarUrl: 'https://placehold.co/100x100.png', // Default avatar
        coverPhotoUrl: 'https://placehold.co/1000x300.png', // Default cover
        bio: 'Welcome to Dandali Connect!',
        location: '', // New field
        website: '', // New field
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

export const onAuthUserChanged = (callback: (user: User | null) => void, errorCallback?: (error: Error) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userRef = doc(db, `users/${firebaseUser.uid}`);
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          callback(userSnap.data() as User);
        } else {
          // This case might happen if user doc creation failed or was delayed
          await createUserProfileDocument(firebaseUser); // Attempt to create if missing
          const freshUserSnap = await getDoc(userRef);
          if (freshUserSnap.exists()) {
              callback(freshUserSnap.data() as User);
          } else {
               callback(null); // Fallback if still not found
          }
        }
      } catch (error: any) {
        console.error("Error fetching user document:", error);
        if (errorCallback) errorCallback(error);
        else callback(null);
      }
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Auth state changed error:", error);
    if (errorCallback) errorCallback(error);
    else callback(null);
  });
};
