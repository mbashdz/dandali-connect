// src/app/(main)/page.tsx
'use client'; // Needs to be client for auth context and eventual post creation

import { useState } from 'react';
import { PostCard } from "@/components/post-card";
import { mockPosts } from "@/lib/data"; // Still using mock data for posts
import { Button } from "@/components/ui/button";
import { PlusCircle, Image as ImageIcon, Mic, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast"; // Import useToast

export default function NewsFeedPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast(); // Initialize toast
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return "DC";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + (names[names.length - 1][0]?.toUpperCase() || '');
  };
  
  const handlePostSubmit = async () => {
    if (!postContent.trim()) {
      toast({
        variant: "destructive",
        title: "Cannot create empty post",
        description: "Please write something to post.",
      });
      return;
    }
    setIsPosting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("New post content:", postContent);
    // TODO: Implement actual post creation to Firestore
    
    toast({
      title: "Post Submitted!",
      description: "Your post will appear shortly (once implemented).",
    });
    setPostContent(""); // Clear textarea
    setIsPosting(false);
  };

  // TODO: Fetch posts from Firestore for the user's feed.
  // For now, displaying all mock posts.

  return (
    <div className="container mx-auto max-w-2xl py-8 px-2 sm:px-4">
      <div className="space-y-6">
        {currentUser && (
          <Card className="shadow-lg rounded-xl">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name || currentUser.username} data-ai-hint="user avatar small" />
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

        {mockPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
