#!/usr/bin/env node
// Quick check: domain notification flags + recent status
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

const app = initializeApp({
  apiKey: "AIzaSyDsONdN5q1vz5Gp6Irk0K7T4-GexuJ6Meo",
  authDomain: "kendal-monitor.firebaseapp.com",
  projectId: "kendal-monitor",
  storageBucket: "kendal-monitor.firebasestorage.app",
  messagingSenderId: "769565947746",
  appId: "1:769565947746:web:90ae2c85d894b0da44de3b",
})
const db = getFirestore(app)

const snap = await getDoc(doc(db, 'domains', 'default-user'))
if (!snap.exists()) { console.log('No domains doc'); process.exit(1) }

const domains = snap.data().domains || []
console.log(`Total domains: ${domains.length}\n`)

const nonOnline = []
domains.forEach((d, i) => {
  const notif = d.notificationsEnabled !== undefined ? d.notificationsEnabled : 'undefined (default=true)'
  const monitoring = d.monitoringEnabled !== undefined ? d.monitoringEnabled : 'undefined'
  const line = `[${String(i+1).padStart(2)}] ${d.url.padEnd(45)} status=${(d.status||'?').padEnd(10)} notif=${String(notif).padEnd(10)} monitoring=${monitoring}`
  console.log(line)
  if (d.status && d.status !== 'online') nonOnline.push(d)
})

console.log(`\n--- Non-online domains: ${nonOnline.length} ---`)
nonOnline.forEach(d => {
  console.log(`  ${d.url} → ${d.status} | error: ${d.error || 'none'} | lastChecked: ${d.lastChecked ? new Date(d.lastChecked).toLocaleString('id-ID', {timeZone:'Asia/Jakarta'}) : '?'}`)
})

process.exit(0)
