// src/app/page.tsx
'use client';

import { AppHeader } from '@/components/layout/app-header';
import NewsFeedPageContent from './(main)/page'; // Renamed import for clarity
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// This component now explicitly defines the layout for the root page ("/").
// It mirrors the structure and auth checks from src/app/(main)/layout.tsx
// to ensure the AppHeader and consistent UX for the news feed.

export default function RootPageWithLayout() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is done loading, there's no user, and we are on the root page,
    // redirect to login. This mirrors the behavior of (main)/layout.tsx.
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be handled by the redirect in useEffect.
    // Returning null prevents rendering content before redirect.
    return null;
  }

  // If user is authenticated, render the page with AppHeader and NewsFeedPageContent.
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1">
        <NewsFeedPageContent />
      </main>
      <footer className="py-6 md:px-8 md:py-0 bg-background border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Dandali Connect. All rights reserved.
            <br />
            Built for the Hausa-speaking community.
          </p>
        </div>
      </footer>
    </div>
  );
}
