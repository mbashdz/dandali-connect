import { PostCard } from "@/components/post-card";
import { mockPosts } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function NewsFeedPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8 px-2 sm:px-4">
      <div className="space-y-6">
        {/* Create Post Card - Simplified */}
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg font-semibold">Create Post</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Textarea placeholder="What's on your mind, Adamu?" className="mb-3 min-h-[80px]"/>
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {/* Placeholder for image/video/voice icons */}
                <Button variant="ghost" size="sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  <span className="ml-1 hidden sm:inline">Photo/Video</span>
                </Button>
                 <Button variant="ghost" size="sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                    <span className="ml-1 hidden sm:inline">Voice</span>
                 </Button>
              </div>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Post
              </Button>
            </div>
          </CardContent>
        </Card>

        {mockPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
