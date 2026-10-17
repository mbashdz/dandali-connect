// src/lib/firebase/messages.ts
import { db, auth } from './config';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { createNotification } from './notifications';
import type { DirectMessage, Conversation, User } from '@/types';

export const getConversationId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};

export const sendDirectMessage = async (
  recipient: User,
  text: string,
  media?: { imageUrl?: string; voiceNoteUrl?: string }
): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Must be logged in to send a direct message.");
  if (!text.trim() && !media?.imageUrl && !media?.voiceNoteUrl) {
    throw new Error("Message cannot be empty.");
  }

  const conversationId = getConversationId(currentUser.uid, recipient.uid);
  const conversationRef = doc(db, 'conversations', conversationId);

  const senderName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Zaure User';
  const senderAvatar = currentUser.photoURL || 'https://placehold.co/100x100.png';

  const summaryText = text.trim()
    || (media?.imageUrl ? "📷 Photo" : "🎙️ Voice Note");

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
    typing: {
      [currentUser.uid]: false,
    },
    lastMessage: summaryText,
    lastSenderUid: currentUser.uid,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // 2. Add message to the messages subcollection
  const messagesSubRef = collection(db, 'conversations', conversationId, 'messages');
  const messagePayload: Record<string, any> = {
    senderUid: currentUser.uid,
    senderName,
    senderAvatarUrl: senderAvatar,
    recipientUid: recipient.uid,
    recipientName: recipient.name,
    text: text.trim(),
    createdAt: serverTimestamp(),
    read: false,
  };
  if (media?.imageUrl) messagePayload.imageUrl = media.imageUrl;
  if (media?.voiceNoteUrl) messagePayload.voiceNoteUrl = media.voiceNoteUrl;

  const messageDoc = await addDoc(messagesSubRef, messagePayload);

  // 3. Send in-app notification to recipient
  try {
    await createNotification(
      recipient.uid,
      'message',
      `sent you a message: "${summaryText.slice(0, 45)}${summaryText.length > 45 ? '...' : ''}"`,
      '/messages'
    );
  } catch (notifErr) {
    console.warn("[sendDirectMessage] Notification dispatch warning:", notifErr);
  }

  return messageDoc.id;
};

export const setTypingStatus = async (conversationId: string, userId: string, isTyping: boolean): Promise<void> => {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await setDoc(convRef, {
      typing: {
        [userId]: isTyping
      }
    }, { merge: true });
  } catch (err) {
    // Non-blocking typing status update
  }
};

export const markConversationMessagesAsRead = async (
  conversationId: string,
  currentUserId: string,
  messages: DirectMessage[]
): Promise<void> => {
  try {
    const unreadFromOther = messages.filter(m => m.recipientUid === currentUserId && !m.read);
    if (unreadFromOther.length === 0) return;

    const batch = writeBatch(db);
    unreadFromOther.forEach(msg => {
      const msgRef = doc(db, 'conversations', conversationId, 'messages', msg.id);
      batch.update(msgRef, { read: true });
    });
    await batch.commit();
  } catch (err) {
    // Non-blocking read receipt update
  }
};

export const subscribeToConversationDoc = (
  conversationId: string,
  onUpdate: (typingMap: Record<string, boolean>) => void
) => {
  const convRef = doc(db, 'conversations', conversationId);
  return onSnapshot(convRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      onUpdate(data.typing || {});
    } else {
      onUpdate({});
    }
  }, () => {
    onUpdate({});
  });
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
        typing: data.typing || {},
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
        text: data.text || '',
        imageUrl: data.imageUrl,
        voiceNoteUrl: data.voiceNoteUrl,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        read: !!data.read,
      });
    });
    onUpdate(msgs);
  }, (err) => {
    console.error("[subscribeToMessages] Error:", err);
  });
};


