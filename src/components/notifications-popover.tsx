"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, Heart, MessageSquare, UserPlus, Flame, CheckCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/app-settings-context";
import { useToast } from "@/hooks/use-toast";
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type AppNotification
} from "@/lib/firebase/notifications";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function NotificationsPopover() {
  const { currentUser } = useAuth();
  const { language } = useAppSettings();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;
    initialLoadDoneRef.current = false;
    seenIdsRef.current.clear();

    const unsubscribe = subscribeToNotifications(currentUser.uid, (list) => {
      if (!initialLoadDoneRef.current) {
        list.forEach((n) => seenIdsRef.current.add(n.id));
        initialLoadDoneRef.current = true;
      } else {
        list.forEach((n) => {
          if (!seenIdsRef.current.has(n.id) && !n.read) {
            seenIdsRef.current.add(n.id);
            toast({
              title: `${n.senderName}`,
              description: n.title,
            });
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                new Notification(`Zaure Connect — ${n.senderName}`, {
                  body: n.title,
                  icon: "/favicon.png",
                });
              } catch {
                // Ignore on browsers that require SW registration for Notification constructor
              }
            }
          }
        });
      }
      setNotifications(list);
    });
    return () => unsubscribe();
  }, [currentUser?.uid, toast]);

  const unreadList = notifications.filter((n) => !n.read);
  const unreadCount = unreadList.length;

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser?.uid || unreadList.length === 0) return;
    await markAllNotificationsAsRead(
      currentUser.uid,
      unreadList.map((n) => n.id)
    );
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageSquare className="w-3.5 h-3.5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-emerald-500" />;
      case 'message':
        return <MessageSquare className="w-3.5 h-3.5 text-primary" />;
      default:
        return <Flame className="w-3.5 h-3.5 text-secondary" />;
    }
  };

  if (!currentUser) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-2xl p-1.5 shadow-2xl border border-border bg-card">
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span>{language === "ha" ? "Sanarwa (Notifications)" : "Notifications"}</span>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {language === "ha" ? "Karanta duka" : "Mark all read"}
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-80 overflow-y-auto space-y-1">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {language === "ha" ? "Babu sabuwar sanarwa tukuna" : "No notifications yet"}
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                asChild
                onClick={() => {
                  if (currentUser?.uid && !notif.read) {
                    markNotificationAsRead(currentUser.uid, notif.id);
                  }
                  setIsOpen(false);
                }}
                className={`p-2.5 rounded-xl cursor-pointer flex items-start gap-2.5 transition-colors ${
                  notif.read ? "opacity-75 hover:opacity-100" : "bg-primary/5 font-semibold"
                }`}
              >
                <Link href={notif.linkUrl || "#"}>
                  <div className="relative shrink-0">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={notif.senderAvatarUrl} alt={notif.senderName} />
                      <AvatarFallback className="text-[10px]">{notif.senderName?.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-background shadow-xs">
                      {getIcon(notif.type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug line-clamp-2">
                      <span className="font-bold">{notif.senderName}</span> {notif.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 self-center" />
                  )}
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

