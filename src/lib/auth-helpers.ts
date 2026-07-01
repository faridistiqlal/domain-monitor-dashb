import type { ManagedUserRole, UserPermissions } from './types'

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
