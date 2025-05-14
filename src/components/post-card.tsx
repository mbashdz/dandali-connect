"use client"

import type { Post } from "@/types"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Heart, Share2, Send, MoreHorizontal } from "lucide-react"
import { formatDistanceToNowStrict } from 'date-fns'
import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea" // For comment input
import { Separator } from "@/components/ui/separator"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [timestamp, setTimestamp] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  useEffect(() => {
    setTimestamp(formatDistanceToNowStrict(new Date(post.timestamp), { addSuffix: true }));
  }, [post.timestamp]);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    // In a real app, you would also make an API call here
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      // Mock adding comment
      console.log("New comment:", newComment);
      // Add to post.comments (mutate mock data or call API)
      setNewComment("");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center space-x-3">
          <Link href={`/${post.author.username}`}>
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={post.author.avatarUrl} alt={post.author.name} data-ai-hint="user avatar" />
              <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/${post.author.username}`}>
              <CardTitle className="text-base font-semibold hover:underline">{post.author.name}</CardTitle>
            </Link>
            <p className="text-xs text-muted-foreground">{timestamp}</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden border">
            <Image
              src={post.imageUrl}
              alt="Post image"
              width={600}
              height={400}
              className="object-cover w-full"
              data-ai-hint="social media post"
            />
          </div>
        )}
        {/* Placeholder for video or voice note */}
         {post.voiceNoteUrl && (
          <div className="mt-3 p-3 bg-secondary rounded-lg flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            <span className="text-sm text-secondary-foreground">Voice Post</span>
            {/* Add audio player controls here */}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col items-start">
        <div className="flex justify-between w-full mb-2 text-xs text-muted-foreground">
            <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
            <span>{post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}</span>
        </div>
        <Separator />
        <div className="flex justify-around w-full pt-2">
          <Button variant="ghost" className="flex-1" onClick={handleLike}>
            <Heart className={`mr-2 h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} /> Like
          </Button>
          <Button variant="ghost" className="flex-1" onClick={() => setShowComments(!showComments)}>
            <MessageCircle className="mr-2 h-5 w-5" /> Comment
          </Button>
          <Button variant="ghost" className="flex-1">
            <Share2 className="mr-2 h-5 w-5" /> Share
          </Button>
        </div>
        {showComments && (
          <div className="w-full mt-4">
            <Separator className="mb-4" />
            <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.author.avatarUrl} alt="Current User" data-ai-hint="user avatar" />
                <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-grow min-h-[40px] resize-none"
                rows={1}
              />
              <Button type="submit" size="icon" disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {post.comments.length > 0 ? (
              <div className="space-y-3">
                {post.comments.map(comment => (
                  <div key={comment.id} className="flex items-start space-x-2">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} data-ai-hint="user avatar" />
                       <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
                    </Avatar>
                    <div className="bg-secondary p-2 rounded-lg flex-1">
                      <div className="flex items-center justify-between">
                         <Link href={`/${comment.author.username}`} className="text-xs font-semibold hover:underline">{comment.author.name}</Link>
                         <span className="text-xs text-muted-foreground">{formatDistanceToNowStrict(new Date(comment.timestamp), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">No comments yet.</p>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
