
// Mock data has been removed as the application will now use Firebase Firestore.
// Keeping this file for any potential future utility functions not related to mock data.

// Example of how user data was structured, for reference during Firestore implementation:
/*
export const mockUsers: User[] = [
  {
    id: '1', 
    uid: 'mock-user-1-uid', 
    username: 'adamu_garba',
    name: 'Adamu Garba',
    email: 'adamu@example.com',
    avatarUrl: 'https://placehold.co/100x100.png',
    coverPhotoUrl: 'https://placehold.co/1000x300.png',
    bio: 'Dan kasuwa kuma mai son al\'umma. Ina son Hausa da al\'adunmu.',
    followersCount: 1500,
    followingCount: 250,
    postsCount: 120,
    isCurrentUser: true, 
    isFollowedByCurrentUser: false,
    createdAt: new Date().toISOString(),
  },
  // ... other mock users
];
*/

// Example of how post data was structured, for reference:
/*
export const mockPosts: Post[] = [
  {
    id: 'p1',
    // author: mockUsers[1], // This would be replaced by denormalized author fields or fetched author data
    authorUid: 'mock-user-2-uid',
    authorUsername: 'fatima_bello',
    authorName: 'Fatima Bello',
    authorAvatarUrl: 'https://placehold.co/100x100.png',
    content: 'Sallah Barka! Wishing everyone a blessed Eid. May your prayers be answered. 🙏 #EidMubarak #ArewaCulture',
    imageUrl: 'https://placehold.co/600x400.png',
    likesCount: 150,
    commentsCount: 25,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isLikedByCurrentUser: true,
    comments: [
      // ... mock comments
    ],
  },
  // ... other mock posts
];
*/
