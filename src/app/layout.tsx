import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context'; // Import AuthProvider
import { Toaster } from "@/components/ui/toaster";

import { AppSettingsProvider } from '@/contexts/app-settings-context';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Dandali Connect • African Social Network',
  description: 'Connecting communities across Africa with culturally rich social networking, voice posts, moments, and local marketplace.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppSettingsProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </AppSettingsProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
