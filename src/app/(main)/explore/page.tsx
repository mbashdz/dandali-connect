// src/app/(main)/explore/page.tsx
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import type { Post, User } from "@/types";
import { getGlobalPosts } from "@/lib/firebase/posts";
import { getSuggestedUsers } from "@/lib/firebase/users";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, Compass, Flame, Users, Sparkles } from "lucide-react";

const getInitials = (name?: string) => {
  if (!name) return "DC";
  const names = name.split(' ');
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return (names[0][0] || '').toUpperCase() + (names[names.length - 1][0] || '').toUpperCase();
};

export default function ExplorePage() {
  const { currentUser } = useAuth();
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoadingPosts(true);
      try {
        const posts = await getGlobalPosts(9); 
        setTrendingPosts(posts);
      } catch (error) {
        console.error("Error fetching trending posts:", error);
      } finally {
        setLoadingPosts(false);
      }
    };

    const fetchSuggested = async () => {
      setLoadingUsers(true);
      try {
        const users = await getSuggestedUsers(8, currentUser?.uid);
        setSuggestedUsers(users);
      } catch (err) {
        console.error("Error fetching suggested users:", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchTrending();
    fetchSuggested();
  }, [currentUser?.uid]);

  return (
    <div className="container mx-auto max-w-6xl py-8 px-3 sm:px-6 space-y-10">
      {/* Page Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
          <Compass className="w-4 h-4" /> Discover Community
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Explore Dandali Connect
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find trending African conversations, connect with creators, and browse local discussions.
        </p>
      </div>

      {/* Suggested People */}
      <section>
        <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
          <Users className="w-5 h-5 text-secondary" />
          Suggested People to Follow
        </h2>

        {loadingUsers ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : suggestedUsers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {suggestedUsers.map(user => (
              <Card key={user.id} className="text-center shadow-sm hover:shadow-lg rounded-2xl border border-border/80 transition-all p-4 bg-card flex flex-col items-center justify-between">
                <div className="flex flex-col items-center">
                  <Avatar className="h-16 w-16 mb-2.5 border-2 border-primary/40">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Link href={`/${user.username}`}>
                    <h3 className="font-bold text-sm text-foreground hover:underline truncate max-w-[130px]">{user.name}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mb-1 truncate max-w-[130px]">@{user.username}</p>
                  {user.location && (
                    <span className="text-[10px] text-muted-foreground line-clamp-1 mb-2">{user.location}</span>
                  )}
                </div>
                <Button size="sm" asChild className="w-full rounded-xl font-bold text-xs bg-primary text-primary-foreground shadow-xs">
                  <Link href={`/${user.username}`}>View Profile</Link>
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-card rounded-2xl border border-dashed text-center text-sm text-muted-foreground">
            No other users found yet. As your friends and family register, they will appear here!
          </div>
        )}
      </section>

      {/* Trending Posts */}
      <section>
        <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
          <Flame className="w-5 h-5 text-orange-500" />
          Trending Posts & Moments
        </h2>

        {loadingPosts ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : trendingPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingPosts.map(post => (
              <Card key={post.id} className="overflow-hidden shadow-sm hover:shadow-lg rounded-2xl border border-border/80 transition-all bg-card flex flex-col justify-between">
                <div>
                  {post.imageUrl && (
                    <div className="relative h-44 w-full bg-muted">
                      <Image
                        src={post.imageUrl}
                        alt="Post media"
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <p className="text-sm font-normal line-clamp-3 mb-3 text-foreground/90">{post.content}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Avatar className="h-6 w-6 mr-2 border">
                        <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} />
                        <AvatarFallback className="text-[10px]">{getInitials(post.authorName)}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-foreground">{post.authorName}</span>
                      <span className="mx-1">&middot;</span>
                      <span>@{post.authorUsername}</span>
                    </div>
                  </CardContent>
                </div>
                <div className="p-4 pt-0">
                  <Button variant="ghost" asChild size="sm" className="w-full rounded-xl text-xs font-bold text-primary hover:bg-primary/10">
                    <Link href={`/${post.authorUsername}`}>View Creator Profile &rarr;</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-card rounded-2xl border border-dashed text-center text-sm text-muted-foreground">
            No trending posts yet. Share something in the home feed to start the conversation!
          </div>
        )}
      </section>

      {/* Trending African Community Hashtags */}
      <section className="pt-2">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          Regional African Hashtags
        </h2>
        <Card className="rounded-2xl border border-border/80 p-5 bg-card">
          <div className="flex flex-wrap gap-2.5">
            {["#ArewaConnect", "#Kano", "#HausaCulture", "#KadunaTech", "#NaijaGist", "#DandaliCommunity", "#AfricanHeritage", "#Abuja"].map(tag => (
              <Button key={tag} variant="outline" size="sm" asChild className="rounded-xl text-xs font-bold hover:bg-primary/10 hover:text-primary transition-colors">
                <Link href={`/search?q=${encodeURIComponent(tag)}`}>{tag}</Link>
              </Button>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
