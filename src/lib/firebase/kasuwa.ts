// src/lib/firebase/kasuwa.ts
import { db, auth } from './config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  orderBy, 
  limit, 
  where, 
  serverTimestamp,
  updateDoc 
} from 'firebase/firestore';
import type { KasuwaItem } from '@/types';

export const getKasuwaItems = async (categoryFilter?: string): Promise<KasuwaItem[]> => {
  try {
    const kasuwaRef = collection(db, 'kasuwa');
    let q = query(kasuwaRef, orderBy('createdAt', 'desc'), limit(50));
    
    if (categoryFilter && categoryFilter !== 'all') {
      q = query(kasuwaRef, where('category', '==', categoryFilter), orderBy('createdAt', 'desc'), limit(50));
    }

    const snapshot = await getDocs(q);
    const items: KasuwaItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        id: docSnap.id,
        title: data.title || '',
        description: data.description || '',
        price: Number(data.price) || 0,
        currency: data.currency || 'NGN',
        location: data.location || 'Nigeria',
        category: data.category || 'fashion',
        imageUrl: data.imageUrl || '',
        sellerUid: data.sellerUid || '',
        sellerName: data.sellerName || 'Zaure Seller',
        sellerPhone: data.sellerPhone || '',
        sellerWhatsapp: data.sellerWhatsapp || '',
        sellerAvatarUrl: data.sellerAvatarUrl || '',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        isSold: !!data.isSold,
      });
    });
    return items;
  } catch (error: any) {
    console.error('[getKasuwaItems] Error fetching kasuwa items:', error);
    return [];
  }
};

export const createKasuwaItem = async (
  itemData: Omit<KasuwaItem, 'id' | 'createdAt'>
): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be logged in to list an item.');
  }

  const kasuwaRef = collection(db, 'kasuwa');
  const docRef = await addDoc(kasuwaRef, {
    ...itemData,
    sellerUid: currentUser.uid,
    createdAt: serverTimestamp(),
    isSold: false,
  });

  return docRef.id;
};

export const markKasuwaItemAsSold = async (itemId: string): Promise<void> => {
  const itemRef = doc(db, 'kasuwa', itemId);
  await updateDoc(itemRef, { isSold: true });
};
