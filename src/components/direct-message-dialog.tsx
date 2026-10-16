"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, MessageSquare, X, Image as ImageIcon, Mic, Play, Pause } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/app-settings-context";
import { sendDirectMessage, subscribeToMessages, getConversationId } from "@/lib/firebase/messages";
import { uploadFile } from "@/lib/firebase/storage";
import { VoiceRecorder } from "@/components/voice-recorder";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { DirectMessage, User } from "@/types";

interface DirectMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientUser: User | null;
}

export function DirectMessageDialog({
  isOpen,
  onClose,
  recipientUser,
}: DirectMessageDialogProps) {
  const { currentUser } = useAuth();
  const { language } = useAppSettings();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen || !currentUser || !recipientUser) {
      setMessages([]);
      return;
    }

    const conversationId = getConversationId(currentUser.uid, recipientUser.uid);
    const unsubscribe = subscribeToMessages(conversationId, (loaded) => {
      setMessages(loaded);
    });

    return () => unsubscribe();
  }, [isOpen, currentUser, recipientUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedImageFile(f);
      setSelectedImagePreview(URL.createObjectURL(f));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessageText.trim() && !selectedImageFile && !voiceBlob) || !recipientUser || !currentUser || isSending) return;

    setIsSending(true);
    try {
      let imageUrl: string | undefined;
      let voiceNoteUrl: string | undefined;

      if (selectedImageFile) {
        imageUrl = await uploadFile(selectedImageFile, `dmImages/${currentUser.uid}`);
      }
      if (voiceBlob) {
        const audioFile = new File([voiceBlob], `dm_voice_${Date.now()}.webm`, { type: "audio/webm" });
        voiceNoteUrl = await uploadFile(audioFile, `dmVoiceNotes/${currentUser.uid}`);
      }

      await sendDirectMessage(recipientUser, newMessageText.trim(), {
        imageUrl,
        voiceNoteUrl,
      });

      setNewMessageText("");
      setSelectedImageFile(null);
      setSelectedImagePreview(null);
      setVoiceBlob(null);
      setIsRecordingVoice(false);
    } catch (err: any) {
      console.error("[DirectMessageDialog] Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (!recipientUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border border-border shadow-2xl bg-card">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-muted/40 border-b border-border/70">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-primary/40">
              <AvatarImage src={recipientUser.avatarUrl} alt={recipientUser.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {recipientUser.name?.slice(0, 2).toUpperCase() || "ZC"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-bold text-foreground leading-tight">
                {recipientUser.name}
              </h3>
              <p className="text-[11px] text-muted-foreground">@{recipientUser.username}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages Body */}
        <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-background via-muted/10 to-background">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
              <MessageSquare className="w-8 h-8 text-primary/40 mb-2" />
              <p className="text-xs font-semibold">
                {language === "ha" ? "Babu sakonni tukuna" : "No messages yet"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {language === "ha"
                  ? `Fara magana ta sirri da ${recipientUser.name}`
                  : `Start a direct conversation with ${recipientUser.name}`}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderUid === currentUser?.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs space-y-1.5 ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-xs font-medium"
                        : "bg-muted text-foreground border border-border/60 rounded-bl-xs"
                    }`}
                  >
                    {msg.imageUrl && (
                      <div
                        className="relative rounded-xl overflow-hidden cursor-zoom-in border border-white/10"
                        onClick={() => setLightboxImage(msg.imageUrl!)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.imageUrl}
                          alt="Message attachment"
                          className="max-h-48 w-full object-cover rounded-xl"
                        />
                      </div>
                    )}

                    {msg.voiceNoteUrl && (
                      <div
                        className={`flex items-center gap-2 p-1.5 rounded-xl ${
                          isMine ? "bg-black/15" : "bg-background/80"
                        }`}
                      >
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-full shrink-0"
                          onClick={() => {
                            const audioEl = document.getElementById(`dm-audio-${msg.id}`) as HTMLAudioElement;
                            if (!audioEl) return;
                            if (activeAudioId === msg.id) {
                              audioEl.pause();
                              setActiveAudioId(null);
                            } else {
                              audioEl.play();
                              setActiveAudioId(msg.id);
                            }
                          }}
                        >
                          {activeAudioId === msg.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </Button>
                        <span className="text-[11px] font-semibold">
                          {language === "ha" ? "Sakon Murya" : "Voice Note"}
                        </span>
                        <audio
                          id={`dm-audio-${msg.id}`}
                          src={msg.voiceNoteUrl}
                          onEnded={() => setActiveAudioId(null)}
                          className="hidden"
                        />
                      </div>
                    )}

                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                    <span
                      className={`block text-[9px] mt-1 text-right ${
                        isMine ? "text-primary-foreground/75" : "text-muted-foreground"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Media Previews / Voice Recorder Bar */}
        {(selectedImagePreview || isRecordingVoice) && (
          <div className="px-3 pt-2 bg-muted/40 border-t border-border/60">
            {selectedImagePreview && (
              <div className="relative inline-block mb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedImagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-xl border" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImageFile(null);
                    setSelectedImagePreview(null);
                  }}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {isRecordingVoice && (
              <div className="mb-2">
                <VoiceRecorder
                  onAudioRecorded={(blob: Blob) => setVoiceBlob(blob)}
                  onCancel={() => {
                    setVoiceBlob(null);
                    setIsRecordingVoice(false);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-muted/30 border-t border-border/70 flex items-center gap-1.5">
          <input
            type="file"
            accept="image/*"
            ref={imageInputRef}
            onChange={handleImagePick}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => imageInputRef.current?.click()}
            disabled={isSending}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary shrink-0"
            title="Attach Photo"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsRecordingVoice((prev) => !prev)}
            disabled={isSending}
            className={`h-9 w-9 rounded-xl shrink-0 ${
              isRecordingVoice || voiceBlob ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
            }`}
            title="Record Voice Note"
          >
            <Mic className="w-4 h-4" />
          </Button>
          <Input
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            placeholder={
              language === "ha"
                ? "Rubuta sakon sirri..."
                : "Type your direct message..."
            }
            className="rounded-2xl text-xs sm:text-sm h-10 border-border/80 focus:ring-primary"
            disabled={isSending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={(!newMessageText.trim() && !selectedImageFile && !voiceBlob) || isSending}
            className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground shrink-0 shadow-sm"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>

        <ImageLightbox
          isOpen={!!lightboxImage}
          images={lightboxImage ? [lightboxImage] : []}
          initialIndex={0}
          onClose={() => setLightboxImage(null)}
        />
      </DialogContent>
    </Dialog>
  );
}

