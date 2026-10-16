"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PostCard } from "@/components/post-card";
import { StoriesCarousel } from "@/components/stories-carousel";
import { VoiceRecorder } from "@/components/voice-recorder";
import { Button } from "@/components/ui/button";
import { PlusCircle, Image as ImageIcon, Mic, Loader2, X, Sparkles, TrendingUp, Users, Play, Pause, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/app-settings-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { createPost, getGlobalPosts } from "@/lib/firebase/posts";
import { getSuggestedUsers } from "@/lib/firebase/users";
import { uploadFile } from "@/lib/firebase/storage";
import type { Post as PostType, User } from "@/types";
import type { DocumentSnapshot } from "firebase/firestore";
import Link from "next/link";

export default function NewsFeedPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { language, t } = useAppSettings();

  const [postContent, setPostContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);
  const [isPlayingVoicePreview, setIsPlayingVoicePreview] = useState(false);
  const voiceAudioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name?: string) => {
    if (!name) return "DC";
    const names = name.split(" ");
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0]?.[0] || "").toUpperCase() + (names[names.length - 1]?.[0] || "").toUpperCase();
  };

  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const result = await getGlobalPosts(10);
      setPosts(result.posts);
      setLastVisibleDoc(result.lastVisibleDoc);
      setHasMorePosts(result.hasMore);
    } catch (error) {
      console.error("[NewsFeedPage] Error fetching posts:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load posts." });
    } finally {
      setIsLoadingPosts(false);
    }
  }, [toast]);

  const handleLoadMore = async () => {
    if (!lastVisibleDoc || isLoadingMore || !hasMorePosts) return;
    setIsLoadingMore(true);
    try {
      const result = await getGlobalPosts(10, lastVisibleDoc);
      setPosts((prev) => [...prev, ...result.posts]);
      setLastVisibleDoc(result.lastVisibleDoc);
      setHasMorePosts(result.hasMore);
    } catch (error) {
      console.error("[NewsFeedPage] Error loading more posts:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load more posts." });
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchPosts();
      getSuggestedUsers(5, currentUser?.uid).then(setSuggestedUsers).catch(() => {});
    }
  }, [authLoading, fetchPosts, currentUser?.uid]);

  useEffect(() => {
    const onPullRefresh = () => {
      fetchPosts();
    };
    window.addEventListener("zaure-pull-refresh", onPullRefresh);
    return () => window.removeEventListener("zaure-pull-refresh", onPullRefresh);
  }, [fetchPosts]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFiles = Array.from(event.target.files);
      const combined = [...imageFiles, ...selectedFiles].slice(0, 6);
      setImageFiles(combined);
      setImagePreviews(combined.map((file) => URL.createObjectURL(file)));
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newFiles = imageFiles.filter((_, idx) => idx !== indexToRemove);
    const newPreviews = imagePreviews.filter((_, idx) => idx !== indexToRemove);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    if (newFiles.length === 0 && imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const clearAllImages = () => {
    setImageFiles([]);
    setImagePreviews([]);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeVoice = () => {
    if (voiceAudioUrl) {
      URL.revokeObjectURL(voiceAudioUrl);
    }
    setVoiceBlob(null);
    setVoiceAudioUrl(null);
    setIsPlayingVoicePreview(false);
  };

  const handleVoiceRecorded = (blob: Blob, duration: number) => {
    if (voiceAudioUrl) {
      URL.revokeObjectURL(voiceAudioUrl);
    }
    const audioUrl = URL.createObjectURL(blob);
    setVoiceBlob(blob);
    setVoiceAudioUrl(audioUrl);
    setIsRecordingVoice(false);
    toast({
      title: language === "ha" ? "Murya ta Shirya" : "Voice Note Attached",
      description: language === "ha" ? "Zaka iya saurara kafin ka tura." : "You can listen before sharing.",
    });
  };

  const toggleVoicePreviewPlayback = () => {
    if (!voiceAudioPreviewRef.current) return;
    if (isPlayingVoicePreview) {
      voiceAudioPreviewRef.current.pause();
      setIsPlayingVoicePreview(false);
    } else {
      voiceAudioPreviewRef.current.play();
      setIsPlayingVoicePreview(true);
    }
  };

  const handlePostSubmit = async () => {
    if (!postContent.trim() && imageFiles.length === 0 && !voiceBlob) {
      toast({
        variant: "destructive",
        title: "Empty post",
        description: "Please write something, record a voice note, or add photos.",
      });
      return;
    }

    if (!currentUser || !currentUser.uid || !currentUser.username || !currentUser.name) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Please log in to share on Zaure Connect.",
      });
      return;
    }

    setIsPosting(true);
    let imageUrls: string[] = [];
    let voiceNoteUrl: string | undefined = undefined;

    try {
      if (imageFiles.length > 0) {
        imageUrls = await Promise.all(
          imageFiles.map((file) => uploadFile(file, `postImages/${currentUser.uid}`))
        );
      }

      if (voiceBlob) {
        const audioFile = new File([voiceBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        voiceNoteUrl = await uploadFile(audioFile, `voiceNotes/${currentUser.uid}`);
      }

      await createPost({
        content: postContent,
        authorUid: currentUser.uid,
        authorUsername: currentUser.username,
        authorName: currentUser.name,
        authorAvatarUrl: currentUser.avatarUrl || "https://placehold.co/100x100.png",
        imageUrl: imageUrls[0] || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        voiceNoteUrl,
      });

      toast({
        title: "Post Published!",
        description: "Your post is now live on Zaure Connect.",
      });
      setPostContent("");
      clearAllImages();
      removeVoice();
      fetchPosts();
    } catch (error: any) {
      console.error("[NewsFeedPage] Error creating post:", error);
      toast({
        variant: "destructive",
        title: "Post Failed",
        description: error.message || "Could not publish post. Please try again.",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostUpdateInList = (updatedPost: PostType & { _deleted?: boolean }) => {
    if (updatedPost._deleted) {
      setPosts((prevPosts) => prevPosts.filter((p) => p.id !== updatedPost.id));
    } else {
      setPosts((prevPosts) => prevPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-12 px-4 text-center flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-3 sm:py-6 px-2 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
        {/* Left Side: Community Trends & Gist Shortcuts (Desktop) */}
        <div className="hidden lg:block lg:col-span-3 space-y-5 sticky top-20">
          <Card className="rounded-3xl border border-border/80 shadow-xs bg-card p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              {language === "ha" ? "Abubuwan Da Ke Yawo" : "Trending Across Africa"}
            </h4>
            <div className="space-y-2.5">
              {(language === "ha"
                ? [
                    { tag: "#ArewaTech", count: "14.2k posts" },
                    { tag: "#KasuwarKwari", count: "8.5k posts" },
                    { tag: "#HausaCinema", count: "19.8k posts" },
                    { tag: "#ZaureMoments", count: "6.1k posts" },
                    { tag: "#AfricanHeritage", count: "25.3k posts" },
                  ]
                : [
                    { tag: "#AfricaTech", count: "14.2k posts" },
                    { tag: "#ZaureMarketplace", count: "8.5k posts" },
                    { tag: "#AfricanCinema", count: "19.8k posts" },
                    { tag: "#ZaureMoments", count: "6.1k posts" },
                    { tag: "#AfricanHeritage", count: "25.3k posts" },
                  ]
              ).map((item) => (
                <Link
                  key={item.tag}
                  href={`/search?q=${encodeURIComponent(item.tag)}`}
                  className="block p-2 rounded-xl hover:bg-muted/70 transition-colors"
                >
                  <p className="text-xs font-bold text-foreground hover:text-primary">{item.tag}</p>
                  <span className="text-[11px] text-muted-foreground font-medium">{item.count}</span>
                </Link>
              ))}
            </div>
          </Card>

          {/* Zaure Marketplace Quick Card */}
          <Card className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-amber-500/10 to-transparent p-5 shadow-xs">
            <Sparkles className="w-6 h-6 text-primary mb-2" />
            <h4 className="text-sm font-bold text-foreground mb-1">
              {language === "ha" ? "Bude Kasuwancin Ka" : "Trade on Zaure Marketplace"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Sell traditional attire, agricultural harvests, phones, and services with 0 middleman fees.
            </p>
            <Button asChild size="sm" className="w-full rounded-xl font-bold bg-primary text-primary-foreground shadow">
              <Link href="/kasuwa">{t("kasuwa")}</Link>
            </Button>
          </Card>
        </div>

        {/* Center: Main Stories & Feed */}
        <div className="lg:col-span-6 space-y-6">
          {/* Stories Carousel (24h Moments) */}
          <StoriesCarousel />

          {/* Create Post Card */}
          {currentUser && (
            <Card className="shadow-md rounded-3xl border border-border/80 bg-card overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 border border-primary/30">
                    <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name || currentUser.username} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {getInitials(currentUser.name || currentUser.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {currentUser.name || currentUser.username}
                    </CardTitle>
                    <span className="text-[11px] text-muted-foreground">
                      {language === "ha" ? "Raba labari tare da al'umma" : "Share with African community"}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2">
                <Textarea
                  placeholder={t("postPlaceholder")}
                  className="mb-3 min-h-[90px] border-border/70 rounded-2xl text-sm focus:ring-primary leading-relaxed resize-none"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  disabled={isPosting}
                />

                {/* Multi-image preview grid */}
                {imagePreviews.length > 0 && (
                  <div className={`mb-3 grid gap-2 ${
                    imagePreviews.length === 1
                      ? "grid-cols-1"
                      : imagePreviews.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-2 sm:grid-cols-3"
                  }`}>
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative rounded-2xl overflow-hidden border border-border/60 aspect-video sm:aspect-square bg-muted/30 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full shadow-md"
                          onClick={() => removeImage(idx)}
                          disabled={isPosting}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <span className="absolute bottom-1 left-2 text-[10px] bg-black/60 text-white font-medium px-1.5 py-0.5 rounded-full">
                          {idx + 1}/{imagePreviews.length}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Voice note indicator or recorder */}
                {isRecordingVoice ? (
                  <div className="mb-3">
                    <VoiceRecorder
                      onAudioRecorded={handleVoiceRecorded}
                      onCancel={() => setIsRecordingVoice(false)}
                      disabled={isPosting}
                    />
                  </div>
                ) : voiceBlob && voiceAudioUrl ? (
                  <div className="mb-3 p-3 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={toggleVoicePreviewPlayback}
                      >
                        {isPlayingVoicePreview ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                      </Button>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-primary" />
                          {language === "ha" ? "Murya ta Shirya (Voice Note)" : "Voice Note Attached"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {language === "ha" ? "Danna domin saurara" : "Click to preview audio"}
                        </span>
                      </div>
                      <audio
                        ref={voiceAudioPreviewRef}
                        src={voiceAudioUrl}
                        onEnded={() => setIsPlayingVoicePreview(false)}
                        className="hidden"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={removeVoice}
                      className="text-xs text-destructive hover:bg-destructive/10 rounded-xl h-8 px-2.5"
                    >
                      {language === "ha" ? "Share" : "Remove"}
                    </Button>
                  </div>
                ) : null}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={imageInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isPosting}
                />

                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <div className="flex space-x-1 sm:space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2.5 rounded-xl text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isPosting || imageFiles.length >= 6}
                    >
                      <ImageIcon className="h-4 w-4 mr-1.5 text-primary" />
                      <span>{t("photoVideo")}{imageFiles.length > 0 ? ` (${imageFiles.length})` : ""}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2.5 rounded-xl text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground"
                      onClick={() => setIsRecordingVoice(true)}
                      disabled={isPosting || isRecordingVoice}
                    >
                      <Mic className="h-4 w-4 mr-1.5 text-amber-500" />
                      <span>{t("voiceNote")}</span>
                    </Button>
                  </div>

                  <Button
                    onClick={handlePostSubmit}
                    disabled={isPosting || (!postContent.trim() && imageFiles.length === 0 && !voiceBlob) || !currentUser}
                    className="rounded-xl px-5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow"
                  >
                    {isPosting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    {isPosting ? t("posting") : t("postButton")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts Feed */}
          {isLoadingPosts ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onPostUpdate={handlePostUpdateInList} />
              ))}

              {/* Load More Pagination */}
              {hasMorePosts && (
                <div className="flex justify-center pt-4 pb-2">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="rounded-2xl px-6 py-5 border-primary/30 font-bold hover:bg-primary/10 gap-2 shadow-xs transition-all"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>{language === "ha" ? "Ana lodawa..." : "Loading more posts..."}</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 text-primary" />
                        <span>{language === "ha" ? "Kara Wasu Sakonni (Load More)" : "Load More Posts"}</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border p-8">
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-2 opacity-80" />
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">{t("noPostsYet")}</p>
            </div>
          )}
        </div>

        {/* Right Side: Suggested African People & Community Spaces (Desktop) */}
        <div className="hidden lg:block lg:col-span-3 space-y-5 sticky top-20">
          <Card className="rounded-3xl border border-border/80 shadow-xs bg-card p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
              <Users className="w-4 h-4 text-secondary" />
              {language === "ha" ? "Mutane Masu Ban Sha'awa" : "Suggested Friends"}
            </h4>

            <div className="space-y-3">
              {suggestedUsers.length > 0 ? (
                suggestedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="w-9 h-9 border border-border">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link href={`/${user.username}`} className="text-xs font-bold text-foreground truncate hover:underline block">
                          {user.name}
                        </Link>
                        <p className="text-[10px] text-muted-foreground truncate">@{user.username}</p>
                      </div>
                    </div>
                    <Button size="sm" asChild variant="outline" className="h-7 px-2.5 text-xs rounded-xl font-bold">
                      <Link href={`/${user.username}`}>View</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">
                  No new users yet. Share Zaure Connect link with friends!
                </p>
              )}
            </div>
          </Card>

          {/* Regional Community Culture Footer */}
          <div className="text-center px-2 text-[11px] text-muted-foreground leading-relaxed">
            &copy; {new Date().getFullYear()} Zaure Connect Africa.
            <br />
            {language === "ha"
              ? "Hausa · English · Kasuwa · Al'umma"
              : "Community · Marketplace · Culture"}
          </div>
        </div>
      </div>
    </div>
  );
}
