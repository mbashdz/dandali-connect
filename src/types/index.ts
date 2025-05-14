export interface User {
  id: string; // This will be the Firebase UID
  uid: string; // Firebase UID
  username: string;
  name: string;
  email: string; // Added email
  avatarUrl: string;
  coverPhotoUrl: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string; // ISO date string
  isCurrentUser?: boolean; // This will be determined by comparing with authContext.currentUser.uid
  isFollowedByCurrentUser?: boolean; // This will require Firestore logic later
}

export interface Post {
  id:string; // Firestore document ID
  authorUid: string; // UID of the author
  author: User; // Denormalized author info (or fetched separately)
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  voiceNoteUrl?: string;
  likesCount: number;
  // likedBy: string[]; // Array of UIDs who liked the post, for more detailed logic
  commentsCount: number;
  timestamp: string; // ISO date string or Firebase Timestamp
  isLikedByCurrentUser?: boolean; // Client-side state, or determined by checking likedBy
  comments: Comment[]; // Subcollection or array of comments
}

export interface Comment {
  id: string; // Firestore document ID for subcollection, or array index
  authorUid: string; // UID of the comment author
  author: Pick<User, 'uid' | 'username' | 'name' | 'avatarUrl'>; // Denormalized author info
  content: string;
  timestamp: string; // ISO date string or Firebase Timestamp
}
