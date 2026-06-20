import type { Backend } from './types';

export const BACKEND_KIND: 'mock' | 'firebase' =
  import.meta.env.VITE_BACKEND === 'firebase' ? 'firebase' : 'mock';

/** Sélectionne l'implémentation selon VITE_BACKEND (import différé : le mock
 *  ne charge jamais le SDK Firebase, et inversement). */
export async function createBackend(): Promise<Backend> {
  if (BACKEND_KIND === 'firebase') {
    const { FirebaseBackend } = await import('./firebase/FirebaseBackend');
    return new FirebaseBackend();
  }
  const { MockBackend } = await import('./mock/MockBackend');
  return new MockBackend();
}
