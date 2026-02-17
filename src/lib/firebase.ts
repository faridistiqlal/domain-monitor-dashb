import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsONdN5q1vz5Gp6Irk0K7T4-GexuJ6Meo",
  authDomain: "kendal-monitor.firebaseapp.com",
  projectId: "kendal-monitor",
  storageBucket: "kendal-monitor.firebasestorage.app",
  messagingSenderId: "769565947746",
  appId: "1:769565947746:web:90ae2c85d894b0da44de3b",
  measurementId: "G-C3RLK090HK"
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

// Collection names
export const COLLECTIONS = {
  DOMAINS: 'domains',
  GROUPS: 'groups',
  TAGS: 'tags',
  USERS: 'users',
  AUDIT_LOGS: 'audit-logs'
} as const
