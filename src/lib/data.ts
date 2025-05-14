import type { User, Post, Comment } from '@/types';

// Note: getCurrentUser is removed as auth will be handled by Firebase.
// Mock data is kept for now for pages not yet migrated to Firestore.

export const mockUsers: User[] = [
  {
    id: '1', // This ID will be replaced by Firebase UID in a real scenario
    uid: 'mock-user-1-uid', // Example UID
    username: 'adamu_garba',
    name: 'Adamu Garba',
    email: 'adamu@example.com',
    avatarUrl: 'https://placehold.co/100x100.png',
    coverPhotoUrl: 'https://placehold.co/1000x300.png',
    bio: 'Dan kasuwa kuma mai son al\'umma. Ina son Hausa da al\'adunmu.',
    followersCount: 1500,
    followingCount: 250,
    postsCount: 120,
    isCurrentUser: true, // This logic will be handled by AuthContext
    isFollowedByCurrentUser: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    uid: 'mock-user-2-uid',
    username: 'fatima_bello',
    name: 'Fatima Bello',
    email: 'fatima@example.com',
    avatarUrl: 'https://placehold.co/100x100.png',
    coverPhotoUrl: 'https://placehold.co/1000x300.png',
    bio: 'Student of Life. Sharing positivity and cultural insights. Love reading and writing.',
    followersCount: 2200,
    followingCount: 300,
    postsCount: 85,
    isFollowedByCurrentUser: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    uid: 'mock-user-3-uid',
    username: 'sani_musa',
    name: 'Sani Musa',
    email: 'sani@example.com',
    avatarUrl: 'https://placehold.co/100x100.png',
    coverPhotoUrl: 'https://placehold.co/1000x300.png',
    bio: 'Tech enthusiast and entrepreneur. Building the future of Arewa.',
    followersCount: 500,
    followingCount: 100,
    postsCount: 30,
    isFollowedByCurrentUser: false,
    createdAt: new Date().toISOString(),
  },
];

export const mockPosts: Post[] = [
  {
    id: 'p1',
    author: mockUsers[1], 
    content: 'Sallah Barka! Wishing everyone a blessed Eid. May your prayers be answered. 🙏 #EidMubarak #ArewaCulture',
    imageUrl: 'https://placehold.co/600x400.png',
    likesCount: 150,
    commentsCount: 25,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isLikedByCurrentUser: true,
    comments: [
      { id: 'c1', author: mockUsers[0], content: 'Ameen! Barka da Sallah to you too Fatima.', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString() },
      { id: 'c2', author: mockUsers[2], content: 'Happy Eid celebrations!', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'p2',
    author: mockUsers[0],
    content: 'Just launched my new collection of traditional Hausa caps! Check them out on my Dandali page. Support local artisans! #HausaFashion #MadeInNigeria',
    imageUrl: 'https://placehold.co/600x400.png',
    likesCount: 230,
    commentsCount: 40,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    isLikedByCurrentUser: false,
    comments: [
       { id: 'c3', author: mockUsers[1], content: 'Wow, they look amazing! Will check it out.', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'p3',
    author: mockUsers[2],
    content: 'What are your favorite Hausa proverbs? Sharing one: "Hankali da shiriya, fiye da arziki." (Wisdom and guidance are better than riches). #HausaProverbs #DailyWisdom',
    likesCount: 95,
    commentsCount: 15,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    isLikedByCurrentUser: true,
    comments: [],
  },
  {
    id: 'p4',
    author: mockUsers[1],
    content: 'Exploring the beautiful landscapes of Northern Nigeria. Truly blessed. #TravelArewa #NigeriaNorth',
    imageUrl: 'https://placehold.co/600x400.png',
    likesCount: 180,
    commentsCount: 30,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    isLikedByCurrentUser: false,
    comments: [],
  },
];
