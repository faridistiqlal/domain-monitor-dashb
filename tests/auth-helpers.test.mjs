import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const loadAuthHelpersModule = async () => {
  const source = await readFile(new URL('../src/lib/auth-helpers.ts', import.meta.url), 'utf8')
  const testableSource = source.replace("import type { ManagedUserRole, UserPermissions } from './types'\n", '')
  const transpiled = ts.transpileModule(testableSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const encoded = Buffer.from(transpiled, 'utf8').toString('base64')
  return import(`data:text/javascript;base64,${encoded}#${Date.now()}-${Math.random()}`)
}

test('maps managed user roles to permissions', async () => {
  const { getPermissionsByRole } = await loadAuthHelpersModule()

  assert.deepEqual(getPermissionsByRole('admin'), {
    canView: true,
    canAddDomain: true,
    canEdit: true,
    canManageUsers: true,
  })
  assert.deepEqual(getPermissionsByRole('add-only'), {
    canView: true,
    canAddDomain: true,
    canEdit: false,
    canManageUsers: false,
  })
  assert.deepEqual(getPermissionsByRole('viewer'), {
    canView: true,
    canAddDomain: false,
    canEdit: false,
    canManageUsers: false,
  })
})

test('detects Firebase auth configuration errors by code or message', async () => {
  const { isAuthConfigurationError } = await loadAuthHelpersModule()

  assert.equal(isAuthConfigurationError({ code: 'auth/configuration-not-found' }), true)
  assert.equal(isAuthConfigurationError({ message: 'CONFIGURATION-NOT-FOUND for project' }), true)
  assert.equal(isAuthConfigurationError({ code: 'auth/invalid-credential' }), false)
})

test('detects Firebase auth email conflicts by code or message', async () => {
  const { isAuthEmailAlreadyInUseError } = await loadAuthHelpersModule()

  assert.equal(isAuthEmailAlreadyInUseError({ code: 'auth/email-already-in-use' }), true)
  assert.equal(isAuthEmailAlreadyInUseError({ message: 'EMAIL-ALREADY-IN-USE' }), true)
  assert.equal(isAuthEmailAlreadyInUseError({ code: 'auth/user-not-found' }), false)
})

test('detects invalid credential auth errors', async () => {
  const { isAuthInvalidCredentialError } = await loadAuthHelpersModule()

  assert.equal(isAuthInvalidCredentialError({ code: 'auth/invalid-credential' }), true)
  assert.equal(isAuthInvalidCredentialError({ code: 'auth/wrong-password' }), true)
  assert.equal(isAuthInvalidCredentialError({ code: 'auth/user-not-found' }), true)
  assert.equal(isAuthInvalidCredentialError({ message: 'INVALID-CREDENTIAL' }), true)
  assert.equal(isAuthInvalidCredentialError({ code: 'auth/email-already-in-use' }), false)
})
