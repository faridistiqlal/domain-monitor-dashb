import type { ManagedUser, ManagedUserRole, UserPermissions } from './types'

interface BootstrapAuthConfig {
  defaultAdminPassword: string
  demoViewerUsername: string
  demoViewerPassword: string
}

export const getPermissionsByRole = (role: ManagedUserRole): UserPermissions => {
  if (role === 'admin') {
    return {
      canView: true,
      canAddDomain: true,
      canEdit: true,
      canManageUsers: true,
    }
  }

  if (role === 'add-only') {
    return {
      canView: true,
      canAddDomain: true,
      canEdit: false,
      canManageUsers: false,
    }
  }

  return {
    canView: true,
    canAddDomain: false,
    canEdit: false,
    canManageUsers: false,
  }
}

export const canBootstrapBaselineAuth = (
  username: string,
  password: string,
  {
    defaultAdminPassword,
    demoViewerUsername,
    demoViewerPassword,
  }: BootstrapAuthConfig,
): boolean => {
  const normalizedUsername = username.trim().toLowerCase()

  if (normalizedUsername === 'admin') {
    return !!defaultAdminPassword && password === defaultAdminPassword
  }

  if (normalizedUsername === demoViewerUsername) {
    return !!demoViewerPassword && password === demoViewerPassword
  }

  return false
}

export const createDefaultAdminUser = (timestamp: number = Date.now()): ManagedUser => ({
  id: 'default-user',
  username: 'admin',
  role: 'admin',
  permissions: getPermissionsByRole('admin'),
  isActive: true,
  revision: 1,
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: 'system',
})

export const createDemoViewerUser = (
  username: string,
  timestamp: number = Date.now(),
): ManagedUser => ({
  id: 'demo-viewer',
  username: username || 'demo',
  role: 'viewer',
  permissions: getPermissionsByRole('viewer'),
  isActive: true,
  revision: 1,
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: 'system',
})

export const isAuthConfigurationError = (error: unknown): boolean => {
  const authError = error as { code?: string; message?: string } | undefined
  return authError?.code === 'auth/configuration-not-found'
    || authError?.message?.toLowerCase().includes('configuration-not-found')
    || false
}

export const isAuthEmailAlreadyInUseError = (error: unknown): boolean => {
  const authError = error as { code?: string; message?: string } | undefined
  return authError?.code === 'auth/email-already-in-use'
    || authError?.message?.toLowerCase().includes('email-already-in-use')
    || false
}

export const isAuthInvalidCredentialError = (error: unknown): boolean => {
  const authError = error as { code?: string; message?: string } | undefined
  return authError?.code === 'auth/invalid-credential'
    || authError?.code === 'auth/wrong-password'
    || authError?.code === 'auth/user-not-found'
    || authError?.message?.toLowerCase().includes('invalid-credential')
    || false
}
