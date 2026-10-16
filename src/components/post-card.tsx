"use client"

import type { Post, Comment as CommentType, CulturalReactionType } from "@/types"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Heart, Share2, Send, MoreHorizontal, Mic, Loader2, Sparkles, Volume2, Pencil, Trash2, Maximize2 } from "lucide-react"
import { formatDistanceToNowStrict } from 'date-fns'
import { useState, useEffect, useCallback, useRef } from "react"
import { Textarea } from "@/components/ui/textarea" 
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context" 
import { useAppSettings } from "@/contexts/app-settings-context"
import { toggleLikePost, addCommentToPost, getPostComments, setCulturalReaction, updatePostContent, deletePost } from "@/lib/firebase/posts"
import { uploadFile } from "@/lib/firebase/storage"
import { VoiceRecorder } from "@/components/voice-recorder"
import { useToast } from "@/hooks/use-toast"
import { CulturalReactionsPicker, CULTURAL_REACTIONS } from "@/components/cultural-reactions-picker"
import { ReportDialog } from "@/components/report-dialog"
import { ImageLightbox } from "@/components/ui/image-lightbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ShieldAlert, Flag, Play, Pause, X } from "lucide-react"

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editContentText, setEditContentText] = useState(post.content || "");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Voice note comment state
  const [isRecordingCommentVoice, setIsRecordingCommentVoice] = useState(false);
  const [commentVoiceBlob, setCommentVoiceBlob] = useState<Blob | null>(null);
  const [activeCommentAudioId, setActiveCommentAudioId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isAuthor = currentUser?.uid === post.authorUid;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const allImages = post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : post.imageUrl ? [post.imageUrl] : [];

  const currentUserReaction = currentUser ? (post.reactions?.[currentUser.uid] || null) : null;
  const isLikedByCurrentUser = !!currentUserReaction || (currentUser ? post.likedBy?.includes(currentUser.uid) : false);

  const handleSaveEdit = async () => {
    if (!editContentText.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await updatePostContent(post.id, editContentText.trim());
      const updated = { ...post, content: editContentText.trim(), isEdited: true };
      setPost(updated);
      if (onPostUpdate) onPostUpdate(updated);
      setIsEditDialogOpen(false);
      toast({ title: "Post updated", description: "Your post has been successfully edited." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error editing post", description: err.message });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deletePost(post.id);
      toast({ title: "Post deleted", description: "Your post was removed." });
      // Notify parent to remove post from list
      if (onPostUpdate) {
        onPostUpdate({ ...post, _deleted: true } as any);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error deleting post", description: err.message });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

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
    if ((!newComment.trim() && !commentVoiceBlob) || !currentUser || isCommenting) return;

    setIsCommenting(true);
    try {
      let voiceNoteUrl: string | undefined = undefined;
      if (commentVoiceBlob) {
        const audioFile = new File([commentVoiceBlob], `comment_voice_${Date.now()}.webm`, { type: "audio/webm" });
        voiceNoteUrl = await uploadFile(audioFile, `commentVoiceNotes/${currentUser.uid}`);
      }

      const commentData = {
        authorUid: currentUser.uid,
        authorUsername: currentUser.username || 'anonymous',
        authorName: currentUser.name || 'Anonymous',
        authorAvatarUrl: currentUser.avatarUrl || 'https://placehold.co/100x100.png',
        content: newComment.trim() || (voiceNoteUrl ? "🎙️ Sakon Murya (Voice Note)" : ""),
        voiceNoteUrl,
      };
      const addedComment = await addCommentToPost(post.id, commentData);
      setFetchedComments(prevComments => [addedComment, ...prevComments]);
      const updatedPost = { ...post, commentsCount: (post.commentsCount || 0) + 1 };
      setPost(updatedPost);
      if (onPostUpdate) onPostUpdate(updatedPost);
      setNewComment("");
      setCommentVoiceBlob(null);
      setIsRecordingCommentVoice(false);
      toast({ title: "An aike da sharhi (Comment posted)!" });
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
            <DropdownMenuContent align="end" className="rounded-2xl p-1.5 w-44 shadow-lg border border-border">
              {isAuthor && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditContentText(post.content || "");
                      setIsEditDialogOpen(true);
                    }}
                    className="font-semibold cursor-pointer gap-2 rounded-xl text-xs hover:bg-muted"
                  >
                    <Pencil className="w-4 h-4 text-primary" />
                    Gyara (Edit Post)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive font-semibold cursor-pointer gap-2 rounded-xl text-xs hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    Goge (Delete Post)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => setIsReportOpen(true)}
                className="text-muted-foreground font-semibold cursor-pointer gap-2 rounded-xl text-xs hover:text-destructive"
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
                  Muryar Zaure (Voice Note)
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
              preload="metadata"
              onEnded={() => setIsPlayingAudio(false)}
              className="hidden"
            />
          </div>
        )}

        {/* Image Post(s) with Multi-photo grid and Lightbox support */}
        {allImages.length > 0 && (
          <div className="mt-2.5 rounded-2xl overflow-hidden border border-border/60 relative group bg-muted/30">
            {allImages.length === 1 ? (
              <div
                onClick={() => {
                  setLightboxIndex(0);
                  setLightboxOpen(true);
                }}
                className="relative w-full aspect-[4/3] sm:aspect-video max-h-[480px] cursor-pointer overflow-hidden group/img"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={allImages[0]}
                  alt="Post content"
                  loading="lazy"
                  decoding="async"
                  className="object-cover w-full h-full group-hover/img:scale-[1.02] transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/600x400/png?text=Zaure+Photo";
                  }}
                />
                <div className="absolute bottom-2.5 right-2.5 p-2 rounded-full bg-black/60 text-white opacity-80 sm:opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-sm">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
            ) : allImages.length === 2 ? (
              <div className="grid grid-cols-2 gap-1.5 aspect-[4/3] sm:aspect-[16/9]">
                {allImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setLightboxIndex(idx);
                      setLightboxOpen(true);
                    }}
                    className="relative w-full h-full cursor-pointer overflow-hidden group/img bg-black/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Post photo ${idx + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            ) : allImages.length === 3 ? (
              <div className="grid grid-cols-2 gap-1.5 aspect-[4/3] sm:aspect-[16/9]">
                <div
                  onClick={() => {
                    setLightboxIndex(0);
                    setLightboxOpen(true);
                  }}
                  className="relative w-full h-full cursor-pointer overflow-hidden group/img row-span-2 bg-black/5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={allImages[0]}
                    alt="Post photo 1"
                    loading="lazy"
                    decoding="async"
                    className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-300"
                  />
                </div>
                {allImages.slice(1, 3).map((img, idx) => (
                  <div
                    key={idx + 1}
                    onClick={() => {
                      setLightboxIndex(idx + 1);
                      setLightboxOpen(true);
                    }}
                    className="relative w-full h-full cursor-pointer overflow-hidden group/img bg-black/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Post photo ${idx + 2}`}
                      loading="lazy"
                      decoding="async"
                      className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 aspect-[4/3] sm:aspect-[16/9]">
                {allImages.slice(0, 4).map((img, idx) => {
                  const isFourth = idx === 3;
                  const remainingCount = allImages.length - 4;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setLightboxIndex(idx);
                        setLightboxOpen(true);
                      }}
                      className="relative w-full h-full cursor-pointer overflow-hidden group/img bg-black/5"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`Post photo ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-300"
                      />
                      {isFourth && remainingCount > 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl sm:text-2xl backdrop-blur-sm">
                          +{remainingCount}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
                  title: `${post.authorName} on Zaure Connect`,
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
              <div className="mb-4 space-y-2">
                {isRecordingCommentVoice ? (
                  <VoiceRecorder
                    onAudioRecorded={(blob) => {
                      setCommentVoiceBlob(blob);
                      setIsRecordingCommentVoice(false);
                      toast({ title: "Sakon Murya ya Shirya", description: "Zaka iya aikawa yanzu." });
                    }}
                    onCancel={() => setIsRecordingCommentVoice(false)}
                    disabled={isCommenting}
                  />
                ) : commentVoiceBlob ? (
                  <div className="p-2.5 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5" /> Sakon murya yana nan (Voice attached)
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-xs text-destructive h-7 px-2"
                      onClick={() => setCommentVoiceBlob(null)}
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Share
                    </Button>
                  </div>
                ) : null}

                <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2">
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
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsRecordingCommentVoice(true)}
                    className="rounded-xl h-10 w-10 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                    disabled={isCommenting || isRecordingCommentVoice}
                    title="Sharhin Murya (Voice Comment)"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-xl h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow"
                    disabled={(!newComment.trim() && !commentVoiceBlob) || isCommenting}
                  >
                    {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
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
                      {comment.content && <p className="text-sm leading-relaxed mb-1.5">{comment.content}</p>}
                      {comment.voiceNoteUrl && (
                        <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-background/80 border border-border/60">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full bg-primary/10 text-primary"
                            onClick={() => {
                              const audioElem = document.getElementById(`audio-comment-${comment.id}`) as HTMLAudioElement;
                              if (!audioElem) return;
                              if (activeCommentAudioId === comment.id) {
                                audioElem.pause();
                                setActiveCommentAudioId(null);
                              } else {
                                audioElem.play();
                                setActiveCommentAudioId(comment.id);
                              }
                            }}
                          >
                            {activeCommentAudioId === comment.id ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                          </Button>
                          <span className="text-xs font-semibold text-foreground">
                            {language === "ha" ? "Saurari Sharhin Murya" : "Listen to Voice Comment"}
                          </span>
                          <audio
                            id={`audio-comment-${comment.id}`}
                            src={comment.voiceNoteUrl}
                            onEnded={() => setActiveCommentAudioId(null)}
                            className="hidden"
                          />
                        </div>
                      )}
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

      {/* Edit Post Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" />
              Gyara Sakon Ka (Edit Post)
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              value={editContentText}
              onChange={(e) => setEditContentText(e.target.value)}
              placeholder="Sabunta sakonka..."
              rows={4}
              className="rounded-2xl resize-none text-sm leading-relaxed border-border/80"
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSavingEdit}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="rounded-xl bg-primary text-primary-foreground font-bold"
              onClick={handleSaveEdit}
              disabled={!editContentText.trim() || isSavingEdit}
            >
              {isSavingEdit && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              Adana (Save Changes)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Post Confirmation Modal */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-3xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Goge wannan sakon? (Delete Post)
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Shin ka tabbata kana son goge wannan sakon daga Zaure Connect? Ba za a iya dawo da shi ba idan an goge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 mt-2">
            <AlertDialogCancel className="rounded-xl" disabled={isDeleting}>
              A'a (Cancel)
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeletePost();
              }}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              I, Goge Shi (Yes, Delete)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Full-screen Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        images={allImages}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        title={post.authorName ? `${post.authorName}'s photos` : undefined}
      />
    </Card>
  )
}
