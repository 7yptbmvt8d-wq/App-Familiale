import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;

export function firebaseApp(): FirebaseApp {
  if (!config.apiKey || !config.projectId) {
    throw new Error(
      'Configuration Firebase manquante : renseignez les variables VITE_FIREBASE_* dans votre .env',
    );
  }
  if (!app) app = initializeApp(config as Record<string, string>);
  return app;
}

export const db = (): Firestore => getFirestore(firebaseApp());
export const auth = (): Auth => getAuth(firebaseApp());
export const storage = (): FirebaseStorage => getStorage(firebaseApp());
