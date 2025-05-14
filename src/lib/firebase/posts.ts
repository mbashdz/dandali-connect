
// src/lib/firebase/posts.ts
'use server'; // For potential use in Server Components/Actions later, good practice

import { db } from './config';
import { 
  collection, 
  addDoc, 
  doc, 
  Timestamp, 
  updateDoc, 
  increment, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import type { Post, User } from '@/types';

interface CreatePostData {
  content: string;
  authorUid: string;
  authorUsername: string;
  authorName: string;
  authorAvatarUrl: string;
  imageUrl?: string;
  videoUrl?: string;
  voiceNoteUrl?: string;
}

export const createPost = async (postData: CreatePostData): Promise<string> => {
  if (!postData.authorUid) {
    throw new Error("Author UID is required to create a post.");
  }

  try {
    const postRef = await addDoc(collection(db, 'posts'), {
      ...postData,
      likesCount: 0,
      commentsCount: 0,
      timestamp: serverTimestamp(), // Use server timestamp
    });

    // Increment user's postsCount
    const userRef = doc(db, 'users', postData.authorUid);
    await updateDoc(userRef, {
      postsCount: increment(1)
    });

    return postRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error; // Re-throw to be handled by the caller
  }
};

export const getGlobalPosts = async (limitCount: number = 20): Promise<Post[]> => {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('timestamp', 'desc'), where('timestamp', '!=', null)); // Add where clause to filter out posts still being written
    const querySnapshot = await getDocs(q);
    
    const posts: Post[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to ISO string for client-side consistency
      const postTimestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString();

      posts.push({ 
        id: doc.id, 
        ...data,
        timestamp: postTimestamp,
      } as Post);
    });
    return posts;
  } catch (error) {
    console.error("Error fetching global posts:", error);
    return []; // Return empty array on error
  }
};

export const getUserPosts = async (authorUid: string): Promise<Post[]> => {
  if (!authorUid) return [];
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('authorUid', '==', authorUid), orderBy('timestamp', 'desc'), where('timestamp', '!=', null));
    const querySnapshot = await getDocs(q);

    const posts: Post[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const postTimestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString();
      posts.push({ 
        id: doc.id, 
        ...data,
        timestamp: postTimestamp,
      } as Post);
    });
    return posts;
  } catch (error) {
    console.error(`Error fetching posts for user ${authorUid}:`, error);
    return [];
  }
};

// TODO: Implement functions for fetching comments, liking posts, etc.
// export const getPostComments = async (postId: string): Promise<Comment[]> => { ... }
// export const addCommentToPost = async (postId: string, commentData: ...) => { ... }
// export const toggleLikePost = async (postId: string, userId: string) => { ... }
