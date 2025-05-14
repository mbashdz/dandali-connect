
// src/app/(main)/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Image as ImageIcon, Mic, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { createPost, getGlobalPosts, getPostById } from '@/lib/firebase/posts';
import { uploadFile } from '@/lib/firebase/storage';
import type { Post as PostType } from '@/types';
import NextImage from 'next/image';

export default function NewsFeedPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [postContent, setPostContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] =useState<PostType[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name?: string) => {
    if (!name) return "DC";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0]?.[0] || '').toUpperCase() + (names[names.length - 1]?.[0] || '').toUpperCase();
  };
  
  const fetchPosts = useCallback(async () => {
    console.log("[NewsFeedPage] fetchPosts called.");
    setIsLoadingPosts(true);
    try {
      const fetchedPosts = await getGlobalPosts();
      setPosts(fetchedPosts);
      console.log("[NewsFeedPage] Posts fetched:", fetchedPosts.length);
    } catch (error) {
      console.error("[NewsFeedPage] Error fetching posts:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load posts." });
    } finally {
      setIsLoadingPosts(false);
      console.log("[NewsFeedPage] fetchPosts finished. isLoadingPosts:", false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
        fetchPosts();
    }
  }, [authLoading, fetchPosts]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = ""; 
    }
  };

  const handlePostSubmit = async () => {
    console.log("[NewsFeedPage] handlePostSubmit called. Current post content:", postContent);
    console.log("[NewsFeedPage] Current auth state: currentUser exists:", !!currentUser, "UID:", currentUser?.uid);
    console.log("[NewsFeedPage] Image file selected:", imageFile?.name);

    if (!postContent.trim() && !imageFile) {
      toast({
        variant: "destructive",
        title: "Cannot create empty post",
        description: "Please write something or add an image to post.",
      });
      console.warn("[NewsFeedPage] Post content and image are empty. Aborting.");
      return;
    }
    
    if (!currentUser || !currentUser.uid || !currentUser.username || !currentUser.name) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be fully logged in to post. User data (UID, username, or name) might be missing." });
      console.error("[NewsFeedPage] User not authenticated or critical user data missing. Aborting post creation. currentUser:", currentUser);
      setIsPosting(false); 
      return;
    }

    setIsPosting(true);
    let imageUrl: string | undefined = undefined;

    try {
      if (imageFile) {
        console.log("[NewsFeedPage] Uploading image...");
        imageUrl = await uploadFile(imageFile, `postImages/${currentUser.uid}`);
        console.log("[NewsFeedPage] Image uploaded, URL:", imageUrl);
      }

      console.log(`[NewsFeedPage] Attempting to create post for user UID: ${currentUser.uid}, Username: ${currentUser.username}, Name: ${currentUser.name}`);
      await createPost({
        content: postContent,
        authorUid: currentUser.uid,
        authorUsername: currentUser.username,
        authorName: currentUser.name,
        authorAvatarUrl: currentUser.avatarUrl || 'https://placehold.co/100x100.png', 
        imageUrl: imageUrl,
      });
      toast({
        title: "Post Submitted!",
        description: "Your post has been successfully submitted.",
      });
      console.log("[NewsFeedPage] Post submitted successfully for user:", currentUser.uid);
      setPostContent(""); 
      removeImage(); 
      fetchPosts(); 
    } catch (error: any) {
      console.error("[NewsFeedPage] Error creating post:", error.message, error.code, error);
      toast({ variant: "destructive", title: "Post Failed", description: `Could not submit your post. ${error.message || 'Check console for details.'}` });
    } finally {
      setIsPosting(false);
      console.log("[NewsFeedPage] handlePostSubmit finished. isPosting:", false);
    }
  };

  const handlePostUpdateInList = (updatedPost: PostType) => {
    setPosts(prevPosts => prevPosts.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-2 sm:px-4 text-center flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-2 sm:px-4">
      <div className="space-y-6">
        {currentUser && (
          <Card className="shadow-lg rounded-xl">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name || currentUser.username} data-ai-hint="user avatar" />
                  <AvatarFallback>{getInitials(currentUser.name || currentUser.username)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg font-semibold">Create Post</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <Textarea 
                placeholder={`What's on your mind, ${currentUser.name || currentUser.username}?`} 
                className="mb-3 min-h-[80px]"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                disabled={isPosting}
              />
              {imagePreview && (
                <div className="mb-3 relative w-full max-w-xs sm:max-w-sm md:max-w-md">
                  <NextImage src={imagePreview} alt="Image preview" width={400} height={300} className="rounded-md object-contain max-h-60" data-ai-hint="image preview"/>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={removeImage}
                    disabled={isPosting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
               <input
                type="file"
                accept="image/*"
                ref={imageInputRef}
                onChange={handleImageChange}
                className="hidden"
                disabled={isPosting}
              />
              <div className="flex justify-between items-center">
                <div className="flex space-x-1 sm:space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-2 sm:px-3" 
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isPosting || !!imagePreview} 
                  >
                    <ImageIcon className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Photo/Video</span>
                  </Button>
                   <Button variant="ghost" size="sm" className="px-2 sm:px-3" disabled={isPosting} title="Voice recording coming soon!">
                      <Mic className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Voice</span>
                   </Button>
                </div>
                <Button 
                  onClick={handlePostSubmit} 
                  disabled={isPosting || (!postContent.trim() && !imageFile) || !currentUser}
                >
                  {isPosting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  {isPosting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoadingPosts ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onPostUpdate={handlePostUpdateInList} />
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
          </div>
        )}
      </div>
    </div>
  );
}
