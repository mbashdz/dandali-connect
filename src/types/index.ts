
export interface User {
  id: string; // This will be the Firebase UID
  uid: string; // Firebase UID
  username: string;
  name: string;
  email: string; 
  avatarUrl: string;
  coverPhotoUrl: string;
  bio: string;
  location?: string; 
  website?: string; 
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string; // ISO date string
  isCurrentUser?: boolean; 
  isFollowedByCurrentUser?: boolean; 
}

export interface Post {
  id: string; // Firestore document ID
  authorUid: string; // UID of the author
  authorUsername: string; // Denormalized
  authorName: string; // Denormalized
  authorAvatarUrl: string; // Denormalized
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  voiceNoteUrl?: string;
  likesCount: number;
  // likedBy: string[]; // Array of UIDs who liked the post, for more detailed logic
  commentsCount: number;
  timestamp: string; // ISO date string or Firebase Timestamp
  isLikedByCurrentUser?: boolean; // Client-side state, or determined by checking likedBy
  // Comments might be a subcollection in Firestore, or fetched separately.
  // For simplicity in PostCard, if comments are pre-loaded, they can be here.
  comments?: Comment[]; 
}

export interface Comment {
  id: string; // Firestore document ID for subcollection, or array index
  authorUid: string; // UID of the comment author
  authorUsername: string; // Denormalized
  authorName: string; // Denormalized
  authorAvatarUrl: string; // Denormalized
  content: string;
  timestamp: string; // ISO date string or Firebase Timestamp
  postId: string; // ID of the post this comment belongs to
}
