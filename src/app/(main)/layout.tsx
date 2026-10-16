// src/app/(main)/layout.tsx
'use client';

import type { PropsWithChildren } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { useAuth } from '@/contexts/auth-context';
import { useAppSettings } from '@/contexts/app-settings-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

export default function MainAppLayout({ children }: PropsWithChildren) {
  const { currentUser, loading } = useAuth();
  const { language } = useAppSettings();
  const router = useRouter();
  const pathname = usePathname();

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // Register global Android Hardware Back Button handler for Capacitor WebView
  useEffect(() => {
    (window as any).__zaureHandleBack = () => {
      // 1. Close any open Radix Dialog / Sheet / AlertDialog or ImageLightbox
      const openDialog = document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
      if (openDialog) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
        return 'handled';
      }
      const lightboxCloseBtn = document.querySelector('[aria-label="Close fullscreen preview"]') as HTMLButtonElement | null;
      if (lightboxCloseBtn) {
        lightboxCloseBtn.click();
        return 'handled';
      }

      // 2. If not on the home feed '/', navigate back or to '/'
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push('/');
        }
        return 'handled';
      }

      // 3. If scrolled down on the home feed, scroll back to top first
      if (window.scrollY > 250) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return 'handled';
      }

      return 'root';
    };

    return () => {
      delete (window as any).__zaureHandleBack;
    };
  }, [router, pathname]);

  // Universal Pull-to-Refresh touch gesture handler (works in mobile browsers & Android APK)
  useEffect(() => {
    const THRESHOLD = 75;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 5 || isRefreshing) {
        touchStartYRef.current = null;
        return;
      }
      // Ignore touches inside open modals/dialogs
      const target = e.target as HTMLElement | null;
      if (target?.closest('[role="dialog"], [role="alertdialog"]')) {
        touchStartYRef.current = null;
        return;
      }
      touchStartYRef.current = e.touches[0].clientY;
      isPullingRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current === null || isRefreshing) return;
      if (window.scrollY > 5) {
        touchStartYRef.current = null;
        setPullDistance(0);
        return;
      }
      const deltaY = e.touches[0].clientY - touchStartYRef.current;
      if (deltaY > 12) {
        isPullingRef.current = true;
        const damped = Math.min(110, (deltaY - 12) * 0.55);
        setPullDistance(damped);
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current || touchStartYRef.current === null) {
        setPullDistance(0);
        touchStartYRef.current = null;
        return;
      }
      touchStartYRef.current = null;
      isPullingRef.current = false;

      if (pullDistance >= THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(60);
        window.dispatchEvent(new CustomEvent('zaure-pull-refresh'));
        router.refresh();
        setTimeout(() => {
          window.location.reload();
        }, 350);
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Pull-to-Refresh Indicator Pill */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[60] pointer-events-none transition-transform duration-150"
          style={{ top: `${Math.min(72, Math.max(12, pullDistance))}px` }}
        >
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-primary/30 shadow-lg text-xs font-bold text-primary">
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              style={{ transform: !isRefreshing ? `rotate(${pullDistance * 3}deg)` : undefined }}
            />
            <span>
              {isRefreshing
                ? language === 'ha'
                  ? 'Ana sabuntawa...'
                  : 'Refreshing...'
                : pullDistance >= 75
                ? language === 'ha'
                  ? 'Saki don sabuntawa'
                  : 'Release to refresh'
                : language === 'ha'
                ? 'Ja kasa don sabuntawa'
                : 'Pull down to refresh'}
            </span>
          </div>
        </div>
      )}

      <AppHeader />
      <main className="flex-1">{children}</main>
      <footer className="py-6 md:px-8 bg-background border-t">
        <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} Zaure Connect Africa.{' '}
            {language === 'ha' ? 'Dukkan hakkoki na kiyaye.' : 'All rights reserved.'}
          </p>
          <div className="flex items-center gap-4 font-semibold">
            <a href="/terms" className="hover:text-primary transition-colors">
              {language === 'ha' ? 'Sharuddan Aiki' : 'Terms of Service'}
            </a>
            <span>&middot;</span>
            <a href="/privacy" className="hover:text-primary transition-colors">
              {language === 'ha' ? 'Dokokin Sirri' : 'Privacy Policy'}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
