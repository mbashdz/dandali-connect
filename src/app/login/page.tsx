// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { signIn } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { DandaliLogo } from '@/components/icons/dandali-logo';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast({ title: "Barka da dawowa!", description: "Welcome back to Dandali Connect." });
      router.push('/');
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
        
        <CardHeader className="space-y-2 text-center pb-4 pt-6">
          <div className="flex justify-center mb-2">
            <DandaliLogo size="lg" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-foreground">
            Barka da Dawowa!
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Log in to connect with friends, share moments, and explore Kasuwa.
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
              {isLoading ? 'Connecting...' : 'Shiga (Log In)'}
            </Button>
          </form>

          {/* Cultural badge */}
          <div className="mt-5 p-3 rounded-2xl bg-muted/60 border border-border/60 flex items-center gap-2.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <span>Afro-centric privacy &middot; Safe Nigerian & African community</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-center space-y-2 pb-6 pt-2 bg-muted/20 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            Sabon mai amfani? (New here?){' '}
            <Button variant="link" asChild className="p-0 h-auto text-primary font-bold text-xs hover:underline">
              <Link href="/signup">Yi Rajista (Create Account)</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
