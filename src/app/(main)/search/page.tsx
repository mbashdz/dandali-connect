"use client" // Required for useSearchParams

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PostCard } from '@/components/post-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockPosts, mockUsers } from '@/lib/data';
import type { Post, User } from '@/types';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      setFilteredPosts(
        mockPosts.filter(post => 
          post.content.toLowerCase().includes(lowerCaseQuery) || 
          post.author.name.toLowerCase().includes(lowerCaseQuery) ||
          post.author.username.toLowerCase().includes(lowerCaseQuery)
        )
      );
      setFilteredUsers(
        mockUsers.filter(user => 
          user.name.toLowerCase().includes(lowerCaseQuery) ||
          user.username.toLowerCase().includes(lowerCaseQuery) ||
          (user.bio && user.bio.toLowerCase().includes(lowerCaseQuery))
        )
      );
    } else {
      setFilteredPosts([]);
      setFilteredUsers([]);
    }
  }, [query]);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-2 sm:px-4">
      <h1 className="text-2xl font-bold mb-2">Search Results</h1>
      {query ? (
        <p className="text-muted-foreground mb-6">Showing results for: <span className="font-semibold text-foreground">{query}</span></p>
      ) : (
        <p className="text-muted-foreground mb-6">Please enter a search term.</p>
      )}

      {query && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {filteredUsers.length === 0 && filteredPosts.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No results found for "{query}".</p>
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
                              <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">{user.bio}</p>
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
                           <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">{user.bio}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                 <p className="text-muted-foreground text-center py-10">No people found matching "{query}".</p>
              )}
          </TabsContent>

          <TabsContent value="posts">
            {filteredPosts.length > 0 ? (
                <div className="space-y-6">
                  {filteredPosts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-10">No posts found matching "{query}".</p>
              )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
