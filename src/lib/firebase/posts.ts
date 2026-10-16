
// src/lib/firebase/posts.ts
import { auth, db } from './config'; // Ensure auth is imported
import { 
  collection, 
  addDoc, 
  doc, 
  Timestamp, 
  updateDoc, 
  deleteDoc,
  increment, 
  query, 
  where, 
  orderBy, 
  getDocs,
  getDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  limit,
  startAfter,
  type DocumentSnapshot
} from 'firebase/firestore';
import { createNotification } from './notifications';
import type { Post, Comment as CommentType } from '@/types';

interface CreatePostData {
  content: string;
  authorUid: string;
  authorUsername: string;
  authorName: string;
  authorAvatarUrl: string;
  imageUrl?: string;
  imageUrls?: string[];
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
    const postPayload: Record<string, any> = {
      content: postData.content,
      authorUid: postData.authorUid,
      authorUsername: postData.authorUsername,
      authorName: postData.authorName,
      authorAvatarUrl: postData.authorAvatarUrl,
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      timestamp: serverTimestamp(),
    };

    if (postData.imageUrls && postData.imageUrls.length > 0) {
      postPayload.imageUrls = postData.imageUrls;
      postPayload.imageUrl = postData.imageUrls[0];
    } else if (postData.imageUrl) {
      postPayload.imageUrl = postData.imageUrl;
      postPayload.imageUrls = [postData.imageUrl];
    }
    if (postData.videoUrl) {
      postPayload.videoUrl = postData.videoUrl;
    }
    if (postData.voiceNoteUrl) {
      postPayload.voiceNoteUrl = postData.voiceNoteUrl;
    }

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

    // Notify author's followers asynchronously
    (async () => {
      try {
        const followersSnap = await getDocs(collection(db, 'users', postData.authorUid, 'followers'));
        followersSnap.forEach((followerDoc) => {
          const followerUid = followerDoc.id;
          if (followerUid && followerUid !== postData.authorUid) {
            createNotification(
              followerUid,
              'like', // badge icon
              `posted a new update`,
              `/${postData.authorUsername}`
            ).catch(() => {});
          }
        });
      } catch (err) {
        console.warn("[createPost] Followers notification warning:", err);
      }
    })();

    return postRef.id;
  } catch (error: any) { // This is line 64 in your original file structure
    console.error("[createPost] Error during Firestore operation:", error.message, "Code:", error.code, "Details:", error); // This is line 65
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
      console.error("[createPost] Firestore permission denied. Detailed error above. Check security rules for 'posts' collection (create operation) and 'users' collection (update operation for postsCount). Ensure authorUid in postData matches authenticated user's UID as per Firebase Auth SDK. SDK UID was:", firebaseAuthCurrentUser?.uid);
    }
    throw error; 
  }
};

