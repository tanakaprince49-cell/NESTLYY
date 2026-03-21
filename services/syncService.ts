import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase.ts';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Debounce helper
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const syncToFirestore = debounce(async (email: string) => {
  if (!auth.currentUser) return;
  
  const path = `users/${auth.currentUser.uid}`;
  try {
    const dataToSync: Record<string, any> = {};
    
    // Collect all local storage keys for this user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${email}_`)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            dataToSync[key] = JSON.parse(value);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    // Save to Firestore
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      uid: auth.currentUser.uid,
      email: email,
      profileData: JSON.stringify(dataToSync),
      updatedAt: Date.now()
    }, { merge: true });
    
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}, 2000);

export const loadFromFirestore = async (email: string) => {
  if (!auth.currentUser) return false;
  
  const path = `users/${auth.currentUser.uid}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.profileData) {
        const parsedData = JSON.parse(data.profileData);
        
        // Restore to local storage
        for (const [key, value] of Object.entries(parsedData)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
        return true;
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return false;
};
