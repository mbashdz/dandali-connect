// src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { signIn, resetPassword } from '@/lib/firebase/auth';
import { useAuth } from '@/contexts/auth-context';
import { useAppSettings } from '@/contexts/app-settings-context';
import { useToast } from '@/hooks/use-toast';
import { ZaureLogo } from '@/components/icons/dandali-logo';
import { Sparkles, ShieldCheck, Heart, Loader2, Globe } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  const { language, toggleLanguage } = useAppSettings();

  useEffect(() => {
    if (!authLoading && currentUser) {
      router.replace('/');
    }
  }, [currentUser, authLoading, router]);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: language === "ha" ? "Shigar da Email" : "Enter Email Address",
        description:
          language === "ha"
            ? "Da fatan za a shigar da adireshin email dinka da farko don tura link din gyara kalmar sirri."
            : "Please enter your email address first so we can send you a password reset link.",
      });
      return;
    }
    setIsResettingPassword(true);
    try {
      await resetPassword(email.trim());
      toast({
        title: language === "ha" ? "An Tura Link Din Gyara" : "Reset Link Sent",
        description:
          language === "ha"
            ? `Mun tura maka sakon gyara kalmar sirri zuwa ${email}. Duba akwatin sakonka.`
            : `We have sent a password reset link to ${email}. Please check your inbox.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: language === "ha" ? "Kuskure" : "Error",
        description: err.message || "Could not send password reset email.",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast({
        title: language === "ha" ? "Barka da dawowa!" : "Welcome back!",
        description: "Welcome back to Zaure Connect.",
      });
      router.replace('/');
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 relative overflow-hidden">
      {/* Background African geometric ambient glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-2xl rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl relative z-10 overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-amber-500 to-primary" />

        <div className="flex justify-end px-4 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="h-7 px-2.5 rounded-xl text-[11px] font-bold gap-1 text-muted-foreground hover:text-foreground"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>{language === "ha" ? "English" : "Language: EN"}</span>
          </Button>
        </div>

        <CardHeader className="space-y-2 text-center pb-4 pt-1">
          <div className="flex justify-center mb-2">
            <ZaureLogo size="lg" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-foreground">
            {language === "ha" ? "Barka da Dawowa!" : "Welcome Back!"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {language === "ha"
              ? "Shiga domin sada zumunci, raba labarai, da kasuwanci a Zaure Connect."
              : "Log in to connect with friends, share moments, and explore the marketplace."}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="rounded-xl h-11 text-sm bg-background border-border/70"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-foreground">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isResettingPassword}
                  className="text-[11px] font-semibold text-primary hover:underline hover:text-primary/90 flex items-center gap-1"
                >
                  {isResettingPassword && <Loader2 className="w-3 h-3 animate-spin" />}
                  {language === "ha" ? "Mantawa da Kalmar Sirri?" : "Forgot Password?"}
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="rounded-xl h-11 text-sm bg-background border-border/70"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all text-sm mt-2"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : language === "ha" ? 'Shiga' : 'Log In'}
            </Button>
          </form>

          {/* Social Auth Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/80" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-semibold">
                {language === "ha" ? "Ko kuma" : "Or"}
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl font-bold border-border/80 hover:bg-muted/60 transition-all flex items-center justify-center gap-2.5 text-sm"
            disabled={isLoading}
            onClick={async () => {
              setIsLoading(true);
              try {
                const { signInWithGoogle } = await import('@/lib/firebase/auth');
                await signInWithGoogle();
                toast({
                  title: language === "ha" ? "Barka da zuwa!" : "Welcome!",
                  description: "Signed in with Google successfully.",
                });
                router.replace('/');
              } catch (err: any) {
                console.error("Google login failed:", err);
                toast({
                  variant: "destructive",
                  title: "Google Sign-in Failed",
                  description: err.message || "Failed to sign in with Google.",
                });
                setIsLoading(false);
              }
            }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{language === "ha" ? "Ci gaba da Google" : "Continue with Google"}</span>
          </Button>

          {/* Cultural badge */}
          <div className="mt-5 p-3 rounded-2xl bg-muted/60 border border-border/60 flex items-center gap-2.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <span>Afro-centric privacy &middot; Safe Nigerian & African community</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-center space-y-2 pb-6 pt-2 bg-muted/20 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            {language === "ha" ? "Sabon mai amfani?" : "New here?"}{' '}
            <Button variant="link" asChild className="p-0 h-auto text-primary font-bold text-xs hover:underline">
              <Link href="/signup">{language === "ha" ? "Yi Rajista" : "Create Account"}</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
