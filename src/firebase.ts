import { initializeApp } from 'firebase/app';
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
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
   getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestoreInstance();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

import { getFirestore } from 'firebase/firestore';
function getFirestoreInstance() {
  return getFirestore(app, firebaseConfig.firestoreDatabaseId);
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
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

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
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
