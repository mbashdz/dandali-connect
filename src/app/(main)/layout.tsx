import type { PropsWithChildren } from 'react';
import { AppHeader } from '@/components/layout/app-header';

export default function MainAppLayout({ children }: PropsWithChildren) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1">{children}</main>
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
