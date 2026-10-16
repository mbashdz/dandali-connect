"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { PostCard } from '@/components/post-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Post, User, KasuwaItem } from '@/types';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Store, MapPin } from 'lucide-react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getKasuwaItems } from '@/lib/firebase/kasuwa';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchTerm = searchParams.get('q') || '';
  
  const [inputQuery, setInputQuery] = useState(searchTerm);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [filteredKasuwa, setFilteredKasuwa] = useState<KasuwaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    setInputQuery(searchTerm);
  }, [searchTerm]);

  const performSearch = useCallback(async (currentQuery: string) => {
    if (!currentQuery.trim()) {
      setFilteredPosts([]);
      setFilteredUsers([]);
      setFilteredKasuwa([]);
      setSearched(false);
      return;
    }

    setIsLoading(true);
    setSearched(true);
    const lowerCaseQuery = currentQuery.trim().toLowerCase();

    try {
      const usersRef = collection(db, "users");
      const postsRef = collection(db, "posts");

      const [usersSnap, postsSnap, kasuwaItems] = await Promise.all([
        getDocs(query(usersRef, limit(100))),
        getDocs(query(postsRef, orderBy("timestamp", "desc"), limit(80))),
        getKasuwaItems("all"),
      ]);

      // Case-insensitive user search across name, username, bio, and location
      const matchedUsers: User[] = [];
      usersSnap.forEach((docSnap) => {
        const u = { id: docSnap.id, ...docSnap.data() } as User;
        if (
          u.name?.toLowerCase().includes(lowerCaseQuery) ||
          u.username?.toLowerCase().includes(lowerCaseQuery) ||
          u.bio?.toLowerCase().includes(lowerCaseQuery) ||
          u.location?.toLowerCase().includes(lowerCaseQuery)
        ) {
          matchedUsers.push(u);
        }
      });
      setFilteredUsers(matchedUsers.slice(0, 20));

      // Case-insensitive post search
      const allRecentPosts = postsSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp || new Date().toISOString(),
        } as Post;
      });
      const matchedPosts = allRecentPosts.filter(
        (post) =>
          post.content?.toLowerCase().includes(lowerCaseQuery) ||
          post.authorName?.toLowerCase().includes(lowerCaseQuery) ||
          post.authorUsername?.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredPosts(matchedPosts.slice(0, 20));

      // Case-insensitive Kasuwa marketplace search
      const matchedKasuwa = kasuwaItems.filter(
        (item) =>
          item.title?.toLowerCase().includes(lowerCaseQuery) ||
          item.description?.toLowerCase().includes(lowerCaseQuery) ||
          item.location?.toLowerCase().includes(lowerCaseQuery) ||
          item.category?.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredKasuwa(matchedKasuwa.slice(0, 20));
    } catch (error) {
      console.error("Error during search:", error);
      setFilteredPosts([]);
      setFilteredUsers([]);
      setFilteredKasuwa([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTerm) {
      performSearch(searchTerm);
    } else {
      setFilteredPosts([]);
      setFilteredUsers([]);
      setFilteredKasuwa([]);
      setSearched(false);
      setIsLoading(false);
    }
  }, [searchTerm, performSearch]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputQuery.trim())}`);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "ZC";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] || '').toUpperCase() + (names[names.length - 1][0] || '').toUpperCase();
  };

  const totalResults = filteredUsers.length + filteredPosts.length + filteredKasuwa.length;

  return (
    <div className="container mx-auto max-w-3xl py-6 sm:py-8 px-3 sm:px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight mb-3">Search Zaure Connect</h1>
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Search people, posts, #hashtags, or Kasuwa items..."
              className="pl-10 rounded-2xl h-11 bg-card border-border/80"
            />
          </div>
          <Button type="submit" className="rounded-2xl h-11 px-5 font-bold">
            Search
          </Button>
        </form>
      </div>

      {searchTerm && (
        <p className="text-sm text-muted-foreground">
          Showing results for: <span className="font-bold text-foreground">&ldquo;{searchTerm}&rdquo;</span> ({totalResults} found)
        </p>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && searched && searchTerm && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 rounded-2xl">
            <TabsTrigger value="all" className="rounded-xl text-xs sm:text-sm">All ({totalResults})</TabsTrigger>
            <TabsTrigger value="people" className="rounded-xl text-xs sm:text-sm">People ({filteredUsers.length})</TabsTrigger>
            <TabsTrigger value="posts" className="rounded-xl text-xs sm:text-sm">Posts ({filteredPosts.length})</TabsTrigger>
            <TabsTrigger value="kasuwa" className="rounded-xl text-xs sm:text-sm">Kasuwa ({filteredKasuwa.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            {totalResults === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-dashed">
                <p className="text-muted-foreground text-sm">No results found for &ldquo;{searchTerm}&rdquo;. Try another keyword.</p>
              </div>
            ) : (
              <>
                {filteredUsers.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold mb-3">People</h2>
                    <div className="space-y-3">
                      {filteredUsers.map((user) => (
                        <Card key={user.id} className="rounded-2xl border-border/80">
                          <CardContent className="p-4 flex items-center justify-between gap-3">
                            <div className="flex items-center space-x-3.5 min-w-0">
                              <Avatar className="h-12 w-12 border border-primary/30">
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback className="font-bold bg-primary/10 text-primary">{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <Link href={`/${user.username}`} className="font-bold hover:underline block truncate">{user.name}</Link>
                                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                                {user.bio && <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs sm:max-w-md">{user.bio}</p>}
                              </div>
                            </div>
                            <Button asChild size="sm" variant="outline" className="rounded-xl font-bold shrink-0">
                              <Link href={`/${user.username}`}>Profile</Link>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {filteredKasuwa.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Store className="w-4 h-4 text-primary" /> Zaure Kasuwa Items
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredKasuwa.map((item) => (
                        <Card key={item.id} className="rounded-2xl overflow-hidden border-border/80 flex flex-col justify-between">
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-sm line-clamp-1">{item.title}</h3>
                              <span className="text-xs font-extrabold text-primary shrink-0">₦{item.price.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                            <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" /> {item.location}</span>
                              <Link href="/kasuwa" className="text-primary font-bold hover:underline">View in Kasuwa &rarr;</Link>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {filteredPosts.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold mb-3">Posts</h2>
                    <div className="space-y-6">
                      {filteredPosts.map((post) => <PostCard key={post.id} post={post} />)}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="people">
            {filteredUsers.length > 0 ? (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="rounded-2xl border-border/80">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <Avatar className="h-12 w-12 border border-primary/30">
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback className="font-bold bg-primary/10 text-primary">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link href={`/${user.username}`} className="font-bold hover:underline block truncate">{user.name}</Link>
                          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                          {user.bio && <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs sm:max-w-md">{user.bio}</p>}
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline" className="rounded-xl font-bold shrink-0">
                        <Link href={`/${user.username}`}>Profile</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10 text-sm">No people found matching &ldquo;{searchTerm}&rdquo;.</p>
            )}
          </TabsContent>

          <TabsContent value="posts">
            {filteredPosts.length > 0 ? (
              <div className="space-y-6">
                {filteredPosts.map((post) => <PostCard key={post.id} post={post} />)}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10 text-sm">No posts found matching &ldquo;{searchTerm}&rdquo;.</p>
            )}
          </TabsContent>

          <TabsContent value="kasuwa">
            {filteredKasuwa.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredKasuwa.map((item) => (
                  <Card key={item.id} className="rounded-2xl overflow-hidden border-border/80">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm line-clamp-1">{item.title}</h3>
                        <span className="text-xs font-extrabold text-primary shrink-0">₦{item.price.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                      <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" /> {item.location}</span>
                        <Link href="/kasuwa" className="text-primary font-bold hover:underline">Open Kasuwa &rarr;</Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10 text-sm">No marketplace items found matching &ldquo;{searchTerm}&rdquo;.</p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
