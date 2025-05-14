
// src/app/(main)/explore/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import type { Post, User } from "@/types";
import { getGlobalPosts } from "@/lib/firebase/posts"; // Assuming you have a way to get some users
import { Loader2 } from "lucide-react";
// For suggested users, you'd need a Firestore query, e.g., recently active or popular.
// For now, we'll fetch a few recent posts as "trending" and leave "suggested users" as a TODO.

const getInitials = (name?: string) => {
  if (!name) return "??";
  const names = name.split(' ');
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return (names[0][0] || '').toUpperCase() + (names[names.length - 1][0] || '').toUpperCase();
};

export default function ExplorePage() {
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]); // TODO: Implement fetching suggested users
  const [loadingPosts, setLoadingPosts] = useState(true);
  // const [loadingUsers, setLoadingUsers] = useState(true); // For suggested users

  useEffect(() => {
    const fetchTrending = async () => {
      setLoadingPosts(true);
      try {
        // Fetch a small number of recent global posts as "trending"
        const posts = await getGlobalPosts(6); 
        setTrendingPosts(posts);
      } catch (error) {
        console.error("Error fetching trending posts:", error);
      } finally {
        setLoadingPosts(false);
      }
    };

    // const fetchSuggested = async () => {
    //   setLoadingUsers(true);
    //   // TODO: Implement logic to fetch suggested users from Firestore
    //   // e.g., users with most followers, recent activity, or based on some algorithm
    //   // For now, it remains empty or uses a placeholder
    //   setSuggestedUsers([]); 
    //   setLoadingUsers(false);
    // };

    fetchTrending();
    // fetchSuggested();
  }, []);

  return (
    <div className="container mx-auto max-w-5xl py-8 px-2 sm:px-4">
      <h1 className="text-3xl font-bold mb-8">Explore Dandali Connect</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Trending Posts</h2>
        {loadingPosts ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : trendingPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingPosts.map(post => (
              <Card key={post.id} className="overflow-hidden shadow-lg rounded-xl">
                {post.imageUrl && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={post.imageUrl}
                      alt="Trending post image"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: "cover" }}
                      data-ai-hint="social media landscape"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-1 truncate h-10">{post.content.substring(0,100)}{post.content.length > 100 ? '...' : ''}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-2">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} data-ai-hint="user avatar small" />
                      <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
                    </Avatar>
                    <span>{post.authorName}</span>
                  </div>
                  {/* TODO: Link to individual post page when available /username/postId */}
                  {/* <Button variant="link" asChild className="mt-2 p-0 h-auto text-primary">
                    <Link href={`/${post.authorUsername}/${post.id}`}>View Post</Link> 
                  </Button> */}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No trending posts found at the moment.</p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Suggested People</h2>
        {/* Placeholder for suggested users */}
        {/* {loadingUsers ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : */}
        {suggestedUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {suggestedUsers.map(user => (
              <Card key={user.id} className="text-center shadow-lg rounded-xl">
                <CardContent className="p-6 flex flex-col items-center">
                  <Avatar className="h-20 w-20 mb-3 border-2 border-primary">
                    <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user profile" />
                    <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <Link href={`/${user.username}`}>
                    <h3 className="font-semibold hover:underline">{user.name}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mb-3">@{user.username}</p>
                  <Button size="sm" asChild>
                    <Link href={`/${user.username}`}>View Profile</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
           <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Suggestions for people to follow will appear here soon. Explore profiles or search for users you know!</p>
            </CardContent>
          </Card>
        )}
      </section>
      
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Local Trending Hashtags</h2>
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                    {["#ArewaConnect", "#Kano", "#HausaCulture", "#NaijaGist", "#DandaliCommunity", "#NorthernNigeria"].map(tag => (
                        <Button key={tag} variant="outline" size="sm" asChild>
                            <Link href={`/search?q=${encodeURIComponent(tag)}`}>{tag}</Link>
                        </Button>
                    ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                    Discover what's buzzing. These are placeholder hashtags. Full hashtag functionality coming soon.
                </p>
            </CardContent>
        </Card>
      </section>

    </div>
  );
}
