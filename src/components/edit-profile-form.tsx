// src/components/edit-profile-form.tsx
'use client';

import { useState, useRef } from 'react';
import type { FC } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { uploadFile } from '@/lib/firebase/storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CameraCaptureModal } from '@/components/camera-capture-modal';
import { useToast } from '@/hooks/use-toast';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(50),
  bio: z.string().max(160, { message: 'Bio cannot exceed 160 characters.' }).optional().or(z.literal('')),
  location: z.string().max(50, { message: 'Location cannot exceed 50 characters.' }).optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  avatarUrl: z.string().optional().or(z.literal('')),
  coverPhotoUrl: z.string().optional().or(z.literal('')),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileFormProps {
  user: User;
  onSave: (data: ProfileFormValues) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export const EditProfileForm: FC<EditProfileFormProps> = ({ user, onSave, onCancel, isSaving }) => {
  const { toast } = useToast();
  const [currentAvatar, setCurrentAvatar] = useState(user.avatarUrl || '');
  const [currentCover, setCurrentCover] = useState(user.coverPhotoUrl || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSelfieCameraOpen, setIsSelfieCameraOpen] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || '',
      bio: user.bio || '',
      location: user.location || '',
      website: user.website || '',
      avatarUrl: user.avatarUrl || '',
      coverPhotoUrl: user.coverPhotoUrl || '',
    },
  });

  const uploadAvatarFile = async (file: File) => {
    if (!user.uid) return;
    setIsUploadingPhoto(true);
    try {
      const url = await uploadFile(file, `avatars/${user.uid}`);
      setCurrentAvatar(url);
      form.setValue('avatarUrl', url);
      toast({ title: 'Photo Uploaded', description: 'Profile photo attached. Click Save Changes to confirm.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadAvatarFile(e.target.files[0]);
    }
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user.uid) {
      const file = e.target.files[0];
      setIsUploadingCover(true);
      try {
        const url = await uploadFile(file, `covers/${user.uid}`);
        setCurrentCover(url);
        form.setValue('coverPhotoUrl', url);
        toast({ title: 'Cover Uploaded', description: 'Cover banner attached. Click Save Changes to confirm.' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
      } finally {
        setIsUploadingCover(false);
      }
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    await onSave({
      ...data,
      avatarUrl: currentAvatar || data.avatarUrl,
      coverPhotoUrl: currentCover || data.coverPhotoUrl,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Avatar & Cover Upload Preview */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-muted/40 border">
          <div className="flex items-center gap-3">
            <Avatar className="w-16 h-16 border-2 border-primary/50">
              <AvatarImage src={currentAvatar} alt={user.name} />
              <AvatarFallback className="font-bold bg-primary/10 text-primary">
                {user.name?.slice(0, 2).toUpperCase() || 'ZC'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingPhoto || isUploadingCover || isSaving}
                onClick={() => avatarFileRef.current?.click()}
                className="rounded-xl text-xs font-bold gap-1.5 h-8"
              >
                {isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                Gallery Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingPhoto || isUploadingCover || isSaving}
                onClick={() => setIsSelfieCameraOpen(true)}
                className="rounded-xl text-xs font-bold gap-1.5 h-8 border-emerald-500/40 hover:bg-emerald-500/10"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-500" />
                Take Selfie
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingPhoto || isUploadingCover || isSaving}
                onClick={() => coverFileRef.current?.click()}
                className="rounded-xl text-xs font-bold gap-1.5 h-8"
              >
                {isUploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Cover Banner
              </Button>
            </div>
          </div>
          <input
            type="file"
            ref={avatarFileRef}
            onChange={handleAvatarFile}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={coverFileRef}
            onChange={handleCoverFile}
            accept="image/*"
            className="hidden"
          />
        </div>

        <CameraCaptureModal
          isOpen={isSelfieCameraOpen}
          onClose={() => setIsSelfieCameraOpen(false)}
          defaultFacingMode="user"
          onCapture={uploadAvatarFile}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold">Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} className="rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold">Bio</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell the Zaure Connect community about yourself" className="resize-none rounded-xl" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold">City / Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Kano, Nigeria" {...field} className="rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold">Website / Link</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} className="rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving || isUploadingPhoto} className="rounded-xl">
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || isUploadingPhoto} className="rounded-xl bg-primary text-primary-foreground font-bold shadow">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
};
