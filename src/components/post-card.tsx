"use client"

import type { Post, Comment as CommentType, CulturalReactionType } from "@/types"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Heart, Share2, Send, MoreHorizontal, Mic, Loader2, Sparkles, Volume2 } from "lucide-react"
import { formatDistanceToNowStrict } from 'date-fns'
import { useState, useEffect, useCallback, useRef } from "react"
import { Textarea } from "@/components/ui/textarea" 
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context" 
import { useAppSettings } from "@/contexts/app-settings-context"
import { toggleLikePost, addCommentToPost, getPostComments, setCulturalReaction } from "@/lib/firebase/posts"
import { useToast } from "@/hooks/use-toast"
import { CulturalReactionsPicker, CULTURAL_REACTIONS } from "@/components/cultural-reactions-picker"
import { ReportDialog } from "@/components/report-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ShieldAlert, Flag } from "lucide-react"

interface PostCardProps {
  post: Post;
  onPostUpdate?: (updatedPost: Post) => void;
}

export function PostCard({ post: initialPost, onPostUpdate }: PostCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { language, dataSaver, t } = useAppSettings();

  const [post, setPost] = useState<Post>(initialPost);
  const [timestamp, setTimestamp] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [fetchedComments, setFetchedComments] = useState<CommentType[]>([]);
  const [showReactionsPicker, setShowReactionsPicker] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentUserReaction = currentUser ? (post.reactions?.[currentUser.uid] || null) : null;
  const isLikedByCurrentUser = !!currentUserReaction || (currentUser ? post.likedBy?.includes(currentUser.uid) : false);

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);
  
  useEffect(() => {
    if (post.timestamp) {
      try {
        const date = new Date(post.timestamp);
        if (!isNaN(date.getTime())) {
          setTimestamp(formatDistanceToNowStrict(date, { addSuffix: true }));
        } else {
          setTimestamp("just now");
        }
      } catch (e) {
        setTimestamp("just now"); 
      }
    } else {
      setTimestamp("just now");
    }
  }, [post.timestamp]);

  const getInitials = (name?: string) => {
    if (!name) return "DC";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] || '').toUpperCase() + (names[names.length - 1][0] || '').toUpperCase();
  };

  const handleSelectReaction = async (reactionType: CulturalReactionType) => {
    if (!currentUser || isLiking) return;
    setShowReactionsPicker(false);
    setIsLiking(true);

    try {
      const res = await setCulturalReaction(post.id, currentUser.uid, reactionType);
      const updatedPost: Post = {
        ...post,
        likesCount: res.likesCount,
        reactions: {
          ...(post.reactions || {}),
          [currentUser.uid]: res.currentUserReaction ? (res.currentUserReaction as CulturalReactionType) : (undefined as any),
        },
        reactionsCount: res.reactionsCount,
      };
      setPost(updatedPost);
      if (onPostUpdate) onPostUpdate(updatedPost);
    } catch (error) {
      console.error("Failed to set reaction:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not set reaction." });
    } finally {
      setIsLiking(false);
    }
  };

  const handleDefaultLikeClick = async () => {
    if (currentUserReaction) {
      // Toggle off current reaction
      await handleSelectReaction(currentUserReaction);
    } else {
      // Default to "Kauna" (Love)
      await handleSelectReaction("kauna");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || isCommenting) return;

    setIsCommenting(true);
    try {
      const commentData = {
        authorUid: currentUser.uid,
        authorUsername: currentUser.username || 'anonymous',
        authorName: currentUser.name || 'Anonymous',
        authorAvatarUrl: currentUser.avatarUrl || 'https://placehold.co/100x100.png',
        content: newComment,
      };
      const addedComment = await addCommentToPost(post.id, commentData);
      setFetchedComments(prevComments => [addedComment, ...prevComments]);
      const updatedPost = { ...post, commentsCount: (post.commentsCount || 0) + 1 };
      setPost(updatedPost);
      if (onPostUpdate) onPostUpdate(updatedPost);
      setNewComment("");
      toast({ title: "Comment posted!" });
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not post comment." });
    } finally {
      setIsCommenting(false);
    }
  };

  const fetchComments = useCallback(async () => {
    if (!post.id) return;
    setIsLoadingComments(true);
    try {
      const commentsData = await getPostComments(post.id);
      setFetchedComments(commentsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load comments." });
    } finally {
      setIsLoadingComments(false);
    }
  }, [post.id, toast]);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, fetchComments]);

  const activeReactionMeta = CULTURAL_REACTIONS.find(r => r.type === currentUserReaction);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md hover:shadow-xl rounded-2xl overflow-hidden border border-border/80 transition-all duration-300 bg-card">
      {/* Header */}
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/${post.authorUsername}`}>
              <div className="relative">
                <Avatar className="h-11 w-11 border-2 border-primary/40 ring-2 ring-primary/10">
                  <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getInitials(post.authorName)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Link href={`/${post.authorUsername}`}>
                  <CardTitle className="text-sm sm:text-base font-bold hover:underline tracking-tight">
                    {post.authorName}
                  </CardTitle>
                </Link>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                  Hausa
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                @{post.authorUsername} &middot; {timestamp}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-1.5 w-44">
              <DropdownMenuItem
                onClick={() => setIsReportOpen(true)}
                className="text-destructive font-semibold cursor-pointer gap-2 rounded-xl text-xs"
              >
                <ShieldAlert className="w-4 h-4" />
                Report Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="px-4 pb-3 pt-0">
        {post.content && (
          <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap mb-3 text-foreground/90 font-normal">
            {post.content}
          </p>
        )}

        {/* Voice Note Player */}
        {post.voiceNoteUrl && (
          <div className="my-3 p-3.5 bg-gradient-to-r from-primary/10 via-amber-500/10 to-transparent border border-primary/25 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="icon"
                onClick={toggleAudio}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-md hover:scale-105 transition-transform"
              >
                {isPlayingAudio ? (
                  <span className="w-3.5 h-3.5 bg-white rounded-xs" />
                ) : (
                  <Volume2 className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Muryar Dandali (Voice Note)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Tap to listen to oral audio post
                </span>
              </div>
            </div>

            {/* Visualizer bars */}
            <div className="flex items-center gap-1 h-6">
              {[30, 80, 45, 100, 60, 90, 40, 75, 50, 95, 30, 80].map((bar, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isPlayingAudio ? "bg-primary animate-pulse" : "bg-muted-foreground/40"
                  }`}
                  style={{ height: `${bar}%` }}
                />
              ))}
            </div>

            <audio
              ref={audioRef}
              src={post.voiceNoteUrl}
              onEnded={() => setIsPlayingAudio(false)}
              className="hidden"
            />
          </div>
        )}

        {/* Image Post with Data-Saver support */}
        {post.imageUrl && (
          <div className="mt-2 rounded-2xl overflow-hidden border border-border/60 aspect-video relative group bg-muted/40">
            {dataSaver ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-muted/70 text-center">
                <Sparkles className="w-8 h-8 text-secondary mb-1" />
                <p className="text-xs font-semibold text-foreground">Data Saver Mode Active</p>
                <p className="text-[11px] text-muted-foreground mb-2">Image compressed for fast low-bandwidth loading</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageUrl}
                  alt="Post"
                  loading="lazy"
                  className="max-h-36 rounded-lg object-contain shadow"
                />
              </div>
            ) : (
              <Image
                src={post.imageUrl}
                alt="Post content"
                fill
                sizes="(max-width: 768px) 100vw, 650px"
                className="object-cover w-full h-full group-hover:scale-[1.01] transition-transform duration-500"
                data-ai-hint="social media content"
              />
            )}
          </div>
        )}
      </CardContent>

      {/* Footer & Reactions */}
      <CardFooter className="p-4 pt-1 flex flex-col items-start">
        {/* Reaction summary */}
        <div className="flex justify-between w-full mb-2.5 text-xs text-muted-foreground px-1 font-medium">
          <div className="flex items-center gap-1.5">
            {/* Show icons of top reactions */}
            <span className="flex -space-x-1 items-center">
              <span className="text-sm">❤️</span>
              <span className="text-sm">🔥</span>
              <span className="text-sm">👏</span>
            </span>
            <span>
              {post.likesCount || 0} {language === "ha" ? "Al'umma sun so" : "reactions"}
            </span>
          </div>
          <span>
            {post.commentsCount || 0} {post.commentsCount === 1 ? t("comment") : `${t("comment")}s`}
          </span>
        </div>

        <Separator className="opacity-60" />

        {/* Action Buttons Bar */}
        <div className="relative flex justify-around w-full pt-2 gap-1">
          {/* Reaction picker popover */}
          {showReactionsPicker && (
            <CulturalReactionsPicker
              currentReaction={currentUserReaction}
              onSelectReaction={handleSelectReaction}
              lang={language}
            />
          )}

          {/* Culturally Rich Reaction Button */}
          <div
            className="flex-1 relative"
            onMouseEnter={() => setShowReactionsPicker(true)}
            onMouseLeave={() => setShowReactionsPicker(false)}
          >
            <Button
              variant="ghost"
              className={`w-full rounded-xl font-semibold gap-1.5 text-xs sm:text-sm ${
                isLikedByCurrentUser
                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={handleDefaultLikeClick}
              disabled={isLiking || !currentUser}
            >
              {isLiking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : activeReactionMeta ? (
                <span className="text-base sm:text-lg">{activeReactionMeta.emoji}</span>
              ) : (
                <Heart className={`h-4 w-4 ${isLikedByCurrentUser ? "fill-primary" : ""}`} />
              )}
              <span>
                {activeReactionMeta
                  ? (language === "ha" ? activeReactionMeta.hausaLabel : activeReactionMeta.hausaLabel)
                  : t("like")}
              </span>
            </Button>
          </div>

          <Button
            variant="ghost"
            className="flex-1 rounded-xl text-muted-foreground hover:text-foreground font-semibold gap-1.5 text-xs sm:text-sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4" />
            <span>{t("comment")}</span>
          </Button>

          <Button
            variant="ghost"
            className="flex-1 rounded-xl text-muted-foreground hover:text-foreground font-semibold gap-1.5 text-xs sm:text-sm"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${post.authorName} on Dandali Connect`,
                  text: post.content,
                  url: window.location.href,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast({ title: "Link copied to clipboard!" });
              }
            }}
          >
            <Share2 className="h-4 w-4" />
            <span>{t("share")}</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="w-full mt-4 animate-in fade-in duration-200">
            <Separator className="mb-4 opacity-60" />

            {currentUser && (
              <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2 mb-4">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <Textarea
                  placeholder={t("writeComment")}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-grow min-h-[42px] max-h-24 resize-none rounded-xl text-sm"
                  rows={1}
                  disabled={isCommenting}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-xl h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow"
                  disabled={!newComment.trim() || isCommenting}
                >
                  {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            )}

            {isLoadingComments ? (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : fetchedComments.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {fetchedComments.map(comment => (
                  <div key={comment.id} className="flex items-start space-x-2.5">
                    <Avatar className="h-8 w-8 mt-0.5 border">
                      <AvatarImage src={comment.authorAvatarUrl} alt={comment.authorName} />
                      <AvatarFallback className="text-[10px] bg-secondary/20">
                        {getInitials(comment.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted/60 hover:bg-muted/80 transition-colors p-3 rounded-2xl flex-1 border border-border/40">
                      <div className="flex items-center justify-between mb-1">
                        <Link href={`/${comment.authorUsername}`} className="text-xs font-bold hover:underline">
                          {comment.authorName}
                        </Link>
                        <span className="text-[11px] text-muted-foreground">
                          {comment.timestamp ? formatDistanceToNowStrict(new Date(comment.timestamp), { addSuffix: true }) : 'just now'}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Babu sharhi tukuna. Kasance na farko! (No comments yet.)
              </p>
            )}
          </div>
        )}
      </CardFooter>

      {/* Post Reporting Modal */}
      <ReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetId={post.id}
        targetType="post"
        targetTitle={`Post by @${post.authorUsername}: "${post.content?.slice(0, 50) || 'Media post'}..."`}
      />
    </Card>
  )
}
