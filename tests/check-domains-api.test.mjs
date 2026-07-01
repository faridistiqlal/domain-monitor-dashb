import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const originalFetch = globalThis.fetch
const originalFirebaseApiKey = process.env.FIREBASE_API_KEY
const originalViteFirebaseApiKey = process.env.VITE_FIREBASE_API_KEY
const originalAllowedBaseDomain = process.env.ALLOWED_BASE_DOMAIN
const originalViteAllowedBaseDomain = process.env.VITE_ALLOWED_BASE_DOMAIN

const resetRateLimitStore = () => {
  globalThis.__domainMonitorManualRateLimitStore = new Map()
}

const loadHandler = async () => {
  process.env.FIREBASE_API_KEY = 'test-api-key'
  process.env.ALLOWED_BASE_DOMAIN = 'kendalkab.go.id'
  resetRateLimitStore()
  const moduleUrl = `../api/check-domains.js?test=${Date.now()}-${Math.random()}`
  const imported = await import(moduleUrl)
  return imported.default
}

const loadHandlerWithMockDns = async (lookup = async () => ({ address: '103.162.68.183' })) => {
  process.env.FIREBASE_API_KEY = 'test-api-key'
  process.env.ALLOWED_BASE_DOMAIN = 'kendalkab.go.id'
  resetRateLimitStore()
  globalThis.__checkDomainsTestDns = { lookup }
  globalThis.__checkDomainsTestHttps = {
    request: () => {
      let errorHandler = () => {}

      return {
        on(eventName, handler) {
          if (eventName === 'error') {
            errorHandler = handler
          }
        },
        end() {
          errorHandler(new Error('mock no-verify HTTPS unavailable'))
        },
      }
    },
  }

  const source = await readFile(new URL('../api/check-domains.js', import.meta.url), 'utf8')
  const testableSource = source
    .replace(
      'import dns from "node:dns/promises";',
      'const dns = globalThis.__checkDomainsTestDns;',
    )
    .replace(
      'import("node:https").then(({ request }) => {',
      'Promise.resolve(globalThis.__checkDomainsTestHttps).then(({ request }) => {',
    )
  const encoded = Buffer.from(testableSource, 'utf8').toString('base64')
  const imported = await import(`data:text/javascript;base64,${encoded}#${Date.now()}-${Math.random()}`)
  return imported.default
}

const createResponse = () => {
  const response = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value
      return this
    },
    status(statusCode) {
      this.statusCode = statusCode
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
  return response
}

const createRequest = (overrides = {}) => ({
  method: 'POST',
  headers: {},
  body: {},
  socket: { remoteAddress: `127.0.0.${Math.floor(Math.random() * 200) + 1}` },
  ...overrides,
})

const mockValidFirebaseLookup = () => {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ users: [{ localId: 'test-uid' }] }),
  })
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

test.afterEach(() => {
  globalThis.fetch = originalFetch
  delete globalThis.__checkDomainsTestDns
  delete globalThis.__checkDomainsTestHttps
  process.env.FIREBASE_API_KEY = originalFirebaseApiKey
  process.env.VITE_FIREBASE_API_KEY = originalViteFirebaseApiKey
  process.env.ALLOWED_BASE_DOMAIN = originalAllowedBaseDomain
  process.env.VITE_ALLOWED_BASE_DOMAIN = originalViteAllowedBaseDomain
  resetRateLimitStore()
})

test('rejects non-POST requests', async () => {
  const handler = await loadHandler()
  const response = createResponse()

  await handler(createRequest({ method: 'GET' }), response)

  assert.equal(response.statusCode, 405)
  assert.equal(response.headers.Allow, 'POST')
  assert.equal(response.body.error, 'Method not allowed')
})

test('requires bearer authentication', async () => {
  const handler = await loadHandler()
  const response = createResponse()

  await handler(createRequest({ body: { domains: [] } }), response)

  assert.equal(response.statusCode, 401)
  assert.match(response.body.error, /login diperlukan/)
})

