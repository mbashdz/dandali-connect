
// src/lib/firebase/posts.ts
// REMOVED 'use server'; to ensure client-side auth context is used for JS SDK calls

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
  serverTimestamp,
  limit
} from 'firebase/firestore';
import type { Post } from '@/types';

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
  console.log("[createPost] Called. Data received:", JSON.stringify(postData));
  
  if (!postData.authorUid) {
    console.error("[createPost] CRITICAL: Author UID is missing in postData. Aborting.");
    throw new Error("Author UID is required to create a post.");
  }
  console.log("[createPost] Verified authorUid:", postData.authorUid);

  try {
    console.log("[createPost] Attempting to add document to 'posts' collection...");
    const postPayload = {
      ...postData,
      likesCount: 0,
      commentsCount: 0,
      timestamp: serverTimestamp(), // Use serverTimestamp for reliable ordering
    };
    console.log("[createPost] Payload for new post:", JSON.stringify(postPayload));
    const postRef = await addDoc(collection(db, 'posts'), postPayload);
    console.log("[createPost] Post document created successfully with ID:", postRef.id);

    const userRef = doc(db, 'users', postData.authorUid);
    console.log(`[createPost] Attempting to increment postsCount for user: ${postData.authorUid} at path: ${userRef.path}`);
    await updateDoc(userRef, {
      postsCount: increment(1)
    });
    console.log("[createPost] Successfully incremented postsCount for user:", postData.authorUid);

    return postRef.id;
  } catch (error: any) {
    console.error("[createPost] Error during Firestore operation:", error.message, "Code:", error.code, "Details:", error);
    if (error.code === 'permission-denied' || error.message.toLowerCase().includes('permission denied')) {
      console.error("[createPost] Firestore permission denied. Check security rules for 'posts' collection (create) and 'users' collection (update for postsCount). Ensure authorUid in postData matches authenticated user's UID if rules require it.");
    }
    throw error; // Re-throw the error to be caught by the calling function
  }
};

export const getGlobalPosts = async (limitCount: number = 20): Promise<Post[]> => {
  console.log("[getGlobalPosts] Attempting to fetch global posts, limit:", limitCount);
  try {
    const postsRef = collection(db, 'posts');
    // Ensure timestamp field is queried correctly for ordering, and it exists
    const q = query(postsRef, orderBy('timestamp', 'desc'), where('timestamp', '!=', null) , limit(limitCount));
    console.log("[getGlobalPosts] Executing query...");
    const querySnapshot = await getDocs(q);
    console.log("[getGlobalPosts] Query successful, processing documents:", querySnapshot.size);
    
    const posts: Post[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firebase Timestamp to ISO string
      const postTimestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString();
      posts.push({ 
        id: doc.id, 
        ...data,
        timestamp: postTimestamp, // Ensure timestamp is a string
      } as Post);
    });
    console.log("[getGlobalPosts] Processed posts:", posts.length);
    return posts;
  } catch (error: any) {
    console.error("[getGlobalPosts] Error:", error.message, error.code, error);
    if (error.code === 'permission-denied') {
      console.error("[getGlobalPosts] Firestore permission denied. Check your security rules for 'posts' collection (read).");
    }
    // Consider if returning empty array is always the best, or if error should propagate
    return []; // Return empty array on error to prevent app crash, but log it.
  }
};

export const getUserPosts = async (authorUid: string): Promise<Post[]> => {
  console.log("[getUserPosts] Attempting to fetch posts for user:", authorUid);
  if (!authorUid) {
    console.warn("[getUserPosts] authorUid is missing.");
    return [];
  }
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('authorUid', '==', authorUid), orderBy('timestamp', 'desc'), where('timestamp', '!=', null));
    console.log("[getUserPosts] Executing query for user:", authorUid);
    const querySnapshot = await getDocs(q);
    console.log("[getUserPosts] Query successful for user:", authorUid, "Docs found:", querySnapshot.size);

    const posts: Post[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const postTimestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString();
      posts.push({ 
        id: doc.id, 
        ...data,
        timestamp: postTimestamp, // Ensure timestamp is a string
      } as Post);
    });
    console.log("[getUserPosts] Processed posts for user:", authorUid, "Count:", posts.length);
    return posts;
  } catch (error: any) {
    console.error(`[getUserPosts] Error fetching posts for user ${authorUid}:`, error.message, error.code, error);
    if (error.code === 'permission-denied') {
      console.error(`[getUserPosts] Firestore permission denied for user ${authorUid}. Check security rules for 'posts' collection (read based on authorUid).`);
    }
    return [];
  }
};

// TODO: Implement functions for fetching comments, liking posts, etc.
// export const getPostComments = async (postId: string): Promise<Comment[]> => { ... }
// export const addCommentToPost = async (postId: string, commentData: ...) => { ... }
// export const toggleLikePost = async (postId: string, userId: string) => { ... }
