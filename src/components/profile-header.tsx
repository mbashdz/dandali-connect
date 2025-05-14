"use client"

import type { User } from "@/types"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit3, UserPlus, Check } from "lucide-react"
import { useState } from "react"

interface ProfileHeaderProps {
  user: User
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowedByCurrentUser || false);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }
  
  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    // In a real app, you'd make an API call here
  };

  return (
    <Card className="w-full overflow-hidden shadow-lg rounded-xl mb-6">
      <div className="relative h-48 md:h-64 bg-muted">
        {user.coverPhotoUrl && (
          <Image
            src={user.coverPhotoUrl}
            alt={`${user.name}'s cover photo`}
            layout="fill"
            objectFit="cover"
            data-ai-hint="profile cover background"
          />
        )}
      </div>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-12 space-y-4 sm:space-y-0 sm:space-x-4">
          <Avatar className="h-32 w-32 border-4 border-background rounded-full shadow-md">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar" />
            <AvatarFallback className="text-4xl">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow text-center sm:text-left">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
          <div className="sm:ml-auto">
            {user.isCurrentUser ? (
              <Button variant="outline">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            ) : (
              <Button onClick={handleFollowToggle} variant={isFollowing ? "secondary" : "default"}>
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
            )}
          </div>
        </div>
        
        <p className="mt-4 text-sm text-center sm:text-left">{user.bio}</p>
        
        <div className="mt-4 flex justify-center sm:justify-start space-x-6 text-sm">
          <div>
            <span className="font-semibold">{user.postsCount}</span> Posts
          </div>
          <div>
            <span className="font-semibold">{user.followersCount + (isFollowing && !user.isFollowedByCurrentUser && !user.isCurrentUser ? 1 : 0) - (!isFollowing && user.isFollowedByCurrentUser && !user.isCurrentUser ? 1: 0) }</span> Followers
          </div>
          <div>
            <span className="font-semibold">{user.followingCount}</span> Following
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
