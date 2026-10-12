
// src/lib/firebase/posts.ts
import { auth, db } from './config'; // Ensure auth is imported
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
  getDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  limit
} from 'firebase/firestore';
import type { Post, Comment as CommentType } from '@/types';

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
  const firebaseAuthCurrentUser = auth.currentUser; // Get current user from Firebase Auth SDK
  console.log("[createPost] Called. Data received:", JSON.stringify(postData));
  console.log("[createPost] Firebase Auth SDK currentUser UID at function start:", firebaseAuthCurrentUser?.uid);

  if (!postData.authorUid) {
    console.error("[createPost] CRITICAL: Author UID (from postData) is missing. Aborting.");
    throw new Error("Author UID is required to create a post.");
  }
  
  if (!firebaseAuthCurrentUser) {
    console.error(
      `[createPost] Firebase Auth SDK currentUser is null. User might not be authenticated. postData.authorUid: ${postData.authorUid}. Aborting.`
    );
    throw new Error(
      "User not authenticated according to Firebase SDK. Cannot create post."
    );
  }
  
  if (firebaseAuthCurrentUser.uid !== postData.authorUid) {
    console.error(
      `[createPost] Mismatch in UIDs: Firebase Auth SDK UID: ${firebaseAuthCurrentUser.uid}, postData.authorUid: ${postData.authorUid}. Aborting.`
    );
    throw new Error(
      "Authentication mismatch: UID from auth context does not match Firebase SDK's current user UID."
    );
  }
  console.log("[createPost] Verified authorUid from postData:", postData.authorUid, "matches Firebase Auth SDK currentUser.uid:", firebaseAuthCurrentUser.uid);

  try {
    const postPayload = {
      ...postData,
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      timestamp: serverTimestamp(), 
    };
    console.log("[createPost] Payload for new post:", JSON.stringify(postPayload));
    
    console.log("[createPost] Attempting to add document to 'posts' collection...");
    const postRef = await addDoc(collection(db, 'posts'), postPayload);
    console.log("[createPost] Post document created successfully with ID:", postRef.id);

    const userRef = doc(db, 'users', postData.authorUid);
    console.log(`[createPost] Attempting to increment postsCount for user: ${postData.authorUid} at path: ${userRef.path}`);
    await updateDoc(userRef, {
      postsCount: increment(1)
    });
    console.log("[createPost] Successfully incremented postsCount for user:", postData.authorUid);

    return postRef.id;
  } catch (error: any) { // This is line 64 in your original file structure
    console.error("[createPost] Error during Firestore operation:", error.message, "Code:", error.code, "Details:", error); // This is line 65
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
      console.error("[createPost] Firestore permission denied. Detailed error above. Check security rules for 'posts' collection (create operation) and 'users' collection (update operation for postsCount). Ensure authorUid in postData matches authenticated user's UID as per Firebase Auth SDK. SDK UID was:", firebaseAuthCurrentUser?.uid);
    }
    throw error; 
  }
};

export const getGlobalPosts = async (limitCount: number = 20): Promise<Post[]> => {
  console.log("[getGlobalPosts] Attempting to fetch global posts, limit:", limitCount);
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('timestamp', 'desc'), where('timestamp', '!=', null) , limit(limitCount));
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
        likedBy: data.likedBy || [],
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
        likedBy: data.likedBy || [],
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

