
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
  console.log("[createPost] Attempting to create post with data:", postData);
  if (!postData.authorUid) {
    console.error("[createPost] Author UID is required.");
    throw new Error("Author UID is required to create a post.");
  }

  try {
    const postRef = await addDoc(collection(db, 'posts'), {
      ...postData,
      likesCount: 0,
      commentsCount: 0,
      timestamp: serverTimestamp(),
    });
    console.log("[createPost] Post document created with ID:", postRef.id);

    const userRef = doc(db, 'users', postData.authorUid);
    console.log("[createPost] Attempting to increment postsCount for user:", postData.authorUid);
    await updateDoc(userRef, {
      postsCount: increment(1)
    });
    console.log("[createPost] Successfully incremented postsCount for user:", postData.authorUid);

    return postRef.id;
  } catch (error: any) {
    console.error("[createPost] Error:", error.message, error.code, error);
    if (error.code === 'permission-denied') {
      console.error("[createPost] Firestore permission denied. Check your security rules for 'posts' collection (create) and 'users' collection (update).");
    }
    throw error;
  }
};

export const getGlobalPosts = async (limitCount: number = 20): Promise<Post[]> => {
  console.log("[getGlobalPosts] Attempting to fetch global posts, limit:", limitCount);
  try {
    const postsRef = collection(db, 'posts');
    // Ensure timestamp field is queried correctly for ordering
    const q = query(postsRef, orderBy('timestamp', 'desc'), where('timestamp', '!=', null), limit(limitCount));
    console.log("[getGlobalPosts] Executing query...");
    const querySnapshot = await getDocs(q);
    console.log("[getGlobalPosts] Query successful, processing documents:", querySnapshot.size);
    
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
    console.log("[getGlobalPosts] Processed posts:", posts.length);
    return posts;
  } catch (error: any) {
    console.error("[getGlobalPosts] Error:", error.message, error.code, error);
    if (error.code === 'permission-denied') {
      console.error("[getGlobalPosts] Firestore permission denied. Check your security rules for 'posts' collection (read).");
    }
    return [];
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
        timestamp: postTimestamp,
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

