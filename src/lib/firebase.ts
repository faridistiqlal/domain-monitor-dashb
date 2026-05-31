import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const getRequiredEnv = (key: string): string => {
  const value = (import.meta.env[key] || '').toString().trim()
  if (!value) {
    throw new Error(`[Firebase] Missing required environment variable: ${key}`)
  }
  return value
}

const firebaseConfig = {
  apiKey: getRequiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getRequiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getRequiredEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getRequiredEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getRequiredEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getRequiredEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getRequiredEnv('VITE_FIREBASE_MEASUREMENT_ID')
}

export const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)

// Collection names
export const COLLECTIONS = {
  DOMAINS: 'domains',
  GROUPS: 'groups',
  TAGS: 'tags',
  USERS: 'users',
  AUDIT_LOGS: 'audit-logs'
} as const
