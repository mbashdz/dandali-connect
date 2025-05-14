
"use client"

import type { Post, Comment as CommentType, User } from "@/types"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Heart, Share2, Send, MoreHorizontal, Mic } from "lucide-react" // Added Mic
import { formatDistanceToNowStrict } from 'date-fns'
import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea" 
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context" 


interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const { currentUser } = useAuth();
  const [timestamp, setTimestamp] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser || false); 
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [comments, setComments] = useState<CommentType[]>(post.comments || []);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);


  useEffect(() => {
    if (post.timestamp) {
      try {
        const date = new Date(post.timestamp);
        // Check if date is valid before formatting
        if (!isNaN(date.getTime())) {
          setTimestamp(formatDistanceToNowStrict(date, { addSuffix: true }));
        } else {
          setTimestamp("just now"); // Fallback for invalid date string
        }
      } catch (e) {
        console.warn("Error formatting post timestamp:", e, "Timestamp value:", post.timestamp);
        setTimestamp("just now"); 
      }
    } else {
      setTimestamp("unknown time");
    }
  }, [post.timestamp]);

  const getInitials = (name?: string) => {
    if (!name) return "??";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] || '').toUpperCase() + (names[names.length - 1][0] || '').toUpperCase();
  }

  const handleLike = () => {
    // TODO: Implement actual like functionality with Firestore
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    console.log(isLiked ? "Unliked post" : "Liked post", post.id);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    const mockComment: CommentType = {
      id: `mockcomment_${Date.now()}`,
      authorUid: currentUser.uid,
      authorUsername: currentUser.username || 'anonymous',
      authorName: currentUser.name || 'Anonymous',
      authorAvatarUrl: currentUser.avatarUrl || 'https://placehold.co/100x100.png',
      content: newComment,
      timestamp: new Date().toISOString(),
      postId: post.id,
    };
    setComments(prevComments => [...prevComments, mockComment]);
    setCommentsCount(prev => prev + 1);
    setNewComment("");
    console.log("New comment submitted (mock):", mockComment);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center space-x-3">
          <Link href={`/${post.authorUsername}`}>
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} data-ai-hint="user avatar" />
              <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/${post.authorUsername}`}>
              <CardTitle className="text-base font-semibold hover:underline">{post.authorName}</CardTitle>
            </Link>
            <p className="text-xs text-muted-foreground">@{post.authorUsername} &middot; {timestamp}</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        {post.content && <p className="text-sm whitespace-pre-wrap mb-3">{post.content}</p>}
        {post.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden border aspect-video relative">
            <Image
              src={post.imageUrl}
              alt="Post image"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              className="object-cover w-full h-full"
              data-ai-hint="social media content"
            />
          </div>
        )}
         {post.voiceNoteUrl && (
          <div className="mt-3 p-3 bg-muted rounded-lg flex items-center space-x-3">
            <Mic className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Voice Post</span>
            {/* Basic audio player - can be enhanced later */}
            <audio controls src={post.voiceNoteUrl} className="w-full h-10">
                Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col items-start">
        <div className="flex justify-between w-full mb-2 text-xs text-muted-foreground">
            <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
            <span>{commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}</span>
        </div>
        <Separator />
        <div className="flex justify-around w-full pt-2">
          <Button variant="ghost" className="flex-1" onClick={handleLike}>
            <Heart className={`mr-2 h-5 w-5 ${isLiked ? 'fill-primary text-primary' : ''}`} /> Like
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
            {currentUser && (
              <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2 mb-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name || ''} data-ai-hint="user avatar comment" />
                  <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
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
            )}
            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="flex items-start space-x-2">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={comment.authorAvatarUrl} alt={comment.authorName} data-ai-hint="user avatar" />
                       <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
                    </Avatar>
                    <div className="bg-secondary/50 dark:bg-secondary/30 p-2 rounded-lg flex-1">
                      <div className="flex items-center justify-between">
                         <Link href={`/${comment.authorUsername}`} className="text-xs font-semibold hover:underline">{comment.authorName}</Link>
                         <span className="text-xs text-muted-foreground">
                            {comment.timestamp ? formatDistanceToNowStrict(new Date(comment.timestamp), { addSuffix: true }) : 'just now'}
                          </span>
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
