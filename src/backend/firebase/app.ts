import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore, type Firestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';

const useEmulator = import.meta.env.VITE_FIREBASE_EMULATOR === 'true';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let _app: FirebaseApp | null = null;
let _auth!: Auth;
let _db!: Firestore;
let _storage!: FirebaseStorage;

function ensure() {
  if (_app) return;
  if (!useEmulator && (!config.apiKey || !config.projectId)) {
    throw new Error('Configuration Firebase manquante : renseignez les variables VITE_FIREBASE_* dans votre .env');
  }
  _app = initializeApp(config as Record<string, string>);
  _auth = getAuth(_app);
  // ignoreUndefinedProperties : Firestore rejette les champs `undefined`.
  _db = initializeFirestore(_app, { ignoreUndefinedProperties: true });
  _storage = getStorage(_app);

  if (useEmulator) {
    connectAuthEmulator(_auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(_db, '127.0.0.1', 8080);
    connectStorageEmulator(_storage, '127.0.0.1', 9199);
  }
}

export const firebaseApp = (): FirebaseApp => {
  ensure();
  return _app!;
};
export const auth = (): Auth => {
  ensure();
  return _auth;
};
export const db = (): Firestore => {
  ensure();
  return _db;
};
export const storage = (): FirebaseStorage => {
  ensure();
  return _storage;
};
