// src/lib/firebase/kasuwa.ts
import { db, auth } from './config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  deleteDoc,
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
        imageUrl: data.imageUrl || (data.imageUrls && data.imageUrls[0]) || '',
        imageUrls: data.imageUrls || (data.imageUrl ? [data.imageUrl] : []),
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
  const payload: Record<string, any> = {
    title: itemData.title,
    description: itemData.description,
    price: Number(itemData.price) || 0,
    currency: itemData.currency || 'NGN',
    location: itemData.location || 'Nigeria',
    category: itemData.category || 'fashion',
    imageUrl: itemData.imageUrl,
    imageUrls: itemData.imageUrls && itemData.imageUrls.length > 0 ? itemData.imageUrls : [itemData.imageUrl],
    sellerUid: currentUser.uid,
    sellerName: itemData.sellerName || 'Zaure Seller',
    sellerPhone: itemData.sellerPhone || '',
    sellerWhatsapp: itemData.sellerWhatsapp || '',
    sellerAvatarUrl: itemData.sellerAvatarUrl || '',
    createdAt: serverTimestamp(),
    isSold: false,
  };

  const docRef = await addDoc(kasuwaRef, payload);
  return docRef.id;
};

export const markKasuwaItemAsSold = async (itemId: string, isSold: boolean = true): Promise<void> => {
  const itemRef = doc(db, 'kasuwa', itemId);
  await updateDoc(itemRef, { isSold });
};

export const updateKasuwaItem = async (
  itemId: string,
  updates: Partial<Pick<KasuwaItem, 'title' | 'description' | 'price' | 'location' | 'category' | 'sellerPhone' | 'sellerWhatsapp'>>
): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Must be logged in to edit a listing.');

  const itemRef = doc(db, 'kasuwa', itemId);
  const cleanUpdates: Record<string, any> = {};
  Object.entries(updates).forEach(([k, v]) => {
    if (v !== undefined) cleanUpdates[k] = v;
  });

  await updateDoc(itemRef, cleanUpdates);
};

export const deleteKasuwaItem = async (itemId: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Must be logged in to delete a listing.');

  const itemRef = doc(db, 'kasuwa', itemId);
  await deleteDoc(itemRef);
};