test('rejects invalid Firebase tokens', async () => {
  globalThis.fetch = async () => ({ ok: false })
  const handler = await loadHandler()
  const response = createResponse()

  await handler(
    createRequest({
      headers: { authorization: 'Bearer invalid-token' },
      body: { domains: [{ id: 'd1', url: 'new.kendalkab.go.id' }] },
    }),
    response,
  )

  assert.equal(response.statusCode, 401)
  assert.match(response.body.error, /token tidak valid/)
})

test('rejects authenticated requests without domains', async () => {
  mockValidFirebaseLookup()
  const handler = await loadHandler()
  const response = createResponse()

  await handler(
    createRequest({
      headers: { authorization: 'Bearer valid-token' },
      body: { domains: [] },
    }),
    response,
  )

  assert.equal(response.statusCode, 400)
  assert.equal(response.body.error, 'domains wajib diisi')
})

test('rejects authenticated requests above the per-request domain limit', async () => {
  mockValidFirebaseLookup()
  const handler = await loadHandler()
  const response = createResponse()

  await handler(
    createRequest({
      headers: { authorization: 'Bearer valid-token' },
      body: {
        domains: Array.from({ length: 13 }, (_, index) => ({
          id: `domain-${index}`,
          url: `sub-${index}.kendalkab.go.id`,
        })),
      },
    }),
    response,
  )

  assert.equal(response.statusCode, 413)
  assert.equal(response.body.error, 'Maksimal 12 domain per request')
})

test('returns validation result for domains outside allowed base domain', async () => {
  mockValidFirebaseLookup()
  const handler = await loadHandler()
  const response = createResponse()

  await handler(
    createRequest({
      headers: { authorization: 'Bearer valid-token' },
      body: { domains: [{ id: 'outside', url: 'example.com' }] },
    }),
    response,
  )

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.results.length, 1)
  assert.deepEqual(
    {
      id: response.body.results[0].id,
      status: response.body.results[0].status,
      httpAccessible: response.body.results[0].httpAccessible,
      dnsResolvable: response.body.results[0].dnsResolvable,
      error: response.body.results[0].error,
    },
    {
      id: 'outside',
      status: 'offline',
      httpAccessible: false,
      dnsResolvable: false,
      error: 'Domain tidak valid atau tidak diizinkan',
    },
  )
})

test('returns online result when an allowed domain is reachable over HTTPS', async () => {
  globalThis.fetch = createFetchMock([
    async () => ({
      ok: true,
      json: async () => ({ users: [{ localId: 'test-uid' }] }),
    }),
    async () => ({ status: 200 }),
  ])
  const handler = await loadHandlerWithMockDns()
  const response = createResponse()

  await handler(
    createRequest({
      headers: { authorization: 'Bearer valid-token' },
      body: { domains: [{ id: 'kendal-new', url: 'https://new.kendalkab.go.id/path' }] },
    }),
    response,
  )

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.results.length, 1)
  assert.deepEqual(
    {
      id: response.body.results[0].id,
      status: response.body.results[0].status,
      ipAddress: response.body.results[0].ipAddress,
      httpAccessible: response.body.results[0].httpAccessible,
      dnsResolvable: response.body.results[0].dnsResolvable,
      protocol: response.body.results[0].protocol,
    },
    {
      id: 'kendal-new',
      status: 'online',
      ipAddress: '103.162.68.183',
      httpAccessible: true,
      dnsResolvable: true,
      protocol: 'https',
    },
  )
  assert.equal(globalThis.fetch.calls[1].url, 'https://new.kendalkab.go.id')
  assert.equal(globalThis.fetch.calls[1].options.method, 'HEAD')
})

