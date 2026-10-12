// src/components/profile-header.tsx
"use client"

import type { User } from "@/types"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit3, UserPlus, Check, MapPin, Link2, MessageSquare } from "lucide-react"
import { useState, useEffect } from "react"
import { DirectMessageDialog } from "@/components/direct-message-dialog"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { followUser, unfollowUser, checkIsFollowing } from "@/lib/firebase/users"

interface ProfileHeaderProps {
  user: User;
  onEditProfile?: () => void; // Callback to open edit dialog
}

export function ProfileHeader({ user, onEditProfile }: ProfileHeaderProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(user.isFollowedByCurrentUser || false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [followersCountState, setFollowersCountState] = useState(user.followersCount || 0);

  useEffect(() => {
    setFollowersCountState(user.followersCount || 0);
    if (currentUser && user.uid && currentUser.uid !== user.uid) {
      checkIsFollowing(currentUser.uid, user.uid).then((res) => {
        setIsFollowing(res);
      });
    }
  }, [currentUser, user.uid, user.followersCount]);

  const getInitials = (name: string) => {
    if (!name) return "DC";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + (names[names.length - 1]?.[0]?.toUpperCase() || '');
  }
  
  const handleFollowToggle = async () => {
    if (!currentUser || isUpdatingFollow) return;
    setIsUpdatingFollow(true);
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowersCountState((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      if (nextState) {
        await followUser(
          {
            uid: currentUser.uid,
            name: currentUser.name || "Dandali Member",
            username: currentUser.username || "user",
            avatarUrl: currentUser.avatarUrl || "https://placehold.co/100x100.png",
          },
          user.uid
        );
        toast({ title: `Barka! Yanzu kana bin @${user.username}`, description: `You are now following ${user.name}` });
      } else {
        await unfollowUser(currentUser.uid, user.uid);
        toast({ title: `Ka daina bin @${user.username}`, description: `Unfollowed ${user.name}` });
      }
    } catch (err: any) {
      console.error("[handleFollowToggle] Error:", err);
      // Revert on failure
      setIsFollowing(!nextState);
      setFollowersCountState((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to update follow status" });
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  const displayFollowersCount = followersCountState;

  return (
    <Card className="w-full overflow-hidden shadow-lg rounded-xl mb-6">
      <div className="relative h-48 md:h-64 bg-muted">
        {user.coverPhotoUrl ? (
          <Image
            src={user.coverPhotoUrl}
            alt={`${user.name}'s cover photo`}
            fill // Use fill instead of layout
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Provide sizes
            style={{ objectFit: "cover" }} // Use style for objectFit
            data-ai-hint="profile cover background"
            priority // Consider adding priority for LCP images
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary to-secondary" data-ai-hint="abstract gradient"></div>
        )}
      </div>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20 space-y-4 sm:space-y-0 sm:space-x-4 relative">
          <Avatar className="h-32 w-32 md:h-36 md:w-36 border-4 border-background rounded-full shadow-md">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar portrait" />
            <AvatarFallback className="text-4xl">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow text-center sm:text-left pt-4 sm:pt-0">
            <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
          <div className="sm:ml-auto pt-2 sm:pt-0 flex items-center gap-2">
            {user.isCurrentUser && onEditProfile ? (
              <Button variant="outline" onClick={onEditProfile} className="rounded-xl">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            ) : !user.isCurrentUser ? (
              <>
                <Button onClick={handleFollowToggle} variant={isFollowing ? "secondary" : "default"} className="rounded-xl">
                  {isFollowing ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" /> Follow
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsMessageOpen(true)}
                  className="rounded-xl border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Sako (Message)</span>
                </Button>
              </>
            ) : null}
          </div>
        </div>
        
        {user.bio && <p className="mt-4 text-sm text-center sm:text-left text-foreground/80">{user.bio}</p>}
        
        <div className="mt-3 flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {user.location && (
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{user.location}</span>
            </div>
          )}
          {user.website && (
            <div className="flex items-center">
              <Link2 className="h-3 w-3 mr-1" />
              <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-center sm:justify-start space-x-6 text-sm">
          <div>
            <span className="font-semibold">{user.postsCount || 0}</span> Posts
          </div>
          {(!user.hideFollowersCount || user.isCurrentUser) ? (
            <div>
              <span className="font-semibold">{displayFollowersCount}</span> Followers
              {user.hideFollowersCount && user.isCurrentUser && (
                <span className="ml-1 text-[10px] text-muted-foreground italic">(Hidden to public)</span>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground text-xs flex items-center">
              <span>Followers hidden</span>
            </div>
          )}
          <div>
            <span className="font-semibold">{user.followingCount || 0}</span> Following
          </div>
        </div>
      </CardContent>

      {/* Direct Message Dialog */}
      {!user.isCurrentUser && (
        <DirectMessageDialog
          isOpen={isMessageOpen}
          onClose={() => setIsMessageOpen(false)}
          recipientUser={user}
        />
      )}
    </Card>
  )
}
