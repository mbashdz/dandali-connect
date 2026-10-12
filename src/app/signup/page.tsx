// src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { signUp } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { DandaliLogo } from '@/components/icons/dandali-logo';
import { Sparkles, Users, Store, Heart } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await signUp(email, password, name);
      toast({ title: "Barka da zuwa Dandali!", description: "Welcome to Dandali Connect!" });
      router.push('/');
    } catch (error: any) {
      console.error('Signup failed:', error);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 relative overflow-hidden">
      {/* African ambient glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-2xl rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl relative z-10 overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-amber-500 to-secondary" />

        <CardHeader className="space-y-2 text-center pb-4 pt-6">
          <div className="flex justify-center mb-2">
            <DandaliLogo size="lg" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-foreground">
            Bude Sabon Asusu
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Join the premier social network connecting the Hausa and African communities.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-foreground">
                Sunanka (Full Name)
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. Sani Bello"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                className="rounded-xl h-11 text-sm bg-background border-border/70"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="sani@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="rounded-xl h-11 text-sm bg-background border-border/70"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a secure password"
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
              {isLoading ? 'Creating Account...' : 'Yi Rajista (Create Account)'}
            </Button>
          </form>

          {/* Value Props */}
          <div className="grid grid-cols-3 gap-2 mt-5 text-center">
            <div className="p-2 rounded-xl bg-muted/60">
              <Users className="w-4 h-4 text-primary mx-auto mb-1" />
              <span className="text-[10px] font-bold block text-foreground">Community</span>
            </div>
            <div className="p-2 rounded-xl bg-muted/60">
              <Store className="w-4 h-4 text-secondary mx-auto mb-1" />
              <span className="text-[10px] font-bold block text-foreground">Kasuwa</span>
            </div>
            <div className="p-2 rounded-xl bg-muted/60">
              <Heart className="w-4 h-4 text-red-500 mx-auto mb-1" />
              <span className="text-[10px] font-bold block text-foreground">Kauna</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-center space-y-2 pb-6 pt-2 bg-muted/20 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            Kuna da asusu tuni? (Already have an account?){' '}
            <Button variant="link" asChild className="p-0 h-auto text-primary font-bold text-xs hover:underline">
              <Link href="/login">Shiga (Log in)</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
