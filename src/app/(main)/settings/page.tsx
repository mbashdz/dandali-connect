// src/app/(main)/settings/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/firebase/users";
import { useState, useEffect } from "react";
import type { User } from "@/types";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || ""); // Email is generally not editable this way
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Example setting
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      // Load actual user preferences for notifications if available
    }
  }, [currentUser]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return;
    }
    setIsSaving(true);
    try {
      const updatedData: Partial<User> = {};
      if (name !== currentUser.name) updatedData.name = name;
      // Add other updatable fields here, e.g., notification preferences
      
      if (Object.keys(updatedData).length > 0) {
        await updateUserProfile(currentUser.uid, updatedData);
        toast({ title: "Settings Saved", description: "Your settings have been updated." });
      } else {
        toast({ title: "No Changes", description: "No settings were changed." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error.message || "Could not save settings." });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-2 sm:px-4 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-2 sm:px-4">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Account Settings</CardTitle>
          <CardDescription>Manage your account preferences and settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveChanges} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                disabled // Email usually changed via separate verification process
                className="text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">Email address cannot be changed here.</p>
            </div>
            
            <Separator />

            <h3 className="text-lg font-medium pt-2">Notifications</h3>
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <Label htmlFor="notifications-switch" className="flex flex-col space-y-1">
                    <span>Email Notifications</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Receive email notifications for important updates.
                    </span>
                </Label>
                <Switch 
                    id="notifications-switch" 
                    checked={notificationsEnabled} 
                    onCheckedChange={setNotificationsEnabled}
                    disabled={isSaving}
                />
            </div>
            {/* Add more settings sections here, e.g., Privacy, Theme */}
            
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
