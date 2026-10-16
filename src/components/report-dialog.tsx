"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { submitReport, type ReportCategory } from "@/lib/firebase/reports";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: "post" | "comment" | "kasuwa_item" | "user";
  targetTitle?: string;
}

export function ReportDialog({
  isOpen,
  onClose,
  targetId,
  targetType,
  targetTitle,
}: ReportDialogProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState<ReportCategory>("spam");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reportReasons: { id: ReportCategory; label: string; desc: string }[] = [
    { id: "hate_speech", label: "Hate Speech or Tribal Discrimination", desc: "Attacks against ethnic, tribal, religious, or minority groups" },
    { id: "scam", label: "Fraud or Fake Marketplace Listing", desc: "Misleading pricing, fake goods, advance fee fraud" },
    { id: "spam", label: "Spam or Bot Activity", desc: "Repeated junk posts, fake advertisements, phishing links" },
    { id: "harassment", label: "Harassment or Bullying", desc: "Direct threats, personal attacks, intimidation" },
    { id: "nudity", label: "Inappropriate / Explicit Imagery", desc: "Violates African cultural standards and safety policies" },
    { id: "misinformation", label: "False News or Misinformation", desc: "Spreading dangerously fake community news" },
    { id: "other", label: "Other Policy Violation", desc: "Any other harmful or policy-breaking behavior" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitReport({
        targetId,
        targetType,
        reason,
        details,
        reporterUid: currentUser?.uid,
        reporterUsername: currentUser?.username,
      });
      setSubmitted(true);
      toast({
        title: "Report Received",
        description: "Thank you for keeping Zaure Connect safe. Our community moderation team will review this promptly.",
      });
      setTimeout(() => {
        setSubmitted(false);
        setDetails("");
        onClose();
      }, 2000);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to submit report",
        description: err.message || "Please check your network connection.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl p-6 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            Report Content or Community Violation
          </DialogTitle>
          <DialogDescription className="text-xs">
            Help safeguard the Zaure Connect community. Reports are strictly confidential.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center justify-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-in zoom-in" />
            <h4 className="font-bold text-foreground text-sm">Report Submitted</h4>
            <p className="text-xs text-muted-foreground max-w-xs">
              Thank you for protecting the community.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {targetTitle && (
              <div className="p-2.5 rounded-xl bg-muted/50 border text-xs text-muted-foreground line-clamp-1">
                Reporting: <strong className="text-foreground">{targetTitle}</strong>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">Why are you reporting this?</Label>
              <RadioGroup value={reason} onValueChange={(val) => setReason(val as ReportCategory)} className="space-y-1.5">
                {reportReasons.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                      reason === item.id ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={item.id} id={item.id} className="mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Additional Context (Optional)</Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Share any extra details to help our review..."
                className="text-xs rounded-xl resize-none h-16"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="destructive"
                disabled={isSubmitting}
                className="rounded-xl font-bold"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Submit Report
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
