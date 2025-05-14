
// src/app/(main)/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Image as ImageIcon, Mic, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { createPost, getGlobalPosts } from '@/lib/firebase/posts';
import type { Post as PostType } from '@/types';

export default function NewsFeedPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const getInitials = (name?: string) => {
    if (!name) return "DC";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + (names[names.length - 1][0]?.toUpperCase() || '');
  };
  
  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const fetchedPosts = await getGlobalPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load posts." });
    } finally {
      setIsLoadingPosts(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostSubmit = async () => {
    if (!postContent.trim()) {
      toast({
        variant: "destructive",
        title: "Cannot create empty post",
        description: "Please write something to post.",
      });
      return;
    }
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to post." });
      return;
    }
    setIsPosting(true);
    try {
      await createPost({
        content: postContent,
        authorUid: currentUser.uid,
        authorUsername: currentUser.username,
        authorName: currentUser.name,
        authorAvatarUrl: currentUser.avatarUrl,
      });
      toast({
        title: "Post Submitted!",
        description: "Your post has been successfully submitted.",
      });
      setPostContent(""); 
      fetchPosts(); // Refresh posts list
    } catch (error) {
      console.error("Error creating post:", error);
      toast({ variant: "destructive", title: "Post Failed", description: "Could not submit your post." });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-2 sm:px-4">
      <div className="space-y-6">
        {currentUser && (
          <Card className="shadow-lg rounded-xl">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name || currentUser.username} data-ai-hint="user avatar" />
                  <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
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
              <div className="flex justify-between items-center">
                <div className="flex space-x-1 sm:space-x-2">
                  <Button variant="ghost" size="sm" className="px-2 sm:px-3" disabled={isPosting}>
                    <ImageIcon className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Photo/Video</span>
                  </Button>
                   <Button variant="ghost" size="sm" className="px-2 sm:px-3" disabled={isPosting}>
                      <Mic className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Voice</span>
                   </Button>
                </div>
                <Button onClick={handlePostSubmit} disabled={isPosting || !postContent.trim()}>
                  {isPosting ? (
                    <Send className="mr-2 h-4 w-4 animate-pulse" />
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
            <PostCard key={post.id} post={post} />
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
