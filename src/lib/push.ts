/* ───────────────────────────────────────────────────────────
   Notifications push (Firebase Cloud Messaging) côté navigateur.
   Volontairement isolé : importé dynamiquement uniquement quand
   l'utilisateur active les notifications (backend Firebase requis).
   ─────────────────────────────────────────────────────────── */
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { firebaseApp } from '../backend/firebase/app';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

/** Le navigateur sait-il recevoir des push (et la clé VAPID est-elle fournie) ? */
export async function pushSupported(): Promise<boolean> {
  try {
    return Boolean(VAPID_KEY) && 'serviceWorker' in navigator && (await isSupported());
  } catch {
    return false;
  }
}

/** Enregistre le service worker FCM dans un scope dédié (coexiste avec le SW PWA). */
async function registerSw(): Promise<ServiceWorkerRegistration> {
  const base = import.meta.env.BASE_URL;
  return navigator.serviceWorker.register(`${base}firebase-messaging-sw.js`, {
    scope: `${base}firebase-cloud-messaging-push-scope`,
  });
}

/**
 * Demande l'autorisation et renvoie le jeton d'appareil FCM.
 * Lève une erreur explicite si non supporté ou refusé.
 */
export async function enablePush(): Promise<string> {
  if (!(await pushSupported())) {
    throw new Error("Les notifications ne sont pas disponibles sur ce navigateur.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error("Autorisation des notifications refusée.");
  }
  const registration = await registerSw();
  const messaging = getMessaging(firebaseApp());
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error("Impossible d'obtenir un jeton de notification.");
  return token;
}

/**
 * Affiche les messages reçus pendant que l'app est au premier plan
 * (les push reçus app fermée sont gérés par firebase-messaging-sw.js).
 * Renvoie une fonction de désabonnement.
 */
export async function listenForeground(): Promise<() => void> {
  if (!(await pushSupported())) return () => {};
  const messaging = getMessaging(firebaseApp());
  const reg = await navigator.serviceWorker.getRegistration(
    `${import.meta.env.BASE_URL}firebase-cloud-messaging-push-scope`,
  );
  return onMessage(messaging, (payload) => {
    const d = payload.data ?? {};
    const title = d.title ?? 'Famille';
    const body = d.body ?? '';
    if (reg) reg.showNotification(title, { body, icon: 'icons/icon-192.png', tag: 'famille' });
    else if (Notification.permission === 'granted') new Notification(title, { body });
  });
}
