import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const originalFetch = globalThis.fetch
const originalWindow = globalThis.window
const originalAllowedBaseDomain = globalThis.__monitoringTestAllowedBaseDomain
const originalGetCurrentIdToken = globalThis.__monitoringTestGetCurrentIdToken

const loadMonitoringModule = async (allowedBaseDomain = 'kendalkab.go.id') => {
  globalThis.__monitoringTestAllowedBaseDomain = allowedBaseDomain
  globalThis.__monitoringTestGetCurrentIdToken = async () => 'test-token'

  const source = await readFile(new URL('../src/lib/monitoring.ts', import.meta.url), 'utf8')
  const testableSource = source
    .replace("import { DomainStatus } from './types'\n", '')
    .replace(
      "import { getCurrentIdToken } from './firebase-auth'",
      'const getCurrentIdToken = globalThis.__monitoringTestGetCurrentIdToken',
    )
    .replace(
      "import.meta.env.VITE_ALLOWED_BASE_DOMAIN",
      'globalThis.__monitoringTestAllowedBaseDomain',
    )

  const transpiled = ts.transpileModule(testableSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText

  const encoded = Buffer.from(transpiled, 'utf8').toString('base64')
  return import(`data:text/javascript;base64,${encoded}#${Date.now()}-${Math.random()}`)
}

const createFetchMock = (handlers) => {
  const calls = []

  const fetchMock = async (url, options = {}) => {
    calls.push({ url: String(url), options })
    const handler = handlers.shift()

    if (!handler) {
      throw new Error(`Unexpected fetch call: ${url}`)
    }

    return handler(url, options)
  }

  fetchMock.calls = calls
  return fetchMock
}

const dnsResponse = (ipAddress) => ({
  json: async () => ({
    Answer: ipAddress ? [{ data: ipAddress }] : [],
  }),
})

const noCorsResponse = () => ({
  status: 0,
})

test.afterEach(() => {
  globalThis.fetch = originalFetch
  globalThis.window = originalWindow
  globalThis.__monitoringTestAllowedBaseDomain = originalAllowedBaseDomain
  globalThis.__monitoringTestGetCurrentIdToken = originalGetCurrentIdToken
})

test('validates and normalizes allowed Kendal domains', async () => {
  const { normalizeDomain, validateDomain } = await loadMonitoringModule()

  assert.deepEqual(validateDomain('new.kendalkab.go.id'), { valid: true })
  assert.deepEqual(validateDomain('https://kendalkab.go.id/'), { valid: true })
  assert.deepEqual(validateDomain('example.com'), {
    valid: false,
    error: 'Hanya domain kendalkab.go.id atau subdomain-nya yang diperbolehkan',
  })
  assert.equal(normalizeDomain(' https://new.kendalkab.go.id/ '), 'new.kendalkab.go.id')
})

test('marks a DNS-resolvable and HTTP-accessible domain as online', async () => {
  const { checkDomainStatus } = await loadMonitoringModule()
  globalThis.fetch = createFetchMock([
    async () => dnsResponse('103.162.68.183'),
    async () => noCorsResponse(),
  ])

  const result = await checkDomainStatus('new.kendalkab.go.id', 'domain-1')

  assert.equal(result.id, 'domain-1')
  assert.equal(result.status, 'online')
  assert.equal(result.httpAccessible, true)
  assert.equal(result.dnsResolvable, true)
  assert.equal(result.ipAddress, '103.162.68.183')
  assert.equal(result.protocol, 'https')
  assert.equal(result.error, undefined)
})

test('marks a DNS-resolvable domain with SSL failure and no fallback access as dns-only', async () => {
  const { checkDomainStatus } = await loadMonitoringModule()
  globalThis.fetch = createFetchMock([
    async () => dnsResponse('103.162.68.183'),
    async () => {
      throw new Error('net::ERR_CERT_DATE_INVALID')
    },
    async () => {
      throw new Error('net::ERR_CERT_DATE_INVALID')
    },
    async () => {
      throw new Error('net::ERR_CONNECTION_REFUSED')
    },
    async () => {
      throw new Error('net::ERR_CONNECTION_REFUSED')
    },
  ])

  const result = await checkDomainStatus('new.kendalkab.go.id', 'domain-ssl')

  assert.equal(result.status, 'dns-only')
  assert.equal(result.httpAccessible, false)
  assert.equal(result.dnsResolvable, true)
  assert.equal(result.ipAddress, '103.162.68.183')
  assert.match(result.error, /Sertifikat SSL Kadaluarsa/)
})

test('marks an unreachable domain as offline when DNS and HTTP fail', async () => {
  const { checkDomainStatus } = await loadMonitoringModule()
  globalThis.fetch = createFetchMock([
    async () => dnsResponse(undefined),
    async () => {
      throw new Error('net::ERR_NAME_NOT_RESOLVED')
    },
    async () => {
      throw new Error('net::ERR_NAME_NOT_RESOLVED')
    },
    async () => {
      throw new Error('net::ERR_NAME_NOT_RESOLVED')
    },
    async () => {
      throw new Error('net::ERR_NAME_NOT_RESOLVED')
    },
  ])

  const result = await checkDomainStatus('missing.kendalkab.go.id', 'domain-missing')

  assert.equal(result.status, 'offline')
  assert.equal(result.httpAccessible, false)
  assert.equal(result.dnsResolvable, false)
  assert.equal(result.ipAddress, undefined)
  assert.equal(result.error, 'DNS tidak dapat di-resolve')
})
