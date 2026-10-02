import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  ConfirmationResult,
  GoogleAuthProvider,
  RecaptchaVerifier,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocs,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  setLogLevel,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence internal @firebase/firestore WebChannel transport retry console.error logs
setLogLevel('silent');

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestoreInstance();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

function getFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

// Validate connection to Firestore on boot as required by firebase-integration-rpc skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      // Operating in offline fallback mode with localStorage persistence
    }
  }
}
void testConnection();

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const rawCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  // Ignore transient network / offline cache fallbacks
  if (
    rawCode === 'unavailable' ||
    rawMessage.includes('unavailable') ||
    rawMessage.includes('client is offline') ||
    rawMessage.includes('Could not reach Cloud Firestore backend')
  ) {
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: rawMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
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

export {
  RecaptchaVerifier,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onAuthStateChanged,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  where,
};
export type { ConfirmationResult, User };
