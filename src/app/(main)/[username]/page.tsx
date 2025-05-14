// src/app/(main)/[username]/page.tsx
'use client'; // Needs to be client for hooks and data fetching for now

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProfileHeader } from "@/components/profile-header";
import { PostCard } from "@/components/post-card";
import { mockUsers, mockPosts } from "@/lib/data"; // Still using mock data for now
import type { User, Post as PostType } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/auth-context';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Loader2 } from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { currentUser: authUser, loading: authLoading } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) return;
      setLoadingProfile(true);
      
      // TODO: In a real app, you would query Firestore for the user by `username`.
      // This requires an index on the 'username' field in your 'users' collection.
      // For now, we'll find the user from mock data if it's not the authUser's profile.
      // And simulate fetching the authUser's profile data from Firestore.

      if (authUser && authUser.username === username) {
        // Viewing own profile
        const userRef = doc(db, "users", authUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser({ ...userSnap.data(), isCurrentUser: true } as User);
        } else {
          // This shouldn't happen if user profile is created on signup
          console.error("Auth user profile not found in Firestore");
          setUser(null);
        }
      } else {
        // Viewing another user's profile - still using mock for this part
        const foundUser = mockUsers.find(u => u.username === username);
        if (foundUser) {
          setUser({ 
            ...foundUser, 
            isCurrentUser: false,
            // Mock follow status, would come from DB
            isFollowedByCurrentUser: authUser ? Math.random() > 0.5 : false 
          });
        } else {
          setUser(null);
        }
      }
      setLoadingProfile(false);
    };

    if (!authLoading) { // Wait for auth state to be resolved
      fetchUserProfile();
    }
  }, [username, authUser, authLoading]);

  useEffect(() => {
    if (user) {
      // Filter posts by the user - still using mock posts
      // TODO: Fetch posts from Firestore where authorUid === user.uid
      const posts = mockPosts.filter(post => post.author.id === user?.id);
      setUserPosts(posts);
    } else {
      setUserPosts([]);
    }
  }, [user]);

  if (authLoading || loadingProfile) {
    return (
      <div className="container mx-auto max-w-3xl py-8 px-2 sm:px-4 text-center flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-3xl py-8 px-2 sm:px-4 text-center">
        <h1 className="text-2xl font-bold">User not found</h1>
        <p className="text-muted-foreground">The profile for @{username} could not be located.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-2 sm:px-4">
      <ProfileHeader user={user} />
      
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
            {userPosts.length > 0 ? (
              <div className="space-y-6">
                {userPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">This user hasn&apos;t posted anything yet.</p>
              </div>
            )}
        </TabsContent>
        <TabsContent value="media">
          <div className="text-center py-10">
            <p className="text-muted-foreground">Media content will appear here.</p>
          </div>
        </TabsContent>
        <TabsContent value="likes">
          <div className="text-center py-10">
            <p className="text-muted-foreground">Posts liked by this user will appear here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
