import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  type User,
  type Unsubscribe,
} from 'firebase/auth'
import { app as primaryFirebaseApp } from './firebase'

const USER_EMAIL_DOMAIN = 'kendal.local'
const SECONDARY_AUTH_APP_NAME = 'kendal-auth-secondary'

export const usernameToEmail = (username: string): string => {
  const normalized = username.trim().toLowerCase()
  return `${normalized}@${USER_EMAIL_DOMAIN}`
}

export const emailToUsername = (email: string): string => {
  const suffix = `@${USER_EMAIL_DOMAIN}`
  return email.toLowerCase().endsWith(suffix)
    ? email.slice(0, email.length - suffix.length)
    : email
}

export const getPrimaryAuth = () => getAuth(primaryFirebaseApp)

const getSecondaryAuth = () => {
  const existing = getApps().find(candidate => candidate.name === SECONDARY_AUTH_APP_NAME)
  const secondaryApp = existing || initializeApp(primaryFirebaseApp.options, SECONDARY_AUTH_APP_NAME)
  return getAuth(secondaryApp)
}

export const signInWithUsernamePassword = async (username: string, password: string): Promise<User> => {
  const auth = getPrimaryAuth()
  const email = usernameToEmail(username)
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export const createAuthUserWithUsername = async (username: string, password: string): Promise<{ uid: string; email: string }> => {
  const secondaryAuth = getSecondaryAuth()
  const email = usernameToEmail(username)
  const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password)

  await signOut(secondaryAuth)

  return {
    uid: credential.user.uid,
    email,
  }
}

export const signInWithUsernamePasswordSecondary = async (username: string, password: string): Promise<{ uid: string; email: string }> => {
  const secondaryAuth = getSecondaryAuth()
  const email = usernameToEmail(username)
  const credential = await signInWithEmailAndPassword(secondaryAuth, email, password)

  await signOut(secondaryAuth)

  return {
    uid: credential.user.uid,
    email,
  }
}

export const signOutAuth = async (): Promise<void> => {
  const auth = getPrimaryAuth()
  await signOut(auth)
}

export const onAuthUserChanged = (callback: (user: User | null) => void): Unsubscribe => {
  const auth = getPrimaryAuth()
  return onAuthStateChanged(auth, callback)
}

export const getCurrentIdToken = async (): Promise<string | null> => {
  const auth = getPrimaryAuth()
  const currentUser = auth.currentUser

  if (!currentUser) {
    return null
  }

  return currentUser.getIdToken()
}

export const changeCurrentUserPassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  const auth = getPrimaryAuth()
  const currentUser = auth.currentUser

  if (!currentUser || !currentUser.email) {
    throw new Error('No authenticated Firebase user')
  }

  const credential = EmailAuthProvider.credential(currentUser.email, oldPassword)
  await reauthenticateWithCredential(currentUser, credential)
  await updatePassword(currentUser, newPassword)
}
