"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, MessageSquare, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/app-settings-context";
import { sendDirectMessage, subscribeToMessages, getConversationId } from "@/lib/firebase/messages";
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
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !recipientUser || isSending) return;

    setIsSending(true);
    try {
      await sendDirectMessage(recipientUser, newMessageText.trim());
      setNewMessageText("");
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
                {recipientUser.name?.slice(0, 2).toUpperCase() || "DC"}
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
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-xs font-medium"
                        : "bg-muted text-foreground border border-border/60 rounded-bl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
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

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-muted/30 border-t border-border/70 flex items-center gap-2">
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
            disabled={!newMessageText.trim() || isSending}
            className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground shrink-0 shadow-sm"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
