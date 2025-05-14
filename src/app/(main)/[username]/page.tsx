// src/app/(main)/[username]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ProfileHeader } from "@/components/profile-header";
import { PostCard } from "@/components/post-card";
import { mockPosts, mockUsers } from "@/lib/data"; // Still using mock data for posts for now
import type { User, Post as PostType } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EditProfileForm } from '@/components/edit-profile-form';
import { useAuth } from '@/contexts/auth-context';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { updateUserProfile } from '@/lib/firebase/users'; // Ensure this path is correct
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const usernameFromUrl = params.username as string;
  const { currentUser: authUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<PostType[]>([]); // TODO: Fetch actual posts
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    if (!usernameFromUrl) return;
    setLoadingProfile(true);

    try {
      // Query for the user by username
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", usernameFromUrl));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        
        setProfileUser({
          ...userData,
          isCurrentUser: authUser?.uid === userData.uid,
          // TODO: Implement isFollowedByCurrentUser logic from Firestore
          isFollowedByCurrentUser: authUser ? Math.random() > 0.5 : false // Mock for now
        });
      } else {
        console.log("No such user!");
        setProfileUser(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load profile." });
      setProfileUser(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [usernameFromUrl, authUser, toast]);

  useEffect(() => {
    if (!authLoading) { // Wait for auth state to be resolved
      fetchUserProfile();
    }
  }, [authLoading, fetchUserProfile]);

  useEffect(() => {
    if (profileUser) {
      // TODO: Fetch posts from Firestore where authorUid === profileUser.uid
      const posts = mockPosts.filter(post => post.author.username === profileUser?.username); // Temporary mock filter
      setUserPosts(posts);
    } else {
      setUserPosts([]);
    }
  }, [profileUser]);

  const handleOpenEditDialog = () => setIsEditingProfile(true);
  const handleCloseEditDialog = () => setIsEditingProfile(false);

  const handleSaveProfile = async (data: Partial<User>) => {
    if (!profileUser || !authUser || profileUser.uid !== authUser.uid) return;
    setIsSavingProfile(true);
    try {
      await updateUserProfile(authUser.uid, data);
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      // Refresh profile data
      await fetchUserProfile(); 
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update your profile." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <div className="container mx-auto max-w-3xl py-8 px-2 sm:px-4 text-center flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container mx-auto max-w-3xl py-8 px-2 sm:px-4 text-center">
        <h1 className="text-2xl font-bold">User not found</h1>
        <p className="text-muted-foreground">The profile for @{usernameFromUrl} could not be located.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-2 sm:px-4">
      <ProfileHeader 
        user={profileUser} 
        onEditProfile={profileUser.isCurrentUser ? handleOpenEditDialog : undefined} 
      />
      
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

      {profileUser.isCurrentUser && (
        <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            <EditProfileForm 
              user={profileUser} 
              onSave={handleSaveProfile} 
              onCancel={handleCloseEditDialog}
              isSaving={isSavingProfile}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
