import { ProfileHeader } from "@/components/profile-header";
import { PostCard } from "@/components/post-card";
import { mockUsers, mockPosts, getCurrentUser } from "@/lib/data";
import type { User } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area";

// This is a server component, so params are available directly
export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  // Find user by username from mock data
  // In a real app, you would fetch this data from your backend
  let user: User | undefined = mockUsers.find(u => u.username === username);
  const currentUser = getCurrentUser();

  if (!user) {
    // Handle user not found, e.g., show a 404 page or redirect
    // For now, let's assume the current user if no specific user found (for demo)
    // or create a specific not found display
     return (
      <div className="container mx-auto max-w-3xl py-8 px-2 sm:px-4 text-center">
        <h1 className="text-2xl font-bold">User not found</h1>
        <p className="text-muted-foreground">The profile for @{username} could not be located.</p>
      </div>
    );
  }
  
  // If viewing own profile, set isCurrentUser flag
  if (user.id === currentUser.id) {
    user = { ...user, isCurrentUser: true };
  } else {
    // Determine if current user follows this profile user
    // This is mocked. In a real app, this info would come from the backend.
    const isFollowed = Math.random() > 0.5; // Randomly assign for demo
    user = { ...user, isFollowedByCurrentUser: isFollowed };
  }


  // Filter posts by the user
  const userPosts = mockPosts.filter(post => post.author.id === user?.id);

  return (
    <div className="container mx-auto max-w-3xl py-8 px-2 sm:px-4">
      <ProfileHeader user={user} />
      
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
            {userPosts.length > 0 ? (
              <div className="space-y-6">
                {userPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">This user hasn't posted anything yet.</p>
              </div>
            )}
        </TabsContent>
        <TabsContent value="media">
          <div className="text-center py-10">
            <p className="text-muted-foreground">Media content will appear here.</p>
            {/* Placeholder for media grid */}
          </div>
        </TabsContent>
        <TabsContent value="likes">
          <div className="text-center py-10">
            <p className="text-muted-foreground">Posts liked by this user will appear here.</p>
            {/* Placeholder for liked posts */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Optional: Generate static paths if you have a known list of users
// export async function generateStaticParams() {
//   return mockUsers.map(user => ({
//     username: user.username,
//   }));
// }
