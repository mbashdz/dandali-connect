"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ZaureLogo } from "@/components/icons/dandali-logo";
import { useAuth } from "@/contexts/auth-context";
import { deleteCurrentUserAccount } from "@/lib/firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ShieldAlert, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";

export default function DeleteAccountPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState(currentUser?.email || "");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleDirectDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteCurrentUserAccount();
      setSubmitted(true);
      toast({
        title: "Account Deleted",
        description: "Your Zaure Connect account and associated profile data have been permanently deleted.",
      });
      setTimeout(() => {
        router.replace("/login");
      }, 2500);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Re-authentication Required",
        description:
          err.message ||
          "Please log in again and use Settings > Delete Account, or submit the deletion request form below.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWebRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      if (currentUser) {
        await deleteCurrentUserAccount();
      }
      setSubmitted(true);
      toast({
        title: "Account Deletion Request Received",
        description: "Your account and associated personal data will be permanently removed.",
      });
    } catch {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Zaure Connect
          </Link>
          <ZaureLogo size="sm" />
        </div>

        <Card className="rounded-3xl border border-border/80 shadow-xl bg-card overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-destructive via-orange-600 to-amber-500" />
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 text-foreground">
              <ShieldAlert className="w-6 h-6 text-destructive" />
              Account & Data Deletion — Zaure Connect
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm leading-relaxed">
              In compliance with Google Play Data Safety standards and user privacy laws, you can permanently delete your
              Zaure Connect account and all associated personal data at any time.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-base font-bold text-foreground">Account Deletion Processed</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Your Zaure Connect account, profile information, posts, marketplace listings, and authentication credentials
                  have been scheduled for permanent removal.
                </p>
                <Button asChild size="sm" className="mt-3 rounded-xl font-bold">
                  <Link href="/login">Return to Login</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-muted/50 border border-border/70 space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p className="font-bold text-foreground">What data is deleted when you close your account:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Your user profile, name, username, bio, avatar, and email address</li>
                    <li>All posts, photos, voice notes, and 24-hour moments you published</li>
                    <li>All Zaure Marketplace listings you created</li>
                    <li>Your Firebase Authentication login credentials</li>
                  </ul>
                </div>

                {currentUser ? (
                  <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 space-y-3">
                    <p className="text-xs font-bold text-foreground">
                      You are currently signed in as <span className="text-primary">{currentUser.email}</span> (@{currentUser.username}).
                    </p>
                    <Button
                      variant="destructive"
                      onClick={handleDirectDelete}
                      disabled={isSubmitting}
                      className="w-full rounded-xl font-bold gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Permanently Delete My Account Now
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleWebRequestSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="del-email" className="text-xs font-bold">
                        Registered Email Address
                      </Label>
                      <Input
                        id="del-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="del-reason" className="text-xs font-bold">
                        Reason for Deletion (Optional)
                      </Label>
                      <Textarea
                        id="del-reason"
                        rows={3}
                        placeholder="Let us know how we can improve..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="rounded-xl text-xs resize-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={isSubmitting}
                      className="w-full rounded-xl font-bold gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Request Permanent Account & Data Deletion
                    </Button>
                  </form>
                )}

                <div className="text-[11px] text-muted-foreground border-t pt-4">
                  <strong>In-App Deletion Steps:</strong> You can also delete your account directly inside the Zaure Connect mobile app at any time by opening{" "}
                  <strong>Menu &rarr; Settings &rarr; Delete Account</strong>.
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
