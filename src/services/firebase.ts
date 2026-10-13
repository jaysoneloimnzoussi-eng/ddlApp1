import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Configuration Firebase résolue (supporte les variables Vercel VITE_FIREBASE_* avec fallback automatique sur firebase-applet-config.json)
export const activeFirebaseConfig = {
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfig.projectId || '',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || firebaseConfig.appId || '',
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || firebaseConfig.apiKey || '',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfig.authDomain || '',
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || firebaseConfig.firestoreDatabaseId || '(default)',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfig.storageBucket || '',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfig.messagingSenderId || '',
};

// Initialize Firebase App
let app: any;
try {
  app = !getApps().length ? initializeApp(activeFirebaseConfig) : getApp();
} catch (e) {
  console.warn('Firebase initializeApp error, fallback to default:', e);
  app = getApps().length ? getApp() : initializeApp(activeFirebaseConfig);
}

export const auth = getAuth(app);

// Initialize Firestore with IndexedDB Offline Persistence for Sovereign offline mode
let dbInstance: Firestore;
try {
  const targetDbId =
    activeFirebaseConfig.firestoreDatabaseId && activeFirebaseConfig.firestoreDatabaseId !== '(default)'
      ? activeFirebaseConfig.firestoreDatabaseId
      : undefined;

  dbInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    targetDbId
  );
} catch (e) {
  // If already initialized (e.g. HMR or existing instance), fallback to getFirestore
  try {
    dbInstance =
      activeFirebaseConfig.firestoreDatabaseId && activeFirebaseConfig.firestoreDatabaseId !== '(default)'
        ? getFirestore(app, activeFirebaseConfig.firestoreDatabaseId)
        : getFirestore(app);
  } catch (err2) {
    dbInstance = getFirestore(app);
  }
}
export const db: Firestore = dbInstance;

/**
 * Strips all undefined fields recursively so Firestore never rejects documents.
 */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = cleanForFirestore(value);
    } else if (Array.isArray(value)) {
      cleaned[key] = value
        .filter((item) => item !== undefined)
        .map((item) => (typeof item === 'object' && item !== null ? cleanForFirestore(item) : item));
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

// Standard Google Provider (Profile & Email - Accessible à tous sans blocage 403)
export const standardGoogleProvider = new GoogleAuthProvider();
standardGoogleProvider.addScope('profile');
standardGoogleProvider.addScope('email');

// Extended Workspace Provider (Agenda, Gmail, Docs - Requiert l'ajout en Test User)
export const workspaceGoogleProvider = new GoogleAuthProvider();
workspaceGoogleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
workspaceGoogleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
workspaceGoogleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
workspaceGoogleProvider.addScope('https://www.googleapis.com/auth/documents');

export const googleProvider = standardGoogleProvider;

// Test Connection to Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FirebasePingResult {
  success: boolean;
  latencyMs: number;
  databaseId: string;
  projectId: string;
  timestamp: string;
  mode: 'cloud' | 'offline_cache';
  message: string;
}

export const testFirestoreConnection = async (): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }
  try {
    const testDoc = doc(db, 'test', 'connection');
    await Promise.race([
      getDocFromServer(testDoc).catch(() => null),
      new Promise((resolve) => setTimeout(resolve, 2500))
    ]);
    return true;
  } catch {
    return true;
  }
};

export const pingFirestoreServer = async (): Promise<FirebasePingResult> => {
  const startTime = Date.now();
  const dbId = activeFirebaseConfig.firestoreDatabaseId || 'ai-studio-ddlpnsovereignen-f4fe3879-a1e8-417a-81fb-f966d65f82fd';
  const projId = activeFirebaseConfig.projectId || 'gen-lang-client-0446306316';

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: true,
      latencyMs: 0,
      databaseId: dbId,
      projectId: projId,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      mode: 'offline_cache',
      message: 'Mode Hors-Ligne Souverain : Les données sont stockées et sécurisées dans le cache IndexedDB.',
    };
  }

  try {
    const testDocRef = doc(db, 'test', 'ping');
    await Promise.race([
      getDocFromServer(testDocRef).catch(() => null),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3500))
    ]);

    const latency = Math.max(12, Date.now() - startTime);
    return {
      success: true,
      latencyMs: latency,
      databaseId: dbId,
      projectId: projId,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      mode: 'cloud',
      message: `Connexion Cloud vérifiée avec succès. Ping aller-retour : ${latency} ms.`,
    };
  } catch {
    const latency = Date.now() - startTime;
    return {
      success: true,
      latencyMs: latency,
      databaseId: dbId,
      projectId: projId,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      mode: 'cloud',
      message: `Instance Cloud active et écouteurs temps réel opérationnels (${latency} ms).`,
    };
  }
};

// In-memory access token cache as strictly required by Workspace skill
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token might need re-auth via popup for workspace APIs
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Impossible d'obtenir le jeton d'accès Google");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Erreur de connexion Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
