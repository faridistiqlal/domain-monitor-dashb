import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyDsONdN5q1vz5Gp6Irk0K7T4-GexuJ6Meo',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'kendal-monitor.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'kendal-monitor',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'kendal-monitor.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '769565947746',
  appId: process.env.FIREBASE_APP_ID || '1:769565947746:web:90ae2c85d894b0da44de3b',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-C3RLK090HK',
}

function readArg(flag) {
  const index = process.argv.findIndex((value) => value === flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function hasFlag(flag) {
  return process.argv.includes(flag)
}

const email = readArg('--email') || process.env.FIREBASE_CRON_EMAIL
const password = readArg('--password') || process.env.FIREBASE_CRON_PASSWORD
const skipWriteCheck = hasFlag('--skip-write-check')
const printSharedDocKeys = hasFlag('--print-shared-doc-keys')
const allowInitWriteCheck = hasFlag('--allow-init-write-check')
const forceRewriteSharedDoc = hasFlag('--force-rewrite-shared-doc')
const testUserDocId = readArg('--test-user-doc-id')

if (!email || !password) {
  console.error('\n❌ Missing credentials')
  console.error('   Provide --email and --password, or set FIREBASE_CRON_EMAIL/FIREBASE_CRON_PASSWORD\n')
  console.error('   Example:')
  console.error('   node scripts/verify-admin-auth.mjs --email admin@kendal.local --password "your-password"\n')
  process.exit(2)
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function verify() {
  console.log('\n🔐 Verifying Firebase auth/admin access for cron monitoring toggle...\n')

  let credential
  try {
    credential = await signInWithEmailAndPassword(auth, email, password)
  } catch (error) {
    const authError = error
    console.error('❌ Auth sign-in failed')
    console.error(`   code: ${authError?.code || 'unknown'}`)
    console.error(`   message: ${authError?.message || 'unknown error'}`)
    process.exit(1)
  }

  const uid = credential.user.uid
  console.log(`✅ Auth sign-in success: ${email}`)
  console.log(`   uid: ${uid}`)

  const profileRef = doc(db, 'users', uid)
  const profileSnap = await getDoc(profileRef)

  if (!profileSnap.exists()) {
    console.error('\n❌ users/{authUid} profile not found')
    console.error(`   missing doc: users/${uid}`)
    process.exit(1)
  }

  const profile = profileSnap.data() || {}
  const role = profile.role
  const isActive = profile.isActive

  console.log('\n👤 Access profile')
  console.log(`   role: ${role ?? 'N/A'}`)
  console.log(`   isActive: ${String(isActive)}`)

  if (role !== 'admin' || isActive !== true) {
    console.error('\n❌ Admin requirement not met for monitoring toggle write')
    console.error('   Need: role=admin and isActive=true')
    process.exit(1)
  }

  const sharedUserRef = doc(db, 'users', 'default-user')
  const sharedSnap = await getDoc(sharedUserRef)

  if (!sharedSnap.exists()) {
    console.warn('\n⚠️ users/default-user does not exist yet')
  }

  const sharedData = sharedSnap.exists() ? (sharedSnap.data() || {}) : {}
  const existingControl = sharedData.monitoringControl
  const safeNotificationSettings = (sharedData.notificationSettings && typeof sharedData.notificationSettings === 'object' && !Array.isArray(sharedData.notificationSettings))
    ? sharedData.notificationSettings
    : {
        enabled: false,
        webhookUrl: '',
        notifyOnDown: true,
        notifyOnRecovery: true,
        notifyOnSlow: false,
        slowThreshold: 5,
        cooldownMinutes: 5,
      }
  const hasSafeEchoPayload = !!(
    existingControl
    && typeof existingControl.enabled === 'boolean'
    && typeof existingControl.updatedAt === 'number'
  )

  console.log('\n🧭 Monitoring control snapshot')
  if (printSharedDocKeys) {
    console.log(`   users/default-user keys: ${Object.keys(sharedData).join(', ') || '(empty)'}`)
  }
  if (hasSafeEchoPayload) {
    console.log(`   enabled: ${existingControl.enabled}`)
    console.log(`   updatedAt: ${existingControl.updatedAt}`)
    console.log(`   updatedBy: ${existingControl.updatedBy || 'N/A'}`)
  } else {
    console.log('   not initialized / invalid shape (write-check may alter data)')
  }

  if (testUserDocId) {
    try {
      const targetRef = doc(db, 'users', testUserDocId)
      await setDoc(targetRef, {
        monitoringControl: {
          enabled: true,
          updatedAt: Date.now(),
          updatedBy: uid,
        },
        updatedAt: Date.now(),
      }, { merge: true })

      console.log(`\n✅ Cross-doc write-check passed on users/${testUserDocId}`)
    } catch (error) {
      const writeError = error
      console.error(`\n❌ Cross-doc write-check failed on users/${testUserDocId}`)
      console.error(`   code: ${writeError?.code || 'unknown'}`)
      console.error(`   message: ${writeError?.message || 'unknown error'}`)
      process.exit(1)
    }
  }

  if (skipWriteCheck) {
    console.log('\n⏭️ Write-check skipped (--skip-write-check)')
    console.log('\n✅ Verification finished (auth + role + read checks passed).\n')
    return
  }

  if (!hasSafeEchoPayload) {
    if (forceRewriteSharedDoc) {
      try {
        await setDoc(sharedUserRef, {
          notificationSettings: safeNotificationSettings,
          monitoringControl: {
            enabled: true,
            updatedAt: Date.now(),
            updatedBy: uid,
          },
          updatedAt: Date.now(),
        })

        console.log('\n✅ Force rewrite-check passed (users/default-user rewritten with allowed schema).')
        console.log('\n✅ Verification finished successfully.\n')
        return
      } catch (error) {
        const writeError = error
        console.error('\n❌ Force rewrite-check failed for users/default-user')
        console.error(`   code: ${writeError?.code || 'unknown'}`)
        console.error(`   message: ${writeError?.message || 'unknown error'}`)
        process.exit(1)
      }
    }

    if (allowInitWriteCheck) {
      try {
        await setDoc(sharedUserRef, {
          monitoringControl: {
            enabled: true,
            updatedAt: Date.now(),
            updatedBy: uid,
          },
          notificationSettings: safeNotificationSettings,
          updatedAt: Date.now(),
        }, { merge: true })

        console.log('\n✅ Init write-check passed (monitoringControl initialized successfully).')
        console.log('\n✅ Verification finished successfully.\n')
        return
      } catch (error) {
        const writeError = error
        console.error('\n❌ Init write-check failed for users/default-user')
        console.error(`   code: ${writeError?.code || 'unknown'}`)
        console.error(`   message: ${writeError?.message || 'unknown error'}`)
        process.exit(1)
      }
    }

    console.log('\n⚠️ Non-invasive write-check skipped because monitoringControl is not initialized.')
    console.log('   Run with --skip-write-check, initialize from UI first, or use --allow-init-write-check.')
    console.log('\n✅ Verification finished (auth + role + read checks passed).\n')
    return
  }

  try {
    await setDoc(sharedUserRef, {
      monitoringControl: {
        enabled: existingControl.enabled,
        updatedAt: existingControl.updatedAt,
        updatedBy: existingControl.updatedBy || uid,
      },
      updatedAt: typeof sharedData.updatedAt === 'number' ? sharedData.updatedAt : Date.now(),
    }, { merge: true })

    console.log('\n✅ Non-invasive write-check passed (users/default-user writable by this account).')
    console.log('\n✅ Verification finished successfully.\n')
  } catch (error) {
    const writeError = error
    console.error('\n❌ Write-check failed for users/default-user')
    console.error(`   code: ${writeError?.code || 'unknown'}`)
    console.error(`   message: ${writeError?.message || 'unknown error'}`)
    process.exit(1)
  }
}

verify()
  .catch((error) => {
    console.error('\n❌ Unexpected failure:', error)
    process.exit(1)
  })
  .finally(async () => {
    await signOut(auth).catch(() => undefined)
  })
