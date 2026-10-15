// src/app/(main)/layout.tsx
'use client'; // Needs to be a client component to use hooks like useAuth

import type { PropsWithChildren } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function MainAppLayout({ children }: PropsWithChildren) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
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
    // This return is mainly for safety, useEffect should redirect.
    // Or, you could return null or a specific "redirecting..." message.
    return null; 
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <footer className="py-6 md:px-8 bg-background border-t">
        <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} Zaure Connect Africa &middot; Dandalin Sada Zumuntar Afirka. All rights reserved.
          </p>
          <div className="flex items-center gap-4 font-semibold">
            <a href="/terms" className="hover:text-primary transition-colors">Sharuddan Aiki (Terms)</a>
            <span>&middot;</span>
            <a href="/privacy" className="hover:text-primary transition-colors">Sirri da Tsaro (Privacy)</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
