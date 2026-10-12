
// src/lib/firebase/users.ts
import { db } from './config';
import { doc, updateDoc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { User } from '@/types';

export const updateUserProfile = async (uid: string, data: Partial<User>): Promise<void> => {
  console.log(`[updateUserProfile] Attempting to update profile for UID: ${uid} with data:`, data);
  if (!uid) {
    console.error("[updateUserProfile] User ID is required.");
    throw new Error("User ID is required to update profile.");
  }
  const userRef = doc(db, 'users', uid);
  
  const updateData = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      (acc as Record<string, any>)[key] = value;
    }
    return acc;
  }, {} as Partial<User>);

  if (Object.keys(updateData).length === 0) {
    console.warn("[updateUserProfile] No valid data provided for update.");
    return;
  }
  
  try {
    await updateDoc(userRef, updateData);
    console.log(`[updateUserProfile] Profile updated successfully for UID: ${uid}`);
  } catch (error: any) {
    console.error(`[updateUserProfile] Error updating profile for UID ${uid}:`, error.message, error.code, error);
    if (error.code === 'permission-denied') {
      console.error(`[updateUserProfile] Firestore permission denied for UID ${uid}. Check security rules for 'users' collection (update).`);
    }
    throw error;
  }
};

export const getUserProfileByUid = async (uid: string): Promise<User | null> => {
  console.log(`[getUserProfileByUid] Attempting to fetch profile for UID: ${uid}`);
  if (!uid) {
    console.warn("[getUserProfileByUid] UID is missing.");
    return null;
  }
  const userRef = doc(db, 'users', uid);
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      console.log(`[getUserProfileByUid] Profile found for UID: ${uid}`);
      return userSnap.data() as User;
    } else {
      console.log(`[getUserProfileByUid] No profile found for UID: ${uid}`);
      return null;
    }
  } catch (error: any) {
    console.error(`[getUserProfileByUid] Error fetching profile for UID ${uid}:`, error.message, error.code, error);
    if (error.code === 'permission-denied') {
      console.error(`[getUserProfileByUid] Firestore permission denied for UID ${uid}. Check security rules for 'users' collection (read).`);
    }
    return null;
  }
};


export const getUserProfileByUsername = async (username: string): Promise<User | null> => {
  console.log(`[getUserProfileByUsername] Attempting to fetch profile for username: ${username}`);
  if (!username) {
    console.warn("[getUserProfileByUsername] Username is missing.");
    return null;
  }
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("username", "==", username));
  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      console.log(`[getUserProfileByUsername] Profile found for username ${username}:`, userDoc.id);
      return { id: userDoc.id, ...userDoc.data() } as User;
    } else {
      console.log(`[getUserProfileByUsername] No profile found for username: ${username}`);
      return null;
    }
  } catch (error: any) {
    console.error(`[getUserProfileByUsername] Error fetching profile for username ${username}:`, error.message, error.code, error);
     if (error.code === 'permission-denied') {
      console.error(`[getUserProfileByUsername] Firestore permission denied for username query. Check security rules for 'users' collection (query/read).`);
    }
    return null;
  }
};

export const getSuggestedUsers = async (limitCount: number = 5, currentUserId?: string): Promise<User[]> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, limit(limitCount + 3));
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (currentUserId && (docSnap.id === currentUserId || data.uid === currentUserId)) {
        return;
      }
      users.push({ id: docSnap.id, ...data } as User);
    });
    return users.slice(0, limitCount);
  } catch (err) {
    console.error("[getSuggestedUsers] Error:", err);
    return [];
  }
};

