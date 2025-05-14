// src/lib/firebase/users.ts
import { db } from './config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import type { User } from '@/types';

export const updateUserProfile = async (uid: string, data: Partial<User>): Promise<void> => {
  if (!uid) throw new Error("User ID is required to update profile.");
  const userRef = doc(db, 'users', uid);
  
  // Filter out undefined values to avoid overwriting fields with undefined in Firestore
  const updateData = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof Partial<User>] = value;
    }
    return acc;
  }, {} as Partial<User>);

  if (Object.keys(updateData).length === 0) {
    console.warn("No valid data provided for update.");
    return;
  }
  
  await updateDoc(userRef, updateData);
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  if (!uid) return null;
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data() as User;
  }
  return null;
};
