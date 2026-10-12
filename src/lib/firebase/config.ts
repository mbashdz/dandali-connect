// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Added
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0pLxKSxGc9W7yb9UezzlddlrkpI2UlKQ",
  authDomain: "dandali-d54a8.firebaseapp.com",
  projectId: "dandali-d54a8",
  storageBucket: "dandali-d54a8.firebasestorage.app",
  messagingSenderId: "445883547471",
  appId: "1:445883547471:web:2280907ce001c6dacccf3a",
  measurementId: "G-6RJZTL2B36"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Added
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;


export { app, auth, db, storage, analytics }; // Added storage to exports