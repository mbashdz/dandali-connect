
// src/lib/firebase/auth.ts
import { auth, db } from './config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { User } from '@/types';

const googleProvider = new GoogleAuthProvider();

// Function to create a user profile in Firestore
export const createUserProfileDocument = async (firebaseUser: FirebaseUser, additionalData?: Record<string, any>) => {
  console.log("[createUserProfileDocument] Called for Firebase UID:", firebaseUser?.uid);
  if (!firebaseUser) {
    console.error("[createUserProfileDocument] firebaseUser is null or undefined.");
    return;
  }

  const userRef = doc(db, `users/${firebaseUser.uid}`);
  console.log("[createUserProfileDocument] UserRef path:", userRef.path);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email } = firebaseUser;
    const createdAt = new Date().toISOString();
    const username = email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') || `user_${Date.now()}`;
    console.log("[createUserProfileDocument] New user. Email:", email, "Generated username:", username);

    const userData = {
      uid: firebaseUser.uid,
      email,
      username,
      name: additionalData?.name || username,
      avatarUrl: 'https://placehold.co/100x100.png',
      coverPhotoUrl: 'https://placehold.co/1000x300.png',
      bio: 'Welcome to Dandali Connect!',
      location: '',
      website: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt,
      ...additionalData,
    };
    console.log("[createUserProfileDocument] User data to be set:", userData);

    try {
      await setDoc(userRef, userData);
      console.log("[createUserProfileDocument] User document created successfully for UID:", firebaseUser.uid);
    } catch (error: any) {
      console.error("[createUserProfileDocument] Error creating user document for UID:", firebaseUser.uid, error.message, error.code, error);
      if (error.code === 'permission-denied') {
        console.error("[createUserProfileDocument] Firestore permission denied. Check security rules for 'users' collection (create operation). Path:", userRef.path);
      }
      throw error;
    }
  } else {
    console.log("[createUserProfileDocument] User document already exists for UID:", firebaseUser.uid);
  }
  return userRef;
};

export const signUp = async (email: string, password: string, name: string) => {
  console.log("[signUp] Attempting signup for email:", email);
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  console.log("[signUp] Firebase user created, UID:", user.uid);
  await createUserProfileDocument(user, { name });
  console.log("[signUp] User profile document process completed for UID:", user.uid);
  return user;
};

export const signIn = async (email: string, password: string) => {
  console.log("[signIn] Attempting sign-in for email:", email);
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  console.log("[signInWithGoogle] Attempting Google sign-in.");
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  await createUserProfileDocument(user, {
    name: user.displayName || user.email?.split('@')[0] || 'Dandali User',
    avatarUrl: user.photoURL || 'https://placehold.co/100x100.png',
  });
  return user;
};

export const doSignOut = async () => {
  console.log("[signOut] Attempting sign-out.");
  return signOut(auth);
};

export const onAuthUserChanged = (callback: (user: User | null) => void, errorCallback?: (error: Error) => void) => {
  console.log("[onAuthUserChanged] Subscribing to auth state changes.");
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      console.log("[onAuthUserChanged] Auth state changed: Firebase user detected, UID:", firebaseUser.uid);
      const userRef = doc(db, `users/${firebaseUser.uid}`);
      console.log("[onAuthUserChanged] Attempting to fetch user document from Firestore. Path:", userRef.path);
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as User;
          console.log("[onAuthUserChanged] User document found in Firestore for UID:", firebaseUser.uid, "Data:", userData);
          callback(userData);
        } else {
          console.warn("[onAuthUserChanged] User document NOT found in Firestore for UID:", firebaseUser.uid, "Attempting to create it.");
          try {
            await createUserProfileDocument(firebaseUser); // Attempt to create if missing
            const freshUserSnap = await getDoc(userRef);
            if (freshUserSnap.exists()) {
                const newUserData = freshUserSnap.data() as User;
                console.log("[onAuthUserChanged] User document created and fetched successfully after missing for UID:", firebaseUser.uid, "Data:", newUserData);
                callback(newUserData);
            } else {
                 console.error("[onAuthUserChanged] CRITICAL: User document still not found after attempting creation for UID:", firebaseUser.uid);
                 callback(null);
            }
          } catch (creationError: any) {
            console.error("[onAuthUserChanged] Error during attempt to create missing user document for UID:", firebaseUser.uid, creationError.message, creationError.code, creationError);
            if (errorCallback) errorCallback(creationError);
            else callback(null);
          }
        }
      } catch (error: any) {
        console.error("[onAuthUserChanged] Error fetching user document from Firestore for UID:", firebaseUser.uid, error.message, error.code, error);
        if (error.code === 'permission-denied') {
          console.error("[onAuthUserChanged] Firestore permission denied while fetching user document. Check security rules for 'users' collection (read operation). Path:", userRef.path);
        }
        if (errorCallback) errorCallback(error);
        else callback(null);
      }
    } else {
      console.log("[onAuthUserChanged] Auth state changed: No Firebase user detected (logged out).");
      callback(null);
    }
  }, (error: Error) => {
    console.error("[onAuthUserChanged] Auth state listener error:", error);
    if (errorCallback) errorCallback(error);
    else callback(null);
  });
};

