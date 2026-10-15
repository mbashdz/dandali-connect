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
  verified?: boolean; // African creator / community leader badge
  hideFollowersCount?: boolean; // Privacy setting to hide follower counts from public
}

export type CulturalReactionType = 'kauna' | 'madalla' | 'wuta' | 'dariya' | 'alheri';

export interface ReactionCount {
  kauna?: number;
  madalla?: number;
  wuta?: number;
  dariya?: number;
  alheri?: number;
}

export interface Post {
  id: string; // Firestore document ID
  authorUid: string; // UID of the author
  authorUsername: string; // Denormalized
  authorName: string; // Denormalized
  authorAvatarUrl: string; // Denormalized
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  voiceNoteUrl?: string;
  voiceDuration?: number; // Duration in seconds
  likesCount: number;
  likedBy: string[]; // Array of UIDs who liked the post
  reactions?: Record<string, CulturalReactionType>; // uid -> reaction
  reactionsCount?: ReactionCount;
  commentsCount: number;
  timestamp: string; // ISO date string or Firebase Timestamp
  isLikedByCurrentUser?: boolean; // Client-side state, derived from likedBy
  currentUserReaction?: CulturalReactionType;
  comments?: Comment[];
  category?: string; // e.g. "Al'umma", "Labarai", "Kasuwa", "Kida/Fim"
  isEdited?: boolean;
  updatedAt?: string;
}

export interface Comment {
  id: string; // Firestore document ID from subcollection
  authorUid: string; // UID of the comment author
  authorUsername: string; // Denormalized
  authorName: string; // Denormalized
  authorAvatarUrl: string; // Denormalized
  content: string;
  voiceNoteUrl?: string;
  timestamp: string; // ISO date string or Firebase Timestamp
  postId: string; // ID of the post this comment belongs to
}

export interface Story {
  id: string;
  authorUid: string;
  authorUsername: string;
  authorName: string;
  authorAvatarUrl: string;
  mediaUrl?: string;
  text?: string;
  bgColor?: string;
  createdAt: string;
  expiresAt: string;
  viewed?: boolean;
}

export interface KasuwaItem {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'NGN' | 'GHS' | 'XOF' | 'KES' | 'USD';
  location: string;
  category: 'electronics' | 'fashion' | 'food' | 'vehicles' | 'services' | 'handicrafts' | 'property';
  imageUrl: string;
  sellerUid: string;
  sellerName: string;
  sellerPhone?: string;
  sellerWhatsapp?: string;
  sellerAvatarUrl: string;
  createdAt: string;
  isSold?: boolean;
}

export interface DirectMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderAvatarUrl: string;
  recipientUid: string;
  recipientName: string;
  text: string;
  createdAt: string;
  read?: boolean;
}

export interface Conversation {
  id: string; // Composite: [uid1, uid2].sort().join('_')
  participants: string[]; // [uid1, uid2]
  participantData: Record<string, { name: string; username: string; avatarUrl: string }>;
  lastMessage: string;
  lastSenderUid: string;
  updatedAt: string;
  unreadCount?: Record<string, number>;
}