export const toggleLikePost = async (postId: string, userId: string): Promise<{ likesCount: number; likedBy: string[] }> => {
  const firebaseAuthCurrentUser = auth.currentUser;
  console.log(`[toggleLikePost] User ${userId} (SDK UID: ${firebaseAuthCurrentUser?.uid}) attempting to toggle like for post ${postId}`);
  if (!firebaseAuthCurrentUser || firebaseAuthCurrentUser.uid !== userId) {
    console.error(`[toggleLikePost] Auth mismatch or SDK user null. SDK UID: ${firebaseAuthCurrentUser?.uid}, provided userId: ${userId}`);
    throw new Error("Authentication mismatch or user not properly authenticated for toggling like.");
  }

  const postRef = doc(db, 'posts', postId);
  try {
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
      throw new Error("Post not found");
    }
    const postData = postSnap.data() as Post;
    const currentlyLikedBy = postData.likedBy || [];
    let updatedLikesCount;
    let updatedLikedBy;

    if (currentlyLikedBy.includes(userId)) {
      console.log(`[toggleLikePost] User ${userId} is unliking post ${postId}`);
      await updateDoc(postRef, {
        likedBy: arrayRemove(userId),
        likesCount: increment(-1)
      });
      updatedLikesCount = Math.max(0, (postData.likesCount || 0) - 1);
      updatedLikedBy = currentlyLikedBy.filter(uid => uid !== userId);
    } else {
      console.log(`[toggleLikePost] User ${userId} is liking post ${postId}`);
      await updateDoc(postRef, {
        likedBy: arrayUnion(userId),
        likesCount: increment(1)
      });
      updatedLikesCount = (postData.likesCount || 0) + 1;
      updatedLikedBy = [...currentlyLikedBy, userId];
    }
    console.log(`[toggleLikePost] Post ${postId} like status updated. New count: ${updatedLikesCount}`);
    return { likesCount: updatedLikesCount, likedBy: updatedLikedBy };
  } catch (error: any) {
    console.error(`[toggleLikePost] Error toggling like for post ${postId} by user ${userId}:`, error.message, error.code, error);
    if (error.code === 'permission-denied') {
      console.error(`[toggleLikePost] Firestore permission denied. Check security rules for 'posts' collection (update - likedBy, likesCount). SDK UID was: ${firebaseAuthCurrentUser?.uid}`);
    }
    throw error;
  }
};

export const addCommentToPost = async (
  postId: string, 
  commentData: { 
    authorUid: string; 
    authorUsername: string; 
    authorName: string; 
    authorAvatarUrl: string; 
    content: string;
  }
): Promise<CommentType> => {
  const firebaseAuthCurrentUser = auth.currentUser;
  console.log(`[addCommentToPost] User ${commentData.authorUid} (SDK UID: ${firebaseAuthCurrentUser?.uid}) attempting to comment on post ${postId}`);
  
  if (!commentData.authorUid || !commentData.content.trim()) {
    throw new Error("Author UID and content are required for a comment.");
  }
  if (!firebaseAuthCurrentUser || firebaseAuthCurrentUser.uid !== commentData.authorUid) {
     console.error(`[addCommentToPost] Auth mismatch or SDK user null. SDK UID: ${firebaseAuthCurrentUser?.uid}, commentData.authorUid: ${commentData.authorUid}`);
    throw new Error("Authentication mismatch or user not properly authenticated for adding comment.");
  }

  const postRef = doc(db, 'posts', postId);
  const commentsRef = collection(postRef, 'comments');
  
  try {
    const newCommentPayload = {
      ...commentData,
      postId: postId,
      timestamp: serverTimestamp(),
    };
    console.log(`[addCommentToPost] Payload for new comment: ${JSON.stringify(newCommentPayload)}`);
    const commentDocRef = await addDoc(commentsRef, newCommentPayload);
    console.log(`[addCommentToPost] Comment added to post ${postId} with ID ${commentDocRef.id}`);
    
    console.log(`[addCommentToPost] Attempting to increment commentsCount for post ${postId}`);
    await updateDoc(postRef, {
      commentsCount: increment(1)
    });
    console.log(`[addCommentToPost] Incremented commentsCount for post ${postId}`);

    const commentSnap = await getDoc(commentDocRef);
    const newComment = commentSnap.data();
    const commentTimestamp = newComment?.timestamp instanceof Timestamp ? newComment.timestamp.toDate().toISOString() : new Date().toISOString();
    
    return { 
      id: commentDocRef.id, 
      ...newComment,
      timestamp: commentTimestamp
    } as CommentType;

  } catch (error: any) {
    console.error(`[addCommentToPost] Error adding comment to post ${postId} by user ${commentData.authorUid}:`, error.message, error.code, error);
    if (error.code === 'permission-denied') {
      console.error(`[addCommentToPost] Firestore permission denied. Check security rules for 'posts/${postId}/comments' (create) and 'posts' (update - commentsCount). SDK UID was: ${firebaseAuthCurrentUser?.uid}`);
    }
    throw error;
  }
};

