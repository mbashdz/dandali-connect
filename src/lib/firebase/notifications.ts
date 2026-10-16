// src/lib/firebase/notifications.ts
import { db, auth } from './config';
import {
  collection,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';

export interface AppNotification {
  id: string;
  recipientUid: string;
  senderUid: string;
  senderName: string;
  senderAvatarUrl: string;
  type: 'like' | 'comment' | 'follow' | 'message';
  title: string;
  linkUrl: string;
  createdAt: string;
  read: boolean;
}

export const createNotification = async (
  recipientUid: string,
  type: 'like' | 'comment' | 'follow' | 'message',
  title: string,
  linkUrl: string
): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid === recipientUid) return;

  const notifRef = collection(db, 'users', recipientUid, 'notifications');
  await addDoc(notifRef, {
    recipientUid,
    senderUid: currentUser.uid,
    senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Zaure User',
    senderAvatarUrl: currentUser.photoURL || 'https://placehold.co/100x100.png',
    type,
    title,
    linkUrl,
    createdAt: serverTimestamp(),
    read: false,
  });
};

export const subscribeToNotifications = (
  userId: string,
  onUpdate: (notifications: AppNotification[]) => void
) => {
  const notifQuery = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(notifQuery, (snapshot) => {
    const list: AppNotification[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        recipientUid: data.recipientUid,
        senderUid: data.senderUid,
        senderName: data.senderName,
        senderAvatarUrl: data.senderAvatarUrl,
        type: data.type,
        title: data.title,
        linkUrl: data.linkUrl,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        read: !!data.read,
      });
    });
    onUpdate(list);
  }, (err) => {
    console.error("[subscribeToNotifications] Error:", err);
  });
};

export const markNotificationAsRead = async (userId: string, notificationId: string): Promise<void> => {
  try {
    const notifDocRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notifDocRef, { read: true });
  } catch (err) {
    console.warn("[markNotificationAsRead] Error:", err);
  }
};
