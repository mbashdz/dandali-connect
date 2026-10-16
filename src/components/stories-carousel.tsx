"use client";

import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/app-settings-context";
import { getActiveStories, createStory } from "@/lib/firebase/stories";
import { uploadFile } from "@/lib/firebase/storage";
import type { Story } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function StoriesCarousel() {
  const { currentUser } = useAuth();
  const { t, language } = useAppSettings();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [newStoryText, setNewStoryText] = useState("");
  const [storyImageFile, setStoryImageFile] = useState<File | null>(null);
  const [storyImagePreview, setStoryImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBg, setSelectedBg] = useState("from-orange-600 to-amber-700");
  const storyImageInputRef = React.useRef<HTMLInputElement | null>(null);

  const colorOptions = [
    "from-orange-600 to-amber-700",
    "from-emerald-700 to-teal-800",
    "from-amber-600 to-red-600",
    "from-indigo-800 to-purple-900",
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setStoryImageFile(file);
      setStoryImagePreview(URL.createObjectURL(file));
    }
  };

  const removeStoryImage = () => {
    setStoryImageFile(null);
    setStoryImagePreview(null);
    if (storyImageInputRef.current) {
      storyImageInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true);
      try {
        const liveStories = await getActiveStories();
        setStories(liveStories);
      } catch (err) {
        console.error("Failed to load stories:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStories();
  }, []);

  const handleCreateStory = async () => {
    if ((!newStoryText.trim() && !storyImageFile) || !currentUser || isSubmitting) return;
    setIsSubmitting(true);
    try {
      let mediaUrl: string | undefined = undefined;
      if (storyImageFile) {
        mediaUrl = await uploadFile(storyImageFile, `stories/${currentUser.uid}`);
      }

      const storyId = await createStory({
        authorUid: currentUser.uid,
        authorUsername: currentUser.username || "me",
        authorName: currentUser.name || "You",
        authorAvatarUrl: currentUser.avatarUrl || "https://placehold.co/100x100.png",
        text: newStoryText.trim() || undefined,
        mediaUrl,
        bgColor: mediaUrl ? undefined : selectedBg,
        viewed: false,
      });

      const newStory: Story = {
        id: storyId,
        authorUid: currentUser.uid,
        authorUsername: currentUser.username || "me",
        authorName: currentUser.name || "You",
        authorAvatarUrl: currentUser.avatarUrl || "https://placehold.co/100x100.png",
        text: newStoryText.trim() || undefined,
        mediaUrl,
        bgColor: mediaUrl ? undefined : selectedBg,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        viewed: false,
      };

      setStories([newStory, ...stories]);
      setNewStoryText("");
      removeStoryImage();
      setIsCreatingStory(false);
      toast({ title: "Moment Published", description: "Your 24-hour status is now live for followers." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to post moment", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <h3 className="text-sm font-semibold tracking-wide text-foreground/80 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          {t("storiesTitle")}
        </h3>
        <span className="text-xs text-muted-foreground font-medium">24h Status</span>
      </div>

      {/* Stories list */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
        {/* Current user 'Add Story' card */}
        <div
          onClick={() => setIsCreatingStory(true)}
          className="relative flex-shrink-0 w-28 h-44 rounded-2xl overflow-hidden border border-border/80 bg-card cursor-pointer group shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="h-28 w-full bg-gradient-to-br from-primary/15 to-secondary/25 flex items-center justify-center relative">
            <Avatar className="w-12 h-12 border-2 border-background shadow-md">
              <AvatarImage src={currentUser?.avatarUrl} alt="Your profile" />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {currentUser?.name?.[0]?.toUpperCase() || "+"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="absolute top-[96px] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-background group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <div className="absolute bottom-2 inset-x-0 text-center px-1">
            <span className="text-xs font-semibold block truncate">{t("addStory")}</span>
          </div>
        </div>

        {/* Live Stories */}
        {isLoading ? (
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-28 h-44 rounded-2xl bg-muted/60 animate-pulse flex-shrink-0" />
            ))}
          </div>
        ) : stories.length > 0 ? (
          stories.map((story) => (
            <div
              key={story.id}
              onClick={() => {
                setActiveStory(story);
                setStories((prev) =>
                  prev.map((s) => (s.id === story.id ? { ...s, viewed: true } : s))
                );
              }}
              className={`relative flex-shrink-0 w-28 h-44 rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border ${
                story.viewed ? "border-border/60 opacity-90" : "border-primary ring-2 ring-primary/40 ring-offset-1 ring-offset-background"
              }`}
            >
              {story.mediaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={story.mediaUrl}
                  alt={story.authorName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${
                    story.bgColor || "from-amber-700 to-orange-800"
                  } p-2 flex items-center justify-center text-center`}
                >
                  <p className="text-[11px] font-medium text-white line-clamp-4 leading-relaxed">
                    {story.text}
                  </p>
                </div>
              )}

              {/* Backdrop overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {/* Author avatar */}
              <div className="absolute top-2 left-2 z-10">
                <Avatar className="w-8 h-8 border-2 border-primary shadow">
                  <AvatarImage src={story.authorAvatarUrl} alt={story.authorName} />
                  <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground font-bold">
                    {story.authorName?.slice(0, 2).toUpperCase() || "DC"}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Author name bottom */}
              <div className="absolute bottom-2 inset-x-2 z-10">
                <p className="text-[11px] font-semibold text-white drop-shadow-md truncate">
                  {story.authorName}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center px-4 py-8 text-xs text-muted-foreground italic">
            No active moments yet. Share your status above!
          </div>
        )}
      </div>

      {/* Story View Modal */}
      {activeStory && (
        <Dialog open={!!activeStory} onOpenChange={() => setActiveStory(null)}>
          <DialogContent className="max-w-md p-0 overflow-hidden bg-black text-white border-zinc-800 rounded-3xl">
            <div className="relative aspect-[9/16] w-full flex flex-col justify-between p-4">
              {/* Progress bar */}
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-white animate-pulse w-full duration-1000" />
              </div>

              {/* Story Header */}
              <div className="flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                  <Avatar className="w-9 h-9 border border-white">
                    <AvatarImage src={activeStory.authorAvatarUrl} />
                    <AvatarFallback>{activeStory.authorName?.slice(0, 2) || "DC"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-bold text-white">{activeStory.authorName}</h4>
                    <p className="text-[11px] text-zinc-300">@{activeStory.authorUsername} &middot; Moments</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full"
                  onClick={() => setActiveStory(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Story Content Background */}
              {activeStory.mediaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeStory.mediaUrl}
                  alt="Story"
                  className="absolute inset-0 w-full h-full object-cover -z-10"
                />
              ) : (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    activeStory.bgColor || "from-amber-600 to-orange-700"
                  } -z-10 flex items-center justify-center p-8 text-center`}
                >
                  <p className="text-lg font-bold leading-relaxed">{activeStory.text}</p>
                </div>
              )}

              {/* Story Text overlay if image present */}
              {activeStory.mediaUrl && activeStory.text && (
                <div className="bg-black/60 backdrop-blur-md p-3.5 rounded-2xl mb-2 text-sm z-20">
                  {activeStory.text}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Story Dialog */}
      <Dialog open={isCreatingStory} onOpenChange={setIsCreatingStory}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Create a Zaure Moment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Photo preview or background preview */}
            {storyImagePreview ? (
              <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={storyImagePreview}
                  alt="Story preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full shadow"
                  onClick={removeStoryImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-2">
                  Choose Mood Color
                </label>
                <div className="flex gap-2 mb-3">
                  {colorOptions.map((bg) => (
                    <button
                      key={bg}
                      onClick={() => setSelectedBg(bg)}
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${bg} border-2 ${
                        selectedBg === bg ? "border-foreground scale-110" : "border-transparent"
                      } transition-all`}
                    />
                  ))}
                </div>
                <div
                  className={`w-full h-36 rounded-2xl bg-gradient-to-br ${selectedBg} p-4 flex items-center justify-center text-center text-white shadow-inner`}
                >
                  <p className="text-sm font-medium">
                    {newStoryText || "Type your thoughts, greetings, or gist..."}
                  </p>
                </div>
              </div>
            )}

            {/* Photo upload trigger & Text input */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={storyImageInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => storyImageInputRef.current?.click()}
                className="rounded-xl border-dashed border-primary/50 text-xs font-bold gap-1.5 hover:bg-primary/10 hover:text-primary"
              >
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>
                  {storyImagePreview
                    ? language === "ha" ? "Canja Hoto" : "Change Photo"
                    : language === "ha" ? "Sanya Hoto" : "Add Photo"}
                </span>
              </Button>
            </div>

            <textarea
              value={newStoryText}
              onChange={(e) => setNewStoryText(e.target.value)}
              placeholder={language === "ha" ? "Rubuta bayani..." : "Optional caption or story message..."}
              className="w-full h-20 p-3 rounded-xl border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setIsCreatingStory(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateStory}
                disabled={(!newStoryText.trim() && !storyImageFile) || isSubmitting}
                className="rounded-xl font-bold bg-primary text-primary-foreground"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Publish Moment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
