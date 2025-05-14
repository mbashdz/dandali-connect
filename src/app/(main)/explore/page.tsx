import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { mockPosts, mockUsers } from "@/lib/data";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Helper to get initials
const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
};

export default function ExplorePage() {
  // For demonstration, showing some trending posts and suggested users
  const trendingPosts = mockPosts.slice(0, 4); // Example: first 4 posts
  const suggestedUsers = mockUsers.slice(1, 5); // Example: users 2-5

  return (
    <div className="container mx-auto max-w-5xl py-8 px-2 sm:px-4">
      <h1 className="text-3xl font-bold mb-8">Explore Dandali Connect</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Trending Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {trendingPosts.map(post => (
            <Card key={post.id} className="overflow-hidden shadow-lg rounded-xl">
              {post.imageUrl && (
                <div className="relative h-48 w-full">
                  <Image
                    src={post.imageUrl}
                    alt="Trending post image"
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="social media landscape"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-1 truncate">{post.content.substring(0,100)}{post.content.length > 100 ? '...' : ''}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} data-ai-hint="user avatar small" />
                    <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
                  </Avatar>
                  <span>{post.author.name}</span>
                </div>
                <Button variant="link" asChild className="mt-2 p-0 h-auto text-primary">
                  <Link href={`/${post.author.username}/${post.id}`}>View Post</Link> 
                  {/* Assuming post pages like /username/postId */}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Suggested People</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {suggestedUsers.map(user => (
            <Card key={user.id} className="text-center shadow-lg rounded-xl">
              <CardContent className="p-6 flex flex-col items-center">
                <Avatar className="h-20 w-20 mb-3 border-2 border-primary">
                  <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar profile" />
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
      </section>
      
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Local Trending Hashtags</h2>
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                    {["#ArewaTwitter", "#KanoPolitics", "#HausaFood", "#NollywoodNorth", "#DandaliVoice", "#SallahFiesta"].map(tag => (
                        <Button key={tag} variant="outline" size="sm" asChild>
                            <Link href={`/search?q=${encodeURIComponent(tag)}`}>{tag}</Link>
                        </Button>
                    ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                    Discover what's buzzing in the Hausa-speaking community. These are placeholder hashtags.
                </p>
            </CardContent>
        </Card>
      </section>

    </div>
  );
}
