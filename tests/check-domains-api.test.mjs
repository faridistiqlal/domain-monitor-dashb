import test from 'node:test'
import assert from 'node:assert/strict'

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

test.afterEach(() => {
  globalThis.fetch = originalFetch
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
