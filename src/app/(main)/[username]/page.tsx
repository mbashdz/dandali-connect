// src/app/(main)/[username]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ProfileHeader } from "@/components/profile-header";
import { PostCard } from "@/components/post-card";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { User, Post as PostType } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EditProfileForm } from '@/components/edit-profile-form';
import { useAuth } from '@/contexts/auth-context';
import { updateUserProfile, getUserProfileByUsername, checkIsFollowing } from '@/lib/firebase/users'; 
import { getUserPosts, getGlobalPosts } from '@/lib/firebase/posts';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Image as ImageIcon, Heart, Bookmark } from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const usernameFromUrl = params.username as string;
  const { currentUser: authUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [likedPosts, setLikedPosts] = useState<PostType[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostType[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Lightbox for media gallery
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const fetchUserProfileAndPosts = useCallback(async () => {
    if (!usernameFromUrl) return;
    setLoadingProfile(true);
    setLoadingPosts(true);

    try {
      const userData = await getUserProfileByUsername(usernameFromUrl);

      if (userData) {
        let isFollowed = false;
        if (authUser?.uid && userData.uid && authUser.uid !== userData.uid) {
          isFollowed = await checkIsFollowing(authUser.uid, userData.uid);
        }

        setProfileUser({
          ...userData,
          isCurrentUser: authUser?.uid === userData.uid,
          isFollowedByCurrentUser: isFollowed,
        });

        if (userData.uid) {
          const [posts, globalResult] = await Promise.all([
            getUserPosts(userData.uid),
            getGlobalPosts(50),
          ]);
          setUserPosts(posts);

          // Filter posts liked or reacted to by this profile user
          const userLiked = globalResult.posts.filter(
            (p) =>
              p.likedBy?.includes(userData.uid) ||
              (p.reactions && !!p.reactions[userData.uid])
          );
          setLikedPosts(userLiked);

          // Filter posts bookmarked/saved by this profile user
          const userSaved = globalResult.posts.filter(
            (p) =>
              p.bookmarkedBy?.includes(userData.uid) ||
              userData.bookmarkedPostIds?.includes(p.id)
          );
          setSavedPosts(userSaved);
        }
      } else {
        setProfileUser(null);
        setUserPosts([]);
        setLikedPosts([]);
        setSavedPosts([]);
      }
    } catch (error: any) {
      console.error("[UserProfilePage] Error fetching user profile or posts:", error.message, error.code, error);
      toast({ variant: "destructive", title: "Error", description: "Could not load profile or posts." });
      setProfileUser(null);
      setUserPosts([]);
    } finally {
      setLoadingProfile(false);
      setLoadingPosts(false);
    }
  }, [usernameFromUrl, authUser, toast]);

  useEffect(() => {
    if (!authLoading) { 
      fetchUserProfileAndPosts();
    }
  }, [authLoading, authUser, fetchUserProfileAndPosts]);

  const handleOpenEditDialog = () => setIsEditingProfile(true);
  const handleCloseEditDialog = () => setIsEditingProfile(false);

  const handleSaveProfile = async (data: Partial<User>) => {
    if (!profileUser || !authUser || profileUser.uid !== authUser.uid) {
      toast({ variant: "destructive", title: "Error", description: "Cannot save profile. You might not be authorized." });
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateUserProfile(authUser.uid, data);
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      await fetchUserProfileAndPosts(); 
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error("[UserProfilePage] Error updating profile:", error.message, error.code, error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update your profile." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePostUpdateInList = (updatedPost: PostType & { _deleted?: boolean }) => {
    if (updatedPost._deleted) {
      setUserPosts((prevPosts) => prevPosts.filter((p) => p.id !== updatedPost.id));
      setLikedPosts((prevPosts) => prevPosts.filter((p) => p.id !== updatedPost.id));
      setSavedPosts((prevPosts) => prevPosts.filter((p) => p.id !== updatedPost.id));
    } else {
      setUserPosts((prevPosts) => prevPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
      setLikedPosts((prevPosts) => prevPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
      setSavedPosts((prevPosts) => prevPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    }
  };

  // Extract all photos from user's posts for the Media gallery
  const mediaPosts = userPosts.filter(
    (p) => (p.imageUrls && p.imageUrls.length > 0) || !!p.imageUrl || !!p.voiceNoteUrl
  );
  const allUserPhotos: string[] = userPosts.flatMap((p) =>
    p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls : p.imageUrl ? [p.imageUrl] : []
  );

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
        <TabsList className={`grid w-full ${profileUser.isCurrentUser ? 'grid-cols-4' : 'grid-cols-3'} mb-4 rounded-2xl`}>
          <TabsTrigger value="posts" className="rounded-xl text-xs sm:text-sm">
            Posts ({userPosts.length})
          </TabsTrigger>
          <TabsTrigger value="media" className="rounded-xl text-xs sm:text-sm">
            Media ({mediaPosts.length})
          </TabsTrigger>
          <TabsTrigger value="likes" className="rounded-xl text-xs sm:text-sm">
            Likes ({likedPosts.length})
          </TabsTrigger>
          {profileUser.isCurrentUser && (
            <TabsTrigger value="saved" className="rounded-xl text-xs sm:text-sm gap-1">
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
              Saved ({savedPosts.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="posts">
          {loadingPosts ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userPosts.length > 0 ? (
            <div className="space-y-6">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} onPostUpdate={handlePostUpdateInList} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-2xl border border-dashed">
              <p className="text-muted-foreground text-sm">@{profileUser.username} hasn&apos;t posted anything yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="media">
          {allUserPhotos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-primary" /> Photo Gallery ({allUserPhotos.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {allUserPhotos.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setLightboxIndex(idx);
                      setLightboxOpen(true);
                    }}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-border/70 bg-muted cursor-pointer group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl}
                      alt={`${profileUser.name} media ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {mediaPosts.length > 0 ? (
            <div className="space-y-6">
              {mediaPosts.map((post) => (
                <PostCard key={post.id} post={post} onPostUpdate={handlePostUpdateInList} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-2xl border border-dashed">
              <ImageIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No photos or voice notes shared by @{profileUser.username} yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="likes">
          {likedPosts.length > 0 ? (
            <div className="space-y-6">
              {likedPosts.map((post) => (
                <PostCard key={post.id} post={post} onPostUpdate={handlePostUpdateInList} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-2xl border border-dashed">
              <Heart className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Posts reacted to by @{profileUser.username} will appear here.</p>
            </div>
          )}
        </TabsContent>

        {profileUser.isCurrentUser && (
          <TabsContent value="saved">
            {savedPosts.length > 0 ? (
              <div className="space-y-6">
                {savedPosts.map((post) => (
                  <PostCard key={post.id} post={post} onPostUpdate={handlePostUpdateInList} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-2xl border border-dashed">
                <Bookmark className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  Tap the bookmark icon on any post to save it here for later reading.
                </p>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {allUserPhotos.length > 0 && (
        <ImageLightbox
          isOpen={lightboxOpen}
          images={allUserPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          title={`${profileUser.name}'s media`}
        />
      )}

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
