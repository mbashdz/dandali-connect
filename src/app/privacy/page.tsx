import React from "react";
import Link from "next/link";
import { DandaliLogo } from "@/components/icons/dandali-logo";
import { ShieldCheck, ArrowLeft, Lock, Eye, Database, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy • Dandali Connect",
  description: "Privacy policy and data protection for Dandali Connect users across Africa.",
};

export default function PrivacyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <Lock className="w-4 h-4" /> Data Protection & Privacy Standard
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Dandali Connect Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your privacy and cultural trust are paramount to us. This Privacy Policy describes how Dandali Connect collects, uses, and protects your information when you access our web and mobile applications.
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert space-y-6 text-foreground/90">
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">1. Information We Collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We collect information that enables a seamless social experience:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li><strong>Account Information:</strong> Name, username, email address, password hash, and optional profile data (bio, location, website).</li>
              <li><strong>User Content:</strong> Posts, comments, uploaded photos, voice notes (recorded audio), 24-hour Dandali Moments, and Kasuwa marketplace listings.</li>
              <li><strong>Device & Usage Data:</strong> Basic browser type, language preference (English/Hausa), and data-saver preference to minimize mobile data consumption.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">2. How We Use Your Information</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use your data exclusively to:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Authenticate and maintain your secure login session.</li>
              <li>Display your feed, profile, moments, and marketplace items to your followers and fellow community members.</li>
              <li>Provide low-bandwidth optimizations when Data Saver mode is enabled.</li>
              <li>Detect and prevent spam, fraud, harassment, and abuse.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">3. Sharing and Third Parties</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>We never sell your personal data.</strong> Your information is stored on Google Cloud / Firebase infrastructure in accordance with industry-standard encryption protocols. We only share data when required by law or to protect user safety against harm.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">4. Voice Notes & Media Permissions</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Dandali Connect requests microphone access only when you actively tap the Record button to author an oral voice note. Audio recording stops immediately upon pressing Stop.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">5. Your Rights & Data Deletion</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You have the right to edit your profile, delete your posts and listings, or request complete account erasure at any time by contacting our support team.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">6. Contact Our Privacy Officer</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For any privacy questions or requests, please reach us at <strong className="text-foreground">privacy@dandaliconnect.com</strong>.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Dandali Connect Africa. All rights reserved.</p>
          <Link href="/terms" className="text-primary hover:underline font-semibold">
            Terms of Service &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
