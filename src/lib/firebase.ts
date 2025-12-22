import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function assertFirebaseConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de Firebase: ${missing.join(', ')}. ` +
        `Copia .env.example a .env.local y completa los valores.`
    )
  }
}

export const firebaseApp = (() => {
  if (getApps().length > 0) return getApps()[0]
  assertFirebaseConfig()
  return initializeApp(firebaseConfig)
})()

export const auth = getAuth(firebaseApp)

// Firestore con cache offline (IndexedDB)
export const db = initializeFirestore(firebaseApp, {
  ignoreUndefinedProperties: true,
})

// Best-effort: si el navegador no lo soporta, no rompemos la app.
enableIndexedDbPersistence(db).catch(() => {
  // noop
})

export const storage = getStorage(firebaseApp)
