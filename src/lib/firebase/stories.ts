// src/lib/firebase/stories.ts
import { db, auth } from './config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import type { Story } from '@/types';

export const getActiveStories = async (): Promise<Story[]> => {
  try {
    const storiesRef = collection(db, 'stories');
    // Fetch recent stories
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const q = query(
      storiesRef, 
      where('createdAt', '>=', Timestamp.fromDate(twentyFourHoursAgo)),
      orderBy('createdAt', 'desc'), 
      limit(25)
    );

    const snapshot = await getDocs(q);
    const stories: Story[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      stories.push({
        id: docSnap.id,
        authorUid: data.authorUid || '',
        authorUsername: data.authorUsername || '',
        authorName: data.authorName || 'Community Member',
        authorAvatarUrl: data.authorAvatarUrl || '',
        mediaUrl: data.mediaUrl,
        text: data.text,
        bgColor: data.bgColor,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        expiresAt: data.expiresAt || new Date(Date.now() + 86400000).toISOString(),
        viewed: false,
      });
    });
    return stories;
  } catch (error: any) {
    console.error('[getActiveStories] Error fetching stories:', error);
    return [];
  }
};

export const createStory = async (
  storyData: Omit<Story, 'id' | 'createdAt' | 'expiresAt'>
): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Must be logged in to create a story.');
  }

  const storiesRef = collection(db, 'stories');
  const now = new Date();
  const docRef = await addDoc(storiesRef, {
    ...storyData,
    authorUid: currentUser.uid,
    createdAt: serverTimestamp(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  });

  return docRef.id;
};
