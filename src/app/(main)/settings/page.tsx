// src/app/(main)/settings/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/app-settings-context";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/firebase/users";
import { uploadFile } from "@/lib/firebase/storage";
import { useState, useEffect, useRef } from "react";
import type { User } from "@/types";
import { Loader2, Camera, ShieldCheck, Globe, Wifi, UserCheck, FileText } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, dataSaver, setDataSaver, t } = useAppSettings();
  
  const [name, setName] = useState(currentUser?.name || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [location, setLocation] = useState(currentUser?.location || "");
  const [website, setWebsite] = useState(currentUser?.website || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [hideFollowersCount, setHideFollowersCount] = useState(currentUser?.hideFollowersCount || false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setBio(currentUser.bio || "");
      setLocation(currentUser.location || "");
      setWebsite(currentUser.website || "");
      setAvatarUrl(currentUser.avatarUrl || "");
      setHideFollowersCount(currentUser.hideFollowersCount || false);
    }
  }, [currentUser]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentUser) {
      const file = e.target.files[0];
      setIsUploadingAvatar(true);
      try {
        const downloadUrl = await uploadFile(file, `avatars/${currentUser.uid}`);
        setAvatarUrl(downloadUrl);
        await updateUserProfile(currentUser.uid, { avatarUrl: downloadUrl });
        toast({
          title: "Profile Photo Updated",
          description: "Your new avatar has been saved.",
        });
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: err.message || "Could not upload image.",
        });
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return;
    }
    setIsSaving(true);
    try {
      const updatedData: Partial<User> = {
        name,
        bio,
        location,
        website,
        avatarUrl,
        hideFollowersCount,
      };
      
      await updateUserProfile(currentUser.uid, updatedData);
      toast({ title: "Settings Saved", description: "Your profile information has been successfully updated." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error.message || "Could not save settings." });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="container mx-auto max-w-2xl py-12 px-4 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-3 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {language === "ha" ? "Saitunan Asusu & Bayanina" : "Account Settings & Profile"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {language === "ha"
            ? "Gyara bayananka, hotonka, da abubuwan da ka fi so a Zaure Connect."
            : "Manage your profile, preferences, and data settings across Zaure Connect."}
        </p>
      </div>

      {/* Profile & Avatar Editing */}
      <Card className="shadow-md rounded-3xl border border-border/80 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">
            {language === "ha" ? "Bayanin Bayanina (Profile Info)" : "Public Profile"}
          </CardTitle>
          <CardDescription className="text-xs">
            This information will be displayed to your followers and on your public Zaure Connect profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveChanges} className="space-y-5">
            {/* Avatar upload section */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border/60">
              <div className="relative">
                <Avatar className="w-16 h-16 border-2 border-primary/40 shadow">
                  <AvatarImage src={avatarUrl} alt={name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {name?.slice(0, 2).toUpperCase() || "DC"}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:scale-110 transition-transform"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground">Profile Picture</h4>
                <p className="text-xs text-muted-foreground">
                  Tap camera icon to upload a photo (JPG, PNG).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-foreground">
                  Full Name
                </Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  disabled={isSaving}
                  className="rounded-xl text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-bold text-foreground">
                  Username
                </Label>
                <Input 
                  id="username" 
                  value={`@${currentUser.username}`} 
                  disabled
                  className="rounded-xl text-sm text-muted-foreground bg-muted/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs font-bold text-foreground">
                Bio / Bayanin Kanka
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief introduction about yourself..."
                rows={3}
                disabled={isSaving}
                className="rounded-xl text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-bold text-foreground">
                  Location (City, Country)
                </Label>
                <Input 
                  id="location" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="e.g. Kano, Nigeria"
                  disabled={isSaving}
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-xs font-bold text-foreground">
                  Website or Social Link
                </Label>
                <Input 
                  id="website" 
                  value={website} 
                  onChange={(e) => setWebsite(e.target.value)} 
                  placeholder="https://yourwebsite.com"
                  disabled={isSaving}
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSaving} className="rounded-xl font-bold bg-primary text-primary-foreground shadow">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* App & Cultural Preferences */}
      <Card className="shadow-md rounded-3xl border border-border/80 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Preferences & Data Saver</CardTitle>
          <CardDescription className="text-xs">
            Tune language, data consumption, and alert settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs font-bold text-foreground">Primary Language</p>
                <p className="text-[11px] text-muted-foreground">
                  {language === "ha" ? "Yaren Hausa na aiki" : "English is currently active"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "ha" : "en")}
              className="rounded-xl font-bold text-xs"
            >
              Switch to {language === "en" ? "Hausa" : "English"}
            </Button>
          </div>

          {/* Data Saver Mode Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-secondary" />
              <div>
                <p className="text-xs font-bold text-foreground">Low-Bandwidth Data Saver</p>
                <p className="text-[11px] text-muted-foreground">
                  Compresses feed images and delays media auto-load to save mobile data on 3G/4G.
                </p>
              </div>
            </div>
            <Switch 
              checked={dataSaver} 
              onCheckedChange={setDataSaver}
            />
          </div>

          {/* Privacy: Hide Followers Count */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/20">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs font-bold text-foreground">
                  {language === "ha" ? "Boye Yawan Masoya (Hide Followers Count)" : "Hide Follower Counts to Public"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {language === "ha"
                    ? "Kada a nuna adadin mabiyanka a fili ga sauran masu ziyartar shafinka."
                    : "When enabled, visitors to your profile will not see your follower count."}
                </p>
              </div>
            </div>
            <Switch 
              checked={hideFollowersCount} 
              onCheckedChange={async (val) => {
                setHideFollowersCount(val);
                if (currentUser) {
                  await updateUserProfile(currentUser.uid, { hideFollowersCount: val });
                  toast({
                    title: val ? "Follower Count Hidden" : "Follower Count Visible",
                    description: val ? "Public will no longer see your follower numbers." : "Public can now see your follower numbers.",
                  });
                }
              }}
            />
          </div>

          {/* Notifications Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/20">
            <div>
              <p className="text-xs font-bold text-foreground">Community Notifications</p>
              <p className="text-[11px] text-muted-foreground">
                Receive notifications when people react to your posts or comment on Zaure Connect.
              </p>
            </div>
            <Switch 
              checked={notificationsEnabled} 
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Safety & Legal policies */}
      <Card className="rounded-3xl border border-border/70 bg-card p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Safety & Policies
        </h4>
        <div className="flex flex-wrap gap-4 text-xs font-semibold">
          <Link href="/terms" className="text-primary hover:underline flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Terms of Service
          </Link>
          <Link href="/privacy" className="text-primary hover:underline flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Privacy Policy
          </Link>
        </div>
      </Card>
    </div>
  );
}
