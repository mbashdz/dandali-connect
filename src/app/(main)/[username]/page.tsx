
// src/app/(main)/[username]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ProfileHeader } from "@/components/profile-header";
import { PostCard } from "@/components/post-card";
import type { User, Post as PostType } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EditProfileForm } from '@/components/edit-profile-form';
import { useAuth } from '@/contexts/auth-context';
import { updateUserProfile, getUserProfileByUsername } from '@/lib/firebase/users'; // Updated import
import { getUserPosts } from '@/lib/firebase/posts';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const usernameFromUrl = params.username as string;
  const { currentUser: authUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const fetchUserProfileAndPosts = useCallback(async () => {
    if (!usernameFromUrl) return;
    console.log(`[UserProfilePage] Fetching profile for username: ${usernameFromUrl}`);
    setLoadingProfile(true);
    setLoadingPosts(true);

    try {
      const userData = await getUserProfileByUsername(usernameFromUrl);

      if (userData) {
        console.log(`[UserProfilePage] User data found for ${usernameFromUrl}:`, userData);
        setProfileUser({
          ...userData,
          isCurrentUser: authUser?.uid === userData.uid,
          // TODO: Implement isFollowedByCurrentUser logic from Firestore
          isFollowedByCurrentUser: authUser ? Math.random() > 0.5 : false // Mock for now
        });

        if (userData.uid) {
          console.log(`[UserProfilePage] Fetching posts for user UID: ${userData.uid}`);
          const posts = await getUserPosts(userData.uid);
          setUserPosts(posts);
          console.log(`[UserProfilePage] Posts fetched for ${usernameFromUrl}:`, posts.length);
        }
      } else {
        console.log(`[UserProfilePage] No user found for username: ${usernameFromUrl}`);
        setProfileUser(null);
        setUserPosts([]);
      }
    } catch (error: any) {
      console.error("[UserProfilePage] Error fetching user profile or posts:", error.message, error.code, error);
      toast({ variant: "destructive", title: "Error", description: "Could not load profile or posts." });
      setProfileUser(null);
      setUserPosts([]);
    } finally {
      setLoadingProfile(false);
      setLoadingPosts(false);
      console.log(`[UserProfilePage] Finished fetching profile and posts for ${usernameFromUrl}`);
    }
  }, [usernameFromUrl, authUser, toast]);

  useEffect(() => {
    console.log("[UserProfilePage] Auth loading state:", authLoading);
    if (!authLoading) { 
      fetchUserProfileAndPosts();
    }
  }, [authLoading, fetchUserProfileAndPosts]);


  const handleOpenEditDialog = () => setIsEditingProfile(true);
  const handleCloseEditDialog = () => setIsEditingProfile(false);

  const handleSaveProfile = async (data: Partial<User>) => {
    if (!profileUser || !authUser || profileUser.uid !== authUser.uid) {
      console.warn("[UserProfilePage] Save profile aborted: conditions not met.", { profileUser, authUser });
      return;
    }
    console.log("[UserProfilePage] Saving profile for user:", authUser.uid, "Data:", data);
    setIsSavingProfile(true);
    try {
      await updateUserProfile(authUser.uid, data);
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      await fetchUserProfileAndPosts(); 
      setIsEditingProfile(false);
      console.log("[UserProfilePage] Profile saved and re-fetched successfully.");
    } catch (error: any) {
      console.error("[UserProfilePage] Error updating profile:", error.message, error.code, error);
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
          <TabsTrigger value="posts">Posts ({profileUser.postsCount || userPosts.length || 0})</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
            {loadingPosts ? (
               <div className="flex justify-center items-center py-10">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
               </div>
            ) : userPosts.length > 0 ? (
              <div className="space-y-6">
                {userPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">@{profileUser.username} hasn&apos;t posted anything yet.</p>
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
            <p className="text-muted-foreground">Posts liked by @{profileUser.username} will appear here.</p>
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
