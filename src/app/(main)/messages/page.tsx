// src/app/(main)/messages/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/app-settings-context";
import { subscribeToConversations } from "@/lib/firebase/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DirectMessageDialog } from "@/components/direct-message-dialog";
import { MessageSquare, Search, Loader2 } from "lucide-react";
import type { User, Conversation } from "@/types";

export default function MessagesInboxPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { language } = useAppSettings();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeToConversations(
      currentUser.uid,
      (convos) => {
        setConversations(convos);
        setIsLoading(false);
      },
      (err) => {
        console.error("[MessagesPage] Subscription failed:", err);
        setConversations([]);
        setIsLoading(false);
      }
    );

    // Timeout safety fallback (max 5s)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [currentUser?.uid, authLoading]);

  const filteredConversations = conversations.filter((convo) => {
    const otherUid = convo.participants.find((id: string) => id !== currentUser?.uid);
    const otherData = otherUid ? convo.participantData[otherUid] : null;
    if (!otherData) return false;
    const q = searchQuery.toLowerCase();
    return (
      otherData.name.toLowerCase().includes(q) ||
      otherData.username.toLowerCase().includes(q) ||
      convo.lastMessage.toLowerCase().includes(q)
    );
  });

  const handleOpenConversation = (convo: Conversation) => {
    const otherUid = convo.participants.find((id: string) => id !== currentUser?.uid);
    if (!otherUid) return;
    const otherData = convo.participantData[otherUid];
    setSelectedUser({
      id: otherUid,
      uid: otherUid,
      name: otherData.name,
      username: otherData.username,
      avatarUrl: otherData.avatarUrl,
      email: "",
      coverPhotoUrl: "",
      bio: "",
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: "",
    });
    setIsChatOpen(true);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-12 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-4 sm:py-8 px-3 sm:px-6 space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          {language === "ha" ? "Akwatin Sakonni (Messages)" : "Direct Messages"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {language === "ha"
            ? "Tattaunawa ta sirri tsakaninka da sauran 'yan uwa a Zaure Connect."
            : "Private conversations and instant direct messages with your community."}
        </p>
      </div>

      {/* Search Inbox */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            language === "ha"
              ? "Nemo tattaunawa ko suna..."
              : "Search conversations or contacts..."
          }
          className="pl-10 h-11 rounded-2xl bg-card border-border/80 text-sm focus:ring-primary"
        />
      </div>

      {/* Conversations List */}
      <Card className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-md divide-y divide-border/60">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-xs">
              {language === "ha" ? "Ana loda sakonni..." : "Loading messages..."}
            </p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="py-16 px-4 text-center text-muted-foreground flex flex-col items-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-bold text-foreground">
              {language === "ha" ? "Babu tattaunawa a nan tukuna" : "No conversations yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {language === "ha"
                ? "Ziyarci shafin kowane aboki ka danna 'Sako (Message)' don fara tattaunawa."
                : "Visit any friend's profile and tap 'Message' to start your first direct conversation."}
            </p>
          </div>
        ) : (
          filteredConversations.map((convo) => {
            const otherUid = convo.participants.find((id: string) => id !== currentUser?.uid);
            const otherData = otherUid ? convo.participantData[otherUid] : null;
            if (!otherData) return null;
            const isLastFromMe = convo.lastSenderUid === currentUser?.uid;
            const isOtherTyping = otherUid ? !!convo.typing?.[otherUid] : false;

            return (
              <div
                key={convo.id}
                onClick={() => handleOpenConversation(convo)}
                className="p-4 flex items-center justify-between gap-3 hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar className="w-12 h-12 border border-primary/20">
                      <AvatarImage src={otherData.avatarUrl} alt={otherData.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {otherData.name?.slice(0, 2).toUpperCase() || "DC"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-background" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground leading-tight truncate">
                      {otherData.name}
                    </h3>
                    {isOtherTyping ? (
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse mt-0.5">
                        {language === "ha" ? "Yana rubutu..." : "Typing..."}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {isLastFromMe && (
                          <span className="text-primary font-semibold">
                            {language === "ha" ? "Ka ce: " : "You: "}
                          </span>
                        )}
                        {convo.lastMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-muted-foreground block">
                    {new Date(convo.updatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Direct Message Active Modal */}
      {selectedUser && (
        <DirectMessageDialog
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          recipientUser={selectedUser}
        />
      )}
    </div>
  );
}