export interface PaginatedPostsResult {
  posts: Post[];
  lastVisibleDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

export const getGlobalPosts = async (
  limitCount: number = 10,
  lastDoc: DocumentSnapshot | null = null
): Promise<PaginatedPostsResult> => {
  console.log("[getGlobalPosts] Attempting to fetch global posts, limit:", limitCount);
  try {
    const postsRef = collection(db, 'posts');
    let q = query(
      postsRef,
      orderBy('timestamp', 'desc'),
      where('timestamp', '!=', null),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(
        postsRef,
        orderBy('timestamp', 'desc'),
        where('timestamp', '!=', null),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const postTimestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString();
      posts.push({ 
        id: docSnap.id, 
        ...data,
        timestamp: postTimestamp,
        likedBy: data.likedBy || [],
      } as Post);
    });

    const lastVisibleDoc = querySnapshot.docs.length > 0 
      ? querySnapshot.docs[querySnapshot.docs.length - 1] 
      : null;

    return {
      posts,
      lastVisibleDoc,
      hasMore: querySnapshot.docs.length === limitCount,
    };
  } catch (error: any) {
    console.error("[getGlobalPosts] Error:", error.message, error.code, error);
    return { posts: [], lastVisibleDoc: null, hasMore: false }; 
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

      if (postData.authorUid && postData.authorUid !== userId) {
        createNotification(
          postData.authorUid,
          'like',
          `liked your post`,
          `/${postData.authorUsername || postData.authorUid}`
        ).catch(() => {});
      }
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
    voiceNoteUrl?: string;
  }
): Promise<CommentType> => {
  const firebaseAuthCurrentUser = auth.currentUser;
  console.log(`[addCommentToPost] User ${commentData.authorUid} (SDK UID: ${firebaseAuthCurrentUser?.uid}) attempting to comment on post ${postId}`);
  
  if (!commentData.authorUid || (!commentData.content.trim() && !commentData.voiceNoteUrl)) {
    throw new Error("Author UID and content or voice note are required for a comment.");
  }
  if (!firebaseAuthCurrentUser || firebaseAuthCurrentUser.uid !== commentData.authorUid) {
     console.error(`[addCommentToPost] Auth mismatch or SDK user null. SDK UID: ${firebaseAuthCurrentUser?.uid}, commentData.authorUid: ${commentData.authorUid}`);
    throw new Error("Authentication mismatch or user not properly authenticated for adding comment.");
  }

  const postRef = doc(db, 'posts', postId);
  const commentsRef = collection(postRef, 'comments');
  
  try {
    const newCommentPayload: Record<string, any> = {
      authorUid: commentData.authorUid,
      authorUsername: commentData.authorUsername || 'anonymous',
      authorName: commentData.authorName || 'Community Member',
      authorAvatarUrl: commentData.authorAvatarUrl || 'https://placehold.co/100x100.png',
      content: commentData.content.trim(),
      postId: postId,
      timestamp: serverTimestamp(),
    };
    if (commentData.voiceNoteUrl) {
      newCommentPayload.voiceNoteUrl = commentData.voiceNoteUrl;
    }
    console.log(`[addCommentToPost] Payload for new comment: ${JSON.stringify(newCommentPayload)}`);
    const commentDocRef = await addDoc(commentsRef, newCommentPayload);
    console.log(`[addCommentToPost] Comment added to post ${postId} with ID ${commentDocRef.id}`);
    
    try {
      await updateDoc(postRef, {
        commentsCount: increment(1)
      });
    } catch (countErr) {
      console.warn(`[addCommentToPost] Could not increment commentsCount for post ${postId}:`, countErr);
    }

    // Notify post author about the new comment
    (async () => {
      try {
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const postData = postSnap.data() as Post;
          if (postData.authorUid && postData.authorUid !== commentData.authorUid) {
            await createNotification(
              postData.authorUid,
              'comment',
              `commented on your post: "${commentData.content.trim().slice(0, 40)}"`,
              `/${postData.authorUsername || postData.authorUid}`
            );
          }
        }
      } catch (notifErr) {
        console.warn("[addCommentToPost] Notification warning:", notifErr);
      }
    })();

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

export const deleteCommentFromPost = async (postId: string, commentId: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Must be logged in to delete a comment.");

  const commentRef = doc(db, 'posts', postId, 'comments', commentId);
  await deleteDoc(commentRef);

  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      commentsCount: increment(-1),
    });
  } catch (err) {
    console.warn("[deleteCommentFromPost] Could not decrement commentsCount:", err);
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

      if (!prevReaction && postData.authorUid && postData.authorUid !== userId) {
        createNotification(
          postData.authorUid,
          'like',
          `Ya nuna "${reaction.toUpperCase()}" a kan sakonka (reacted to your post)`,
          `/${postData.authorUsername || postData.authorUid}`
        ).catch(() => {});
      }

      return { likesCount: newLikesCount, reactionsCount: updatedCounts, currentUserReaction: reaction };
    }
  } catch (error: any) {
    console.error(`[setCulturalReaction] Error:`, error);
    throw error;
  }
};

export const updatePostContent = async (postId: string, newContent: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Must be logged in to edit a post.");
  
  const postRef = doc(db, 'posts', postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) throw new Error("Post does not exist.");
  if (postSnap.data().authorUid !== currentUser.uid) {
    throw new Error("Unauthorized: You can only edit your own posts.");
  }

  await updateDoc(postRef, {
    content: newContent,
    isEdited: true,
    updatedAt: serverTimestamp(),
  });
};

export const deletePost = async (postId: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Must be logged in to delete a post.");

  const postRef = doc(db, 'posts', postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) throw new Error("Post does not exist.");
  if (postSnap.data().authorUid !== currentUser.uid) {
    throw new Error("Unauthorized: You can only delete your own posts.");
  }

  await deleteDoc(postRef);

  // Decrement user's post count
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      postsCount: increment(-1),
    });
  } catch (err) {
    console.warn("[deletePost] Could not decrement postsCount:", err);
  }
};

