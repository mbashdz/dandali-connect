// src/lib/firebase/reports.ts
import { db, auth } from './config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type ReportCategory = 'hate_speech' | 'spam' | 'harassment' | 'scam' | 'nudity' | 'misinformation' | 'other';

export interface CreateReportInput {
  targetId: string; // Post ID, Comment ID, Kasuwa Item ID, or User UID
  targetType: 'post' | 'comment' | 'kasuwa_item' | 'user';
  reason: ReportCategory;
  details?: string;
  reporterUid?: string;
  reporterUsername?: string;
}

export const submitReport = async (input: CreateReportInput): Promise<string> => {
  const currentUid = auth.currentUser?.uid || input.reporterUid || 'anonymous';
  try {
    const reportsRef = collection(db, 'reports');
    const docRef = await addDoc(reportsRef, {
      ...input,
      reporterUid: currentUid,
      status: 'pending', // 'pending' | 'reviewed' | 'action_taken' | 'dismissed'
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    console.error('[submitReport] Error reporting content:', error);
    throw error;
  }
};
