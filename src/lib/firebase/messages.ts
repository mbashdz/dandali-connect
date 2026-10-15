// src/lib/firebase/messages.ts
import { db, auth } from './config';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { createNotification } from './notifications';
import type { DirectMessage, Conversation, User } from '@/types';

export const getConversationId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};

export const sendDirectMessage = async (
  recipient: User,
  text: string
): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Must be logged in to send a direct message.");
  if (!text.trim()) throw new Error("Message text cannot be empty.");

  const conversationId = getConversationId(currentUser.uid, recipient.uid);
  const conversationRef = doc(db, 'conversations', conversationId);

  const senderName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Dandali User';
  const senderAvatar = currentUser.photoURL || 'https://placehold.co/100x100.png';

  // 1. Update or create the parent conversation document
  await setDoc(conversationRef, {
    id: conversationId,
    participants: [currentUser.uid, recipient.uid],
    participantData: {
      [currentUser.uid]: {
        name: senderName,
        username: currentUser.email?.split('@')[0] || 'user',
        avatarUrl: senderAvatar,
      },
      [recipient.uid]: {
        name: recipient.name,
        username: recipient.username,
        avatarUrl: recipient.avatarUrl || 'https://placehold.co/100x100.png',
      }
    },
    lastMessage: text.trim(),
    lastSenderUid: currentUser.uid,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // 2. Add message to the messages subcollection
  const messagesSubRef = collection(db, 'conversations', conversationId, 'messages');
  const messageDoc = await addDoc(messagesSubRef, {
    senderUid: currentUser.uid,
    senderName,
    senderAvatarUrl: senderAvatar,
    recipientUid: recipient.uid,
    recipientName: recipient.name,
    text: text.trim(),
    createdAt: serverTimestamp(),
    read: false,
  });

  // 3. Send in-app notification to recipient
  try {
    await createNotification(
      recipient.uid,
      'message',
      `Ya aiko maka da sabon sako: "${text.trim().slice(0, 45)}${text.trim().length > 45 ? '...' : ''}"`,
      '/messages'
    );
  } catch (notifErr) {
    console.warn("[sendDirectMessage] Notification dispatch warning:", notifErr);
  }

  return messageDoc.id;
};

export const subscribeToConversations = (
  userId: string,
  onUpdate: (conversations: Conversation[]) => void,
  onError?: (error: any) => void
) => {
  // Query conversations with where clause; sort client-side to prevent composite index blocks
  const convQuery = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(convQuery, (snapshot) => {
    const convos: Conversation[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      convos.push({
        id: docSnap.id,
        participants: data.participants || [],
        participantData: data.participantData || {},
        lastMessage: data.lastMessage || '',
        lastSenderUid: data.lastSenderUid || '',
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
      });
    });

    // Client-side sort by most recently updated
    convos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    onUpdate(convos);
  }, (err) => {
    console.error("[subscribeToConversations] Error:", err);
    if (onError) onError(err);
    else onUpdate([]);
  });
};

export const subscribeToMessages = (
  conversationId: string,
  onUpdate: (messages: DirectMessage[]) => void
) => {
  const msgQuery = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100)
  );

  return onSnapshot(msgQuery, (snapshot) => {
    const msgs: DirectMessage[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      msgs.push({
        id: docSnap.id,
        senderUid: data.senderUid,
        senderName: data.senderName,
        senderAvatarUrl: data.senderAvatarUrl,
        recipientUid: data.recipientUid,
        recipientName: data.recipientName,
        text: data.text,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        read: !!data.read,
      });
    });
    onUpdate(msgs);
  }, (err) => {
    console.error("[subscribeToMessages] Error:", err);
  });
};
