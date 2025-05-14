export interface User {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
  coverPhotoUrl: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isCurrentUser?: boolean;
  isFollowedByCurrentUser?: boolean;
}

export interface Post {
  id:string;
  author: User;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  voiceNoteUrl?: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string; 
  isLikedByCurrentUser?: boolean;
  comments: Comment[];
}

export interface Comment {
  id: string;
  author: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl'>;
  content: string;
  timestamp: string;
}
