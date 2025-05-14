
"use client"

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { PostCard } from '@/components/post-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import type { Post, User } from '@/types';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit, or } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSearch = useCallback(async (currentQuery: string) => {
    if (!currentQuery.trim()) {
      setFilteredPosts([]);
      setFilteredUsers([]);
      setSearched(true);
      return;
    }

    setIsLoading(true);
    setSearched(true);
    const lowerCaseQuery = currentQuery.toLowerCase();

    try {
      // Search Users
      // Firestore doesn't support case-insensitive search or partial string matches directly on multiple fields easily.
      // A more robust search usually requires a dedicated search service like Algolia or Typesense.
      // For a basic Firestore search, we can query for exact matches on username or try a prefix match if needed.
      // Here, we'll attempt to find users whose username or name starts with the query. This is limited.
      const usersRef = collection(db, "users");
      const userQueryName = query(usersRef, 
        where("name", ">=", currentQuery), 
        where("name", "<=", currentQuery + '\uf8ff'), 
        limit(10)
      );
      const userQueryUsername = query(usersRef, 
        where("username", ">=", lowerCaseQuery), 
        where("username", "<=", lowerCaseQuery + '\uf8ff'), 
        limit(10)
      );
      
      const [nameSnapshot, usernameSnapshot] = await Promise.all([
        getDocs(userQueryName),
        getDocs(userQueryUsername)
      ]);
      
      const usersMap = new Map<string, User>();
      nameSnapshot.forEach(doc => usersMap.set(doc.id, { id: doc.id, ...doc.data() } as User));
      usernameSnapshot.forEach(doc => usersMap.set(doc.id, { id: doc.id, ...doc.data() } as User));
      setFilteredUsers(Array.from(usersMap.values()));

      // Search Posts (content field) - This is also very limited with Firestore direct queries for text search.
      // A full-text search solution is better for this.
      // We'll attempt a very basic "includes" by fetching some recent posts and filtering client-side (not scalable).
      // Or, if you add keywords to posts, you could query array-contains.
      // For now, let's fetch posts and filter by content.
      const postsRef = collection(db, "posts");
      // Fetch recent posts and filter (not ideal for production search but a placeholder)
      const postsQuery = query(postsRef, orderBy("timestamp", "desc"), limit(50));
      const postsSnapshot = await getDocs(postsQuery);
      const allRecentPosts = postsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Post));
      
      const filtered = allRecentPosts.filter(post => 
        post.content.toLowerCase().includes(lowerCaseQuery) ||
        post.authorName.toLowerCase().includes(lowerCaseQuery) ||
        post.authorUsername.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredPosts(filtered.slice(0, 10)); // Limit results

    } catch (error) {
      console.error("Error during search:", error);
      setFilteredPosts([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Trigger search when query param changes
    if (searchTerm) {
        performSearch(searchTerm);
    } else {
        setFilteredPosts([]);
        setFilteredUsers([]);
        setSearched(false);
        setIsLoading(false);
    }
  }, [searchTerm, performSearch]);

  const getInitials = (name?: string) => {
    if (!name) return "??";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] || '').toUpperCase() + (names[names.length - 1][0] || '').toUpperCase();
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-2 sm:px-4">
      <h1 className="text-2xl font-bold mb-2">Search Results</h1>
      {searchTerm ? (
        <p className="text-muted-foreground mb-6">Showing results for: <span className="font-semibold text-foreground">{searchTerm}</span></p>
      ) : (
        <p className="text-muted-foreground mb-6">Please enter a search term in the bar above.</p>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && searched && searchTerm && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="people">People ({filteredUsers.length})</TabsTrigger>
            <TabsTrigger value="posts">Posts ({filteredPosts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {filteredUsers.length === 0 && filteredPosts.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No results found for "{searchTerm}". Try a different search term.</p>
            ) : (
              <>
                {filteredUsers.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">People</h2>
                    <div className="space-y-4">
                      {filteredUsers.map(user => (
                        <Card key={user.id}>
                          <CardContent className="p-4 flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar" />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Link href={`/${user.username}`} className="font-semibold hover:underline">{user.name}</Link>
                              <p className="text-sm text-muted-foreground">@{user.username}</p>
                              {user.bio && <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs sm:max-w-sm md:max-w-md">{user.bio}</p>}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {filteredPosts.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold mb-4">Posts</h2>
                    <div className="space-y-6">
                      {filteredPosts.map(post => <PostCard key={post.id} post={post} />)}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="people">
             {filteredUsers.length > 0 ? (
                <div className="space-y-4">
                  {filteredUsers.map(user => (
                    <Card key={user.id}>
                      <CardContent className="p-4 flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                           <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar"/>
                           <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={`/${user.username}`} className="font-semibold hover:underline">{user.name}</Link>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                           {user.bio && <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs sm:max-w-sm md:max-w-md">{user.bio}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                 <p className="text-muted-foreground text-center py-10">No people found matching "{searchTerm}".</p>
              )}
          </TabsContent>

          <TabsContent value="posts">
            {filteredPosts.length > 0 ? (
                <div className="space-y-6">
                  {filteredPosts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-10">No posts found matching "{searchTerm}".</p>
              )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