export const getPostComments = async (postId: string): Promise<CommentType[]> => {
  console.log(`[getPostComments] Attempting to fetch comments for post ${postId}`);
  const commentsRef = collection(db, 'posts', postId, 'comments');
  const q = query(commentsRef, orderBy('timestamp', 'asc'));
  
  try {
    const querySnapshot = await getDocs(q);
    console.log(`[getPostComments] Fetched ${querySnapshot.size} comments for post ${postId}`);
    const comments: CommentType[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const commentTimestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString();
      comments.push({ 
        id: doc.id, 
        ...data,
        timestamp: commentTimestamp,
      } as CommentType);
    });
    return comments;
  } catch (error: any) {
    console.error(`[getPostComments] Error fetching comments for post ${postId}:`, error.message, error.code, error);
    if (error.code === 'permission-denied') {
      console.error(`[getPostComments] Firestore permission denied. Check security rules for 'posts/${postId}/comments' (read).`);
    }
    return [];
  }
};

export const getPostById = async (postId: string): Promise<Post | null> => {
  console.log(`[getPostById] Attempting to fetch post: ${postId}`);
  const postRef = doc(db, 'posts', postId);
  try {
    const docSnap = await getDoc(postRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const postTimestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString();
      return { id: docSnap.id, ...data, timestamp: postTimestamp, likedBy: data.likedBy || [] } as Post;
    } else {
      console.warn(`[getPostById] Post not found: ${postId}`);
      return null;
    }
  } catch (error: any) {
    console.error(`[getPostById] Error fetching post ${postId}:`, error.message, error.code, error);
    if (error.code === 'permission-denied') {
      console.error(`[getPostById] Firestore permission denied for post ${postId}. Check security rules for 'posts' collection (read).`);
    }
    throw error;
  }
};

export const setCulturalReaction = async (
  postId: string,
  userId: string,
  reaction: 'kauna' | 'madalla' | 'wuta' | 'dariya' | 'alheri'
): Promise<{ likesCount: number; reactionsCount: Record<string, number>; currentUserReaction: string }> => {
  const postRef = doc(db, 'posts', postId);
  try {
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
      throw new Error("Post not found");
    }
    const postData = postSnap.data() as Post;
    const existingReactions = postData.reactions || {};
    const existingCounts = (postData.reactionsCount || {}) as Record<string, number>;
    const prevReaction = existingReactions[userId];

    const updatedCounts = { ...existingCounts };

    if (prevReaction === reaction) {
      // Toggle off
      delete existingReactions[userId];
      updatedCounts[reaction] = Math.max(0, (updatedCounts[reaction] || 1) - 1);
      const newLikedBy = (postData.likedBy || []).filter(id => id !== userId);
      const newLikesCount = Math.max(0, (postData.likesCount || 1) - 1);
      await updateDoc(postRef, {
        [`reactions.${userId}`]: null,
        reactionsCount: updatedCounts,
        likedBy: newLikedBy,
        likesCount: newLikesCount
      });
      return { likesCount: newLikesCount, reactionsCount: updatedCounts, currentUserReaction: '' };
    } else {
      if (prevReaction) {
        updatedCounts[prevReaction] = Math.max(0, (updatedCounts[prevReaction] || 1) - 1);
      }
      existingReactions[userId] = reaction;
      updatedCounts[reaction] = (updatedCounts[reaction] || 0) + 1;
      const newLikedBy = Array.from(new Set([...(postData.likedBy || []), userId]));
      const newLikesCount = newLikedBy.length;
      await updateDoc(postRef, {
        [`reactions.${userId}`]: reaction,
        reactionsCount: updatedCounts,
        likedBy: newLikedBy,
        likesCount: newLikesCount
      });
      return { likesCount: newLikesCount, reactionsCount: updatedCounts, currentUserReaction: reaction };
    }
  } catch (error: any) {
    console.error(`[setCulturalReaction] Error:`, error);
    throw error;
  }
};

