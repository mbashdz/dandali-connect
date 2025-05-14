// src/lib/firebase/storage.ts
import { storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid'; // For generating unique file names

/**
 * Uploads a file to Firebase Storage.
 * @param file The file to upload.
 * @param path The path in Firebase Storage where the file should be stored (e.g., 'postImages/').
 * @returns A promise that resolves with the download URL of the uploaded file.
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  console.log(`[uploadFile] Attempting to upload file: ${file.name} to path: ${path}`);
  if (!file) {
    throw new Error("File is required for upload.");
  }

  // Create a unique file name to prevent overwrites
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const storageRef = ref(storage, `${path.endsWith('/') ? path : path + '/'}${uniqueFileName}`);
  
  console.log(`[uploadFile] Uploading to full path: ${storageRef.fullPath}`);
  try {
    const snapshot = await uploadBytes(storageRef, file);
    console.log('[uploadFile] File uploaded successfully. Snapshot:', snapshot);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('[uploadFile] Got download URL:', downloadURL);
    return downloadURL;
  } catch (error: any) {
    console.error("[uploadFile] Error uploading file:", error.message, error.code, error);
    if (error.code === 'storage/unauthorized') {
      console.error("[uploadFile] Firebase Storage permission denied. Check your Storage security rules.");
    }
    throw error;
  }
};
