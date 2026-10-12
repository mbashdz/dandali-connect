import React from "react";
import Link from "next/link";
import { DandaliLogo } from "@/components/icons/dandali-logo";
import { ShieldCheck, ArrowLeft, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms of Service • Dandali Connect",
  description: "Terms and conditions for Dandali Connect users across Africa.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <DandaliLogo size="md" />
          </Link>
          <Button asChild variant="ghost" size="sm" className="rounded-xl gap-1">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" /> Back to Feed
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <FileText className="w-4 h-4" /> Last Updated: October 2026
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Dandali Connect Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Maraba (Welcome) to Dandali Connect. By creating an account or using our platform, you agree to these Terms. Dandali Connect is built to celebrate and foster respectful, vibrant African communities.
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert space-y-6 text-foreground/90">
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">1. Eligibility and Accounts</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You must be at least 13 years old to use Dandali Connect. You agree to provide accurate information and safeguard your login credentials. You are responsible for all actions conducted through your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">2. Community Standards & Cultural Respect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Dandali Connect strictly prohibits:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Tribal hate speech, ethnic discrimination, or religious vilification.</li>
              <li>Harassment, threats, and non-consensual sharing of private information.</li>
              <li>Spam, automated bot posting, and misleading impersonation.</li>
              <li>Explicit, pornographic, or violent content that violates community norms.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">3. Dandali Kasuwa (Marketplace) Guidelines</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Dandali Kasuwa connects buyers and sellers. Dandali does not take custody of funds, goods, or escrow. Users must:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Sell only legal, verified items with honest descriptions and pricing.</li>
              <li>Exercise caution when meeting buyers or transferring funds offline.</li>
              <li>Report fraudulent listings immediately via our built-in Report feature.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">4. Content Ownership and License</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You retain all ownership of the text, photos, voice notes, and media you post. By posting, you grant Dandali Connect a non-exclusive license to host, display, and distribute your content across our platform services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">5. Termination & Moderation</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate community safety or these Terms, without prior liability.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">6. Contact Us</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have inquiries regarding these terms, please contact our community support team at <strong className="text-foreground">support@dandaliconnect.com</strong>.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Dandali Connect Africa. All rights reserved.</p>
          <Link href="/privacy" className="text-primary hover:underline font-semibold">
            Privacy Policy &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
