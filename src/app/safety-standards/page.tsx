import React from "react";
import Link from "next/link";
import { ZaureLogo } from "@/components/icons/dandali-logo";
import { ShieldAlert, ArrowLeft, ShieldCheck, Mail, AlertTriangle, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Child Safety & Anti-CSAE Standards • Zaure Connect",
  description: "Zaure Connect's strict standards against child sexual abuse, exploitation, and child endangerment.",
};

export default function SafetyStandardsPage() {
  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <ZaureLogo size="md" />
          </Link>
          <Button asChild variant="ghost" size="sm" className="rounded-xl gap-1">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" /> Back to Feed
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold">
            <ShieldAlert className="w-4 h-4" /> Child Safety Standards & Protection Policy
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Standards Against Child Sexual Abuse and Exploitation (CSAE)
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Zaure Connect is committed to providing a safe, respectful, and trusted digital community. We maintain an absolute zero-tolerance policy regarding child sexual abuse material (CSAM) and child sexual exploitation and abuse (CSAE).
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert space-y-6 text-foreground/90">
          <section className="space-y-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
            <h2 className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" /> Zero Tolerance Statement
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Zaure Connect strictly prohibits any form of child sexual abuse, sexual exploitation, grooming, trafficking, or endangerment of children. Any account found creating, uploading, sharing, promoting, storing, or facilitating content that depicts or encourages the sexual abuse or exploitation of minors will be terminated immediately, and evidence will be preserved and reported to legal authorities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">1. Prohibited Actions & Material</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The following behaviors and content are strictly banned across Zaure Connect posts, stories (Moments), direct messages, profile media, marketplace listings, and comments:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li><strong>Child Sexual Abuse Material (CSAM):</strong> Any visual or audio depiction of a minor engaged in sexually explicit conduct, including AI-generated or synthetic depictions.</li>
              <li><strong>Child Grooming & Predatory Behavior:</strong> Any attempt to build an emotional connection with a minor to lower their inhibitions for sexual abuse or illicit contact.</li>
              <li><strong>Sexualization of Minors:</strong> Any text, image, video, audio, or link that sexualizes, demeans, or solicits sexual material from anyone under 18 years of age.</li>
              <li><strong>Sextortion & Blackmail:</strong> Threatening to release intimate imagery or coercing minors into sharing sensitive photographs.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">2. Proactive Detection & Content Moderation</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We employ automated and manual mechanisms to safeguard our users:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Automated scanning and filtering of user uploads to prevent known illicit media.</li>
              <li>Human review of user-reported violations with immediate quarantine of reported media.</li>
              <li>Rapid response safety triage operating 24/7 for urgent reports involving minor safety.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">3. Reporting Violations & Support Channels</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you encounter or suspect any content or user behavior involving the exploitation of a child:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
              <li>
                <strong>In-App Report:</strong> Tap the three-dot menu on any post, profile, or message and select <em>Report Content</em>. Select the &quot;Child Safety / Exploitation&quot; category.
              </li>
              <li>
                <strong>Dedicated Safety Email:</strong> You can contact our dedicated safety and compliance desk directly at{" "}
                <a href="mailto:safety@zaureconnect.com" className="text-primary underline font-medium">
                  safety@zaureconnect.com
                </a>{" "}
                or{" "}
                <a href="mailto:support@zaureconnect.com" className="text-primary underline font-medium">
                  support@zaureconnect.com
                </a>
                . Reports are treated with the highest priority and investigated within hours.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">4. Cooperation with Law Enforcement & NCMEC</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Zaure Connect cooperates fully with law enforcement agencies and international child protection organizations. When we detect or confirm child sexual abuse material:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>We immediately report the content, user accounts, IP addresses, and metadata to the <strong>National Center for Missing & Exploited Children (NCMEC)</strong> and relevant local and international law enforcement agencies.</li>
              <li>Offenders&apos; access to Zaure Connect is permanently revoked, and device hardware/IP identifiers are blocked from re-registering.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">5. Youth Safety & Privacy Controls</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Zaure Connect enforces strict privacy controls to empower users:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Users can block or mute any user instantly to prevent unsolicited messages.</li>
              <li>Accounts can be deleted at any time with complete data purging through in-app Settings or at{" "}
                <Link href="/delete-account" className="text-primary underline">
                  zaureconnect.com/delete-account
                </Link>.
              </li>
            </ul>
          </section>

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>Last updated: October 2026 • Zaure Connect Trust & Safety</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
              <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