test('returns online result when HTTPS fails but HTTP fallback is reachable', async () => {
  globalThis.fetch = createFetchMock([
    async () => ({
      ok: true,
      json: async () => ({ users: [{ localId: 'test-uid' }] }),
    }),
    async () => {
      const error = new Error('connect ECONNREFUSED')
      error.code = 'ECONNREFUSED'
      throw error
    },
    async () => {
      const error = new Error('connect ECONNREFUSED')
      error.code = 'ECONNREFUSED'
      throw error
    },
    async () => ({ status: 200 }),
  ])
  const handler = await loadHandlerWithMockDns()
  const response = createResponse()

  await handler(
    createRequest({
      headers: { authorization: 'Bearer valid-token' },
      body: { domains: [{ id: 'kendal-http', url: 'http-only.kendalkab.go.id' }] },
    }),
    response,
  )

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.results.length, 1)
  assert.deepEqual(
    {
      id: response.body.results[0].id,
      status: response.body.results[0].status,
      ipAddress: response.body.results[0].ipAddress,
      httpAccessible: response.body.results[0].httpAccessible,
      dnsResolvable: response.body.results[0].dnsResolvable,
      protocol: response.body.results[0].protocol,
    },
    {
      id: 'kendal-http',
      status: 'online',
      ipAddress: '103.162.68.183',
      httpAccessible: true,
      dnsResolvable: true,
      protocol: 'http',
    },
  )
  assert.equal(globalThis.fetch.calls[3].url, 'http://http-only.kendalkab.go.id')
  assert.equal(globalThis.fetch.calls[3].options.method, 'HEAD')
})

test('returns dns-only result when DNS resolves but SSL and HTTP checks fail', async () => {
  globalThis.fetch = createFetchMock([
    async () => ({
      ok: true,
      json: async () => ({ users: [{ localId: 'test-uid' }] }),
    }),
    async () => {
      throw new Error('certificate has expired')
    },
    async () => {
      throw new Error('certificate has expired')
    },
    async () => {
      const error = new Error('connect ECONNREFUSED')
      error.code = 'ECONNREFUSED'
      throw error
    },
    async () => {
      const error = new Error('connect ECONNREFUSED')
      error.code = 'ECONNREFUSED'
      throw error
    },
  ])
  const handler = await loadHandlerWithMockDns()
  const response = createResponse()

  await handler(
    createRequest({
      headers: { authorization: 'Bearer valid-token' },
      body: { domains: [{ id: 'kendal-ssl', url: 'ssl-broken.kendalkab.go.id' }] },
    }),
    response,
  )

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.results.length, 1)
  assert.deepEqual(
    {
      id: response.body.results[0].id,
      status: response.body.results[0].status,
      ipAddress: response.body.results[0].ipAddress,
      httpAccessible: response.body.results[0].httpAccessible,
      dnsResolvable: response.body.results[0].dnsResolvable,
      error: response.body.results[0].error,
    },
    {
      id: 'kendal-ssl',
      status: 'dns-only',
      ipAddress: '103.162.68.183',
      httpAccessible: false,
      dnsResolvable: true,
      error: 'certificate has expired',
    },
  )
})

test('rate limits repeated manual check requests by client', async () => {
  mockValidFirebaseLookup()
  const handler = await loadHandler()
  const request = createRequest({
    headers: {
      authorization: 'Bearer valid-token',
      'x-forwarded-for': '203.0.113.10',
    },
    body: { domains: [{ id: 'outside', url: 'example.com' }] },
  })

  const firstResponse = createResponse()
  const secondResponse = createResponse()
  const thirdResponse = createResponse()

  await handler(request, firstResponse)
  await handler(request, secondResponse)
  await handler(request, thirdResponse)

  assert.equal(firstResponse.statusCode, 200)
  assert.equal(secondResponse.statusCode, 200)
  assert.equal(thirdResponse.statusCode, 429)
  assert.equal(thirdResponse.headers['Retry-After'], '60')
  assert.match(thirdResponse.body.error, /Terlalu sering/)
})
