import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Firebase configuration
// TODO: Ganti dengan Firebase config Anda sendiri dari https://console.firebase.google.com/
// Untuk sekarang pakai demo - data akan hilang setelah beberapa jam
const firebaseConfig = {
  apiKey: "AIzaSyBTEMPORARY_DEMO_KEY_FOR_TESTING_ONLY",
  authDomain: "kendal-monitor-demo.firebaseapp.com",
  projectId: "kendal-monitor-demo",
  storageBucket: "kendal-monitor-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:demo123456789"
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
  USERS: 'users'
} as const
