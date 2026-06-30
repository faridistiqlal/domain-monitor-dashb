import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const RealDate = Date

const loadCheckHistoryModule = async () => {
  const source = await readFile(new URL('../src/lib/check-history.ts', import.meta.url), 'utf8')
  const testableSource = source
    .replace(
      "import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, writeBatch, Timestamp } from 'firebase/firestore'\n",
      [
        'const collection = () => ({})',
        'const doc = () => ({})',
        'const setDoc = async () => {}',
        'const getDoc = async () => ({ exists: () => false })',
        'const getDocs = async () => ({ docs: [], empty: true, size: 0 })',
        'const query = () => ({})',
        'const where = () => ({})',
        'const limit = () => ({})',
        'const writeBatch = () => ({ set: () => {}, delete: () => {}, commit: async () => {} })',
      ].join('\n') + '\n',
    )
    .replace("import { db } from './firebase'\n", 'const db = {}\n')
    .replace("import type { DomainDailyStats, DomainIncident, HourlyAggregate, Domain, DomainStatus } from './types'\n", '')

  const transpiled = ts.transpileModule(testableSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText

  const encoded = Buffer.from(transpiled, 'utf8').toString('base64')
  return import(`data:text/javascript;base64,${encoded}#${Date.now()}-${Math.random()}`)
}

const freezeTime = (date) => {
  const fixedTime = date.getTime()

  globalThis.Date = class FixedDate extends RealDate {
    constructor(...args) {
      if (args.length > 0) {
        super(...args)
        return
      }

      super(fixedTime)
    }

    static now() {
      return fixedTime
    }

    static parse(value) {
      return RealDate.parse(value)
    }

    static UTC(...args) {
      return RealDate.UTC(...args)
    }
  }
}

test.afterEach(() => {
  globalThis.Date = RealDate
})

test('assigns domains evenly across four monitoring batches', async () => {
  const { assignCheckBatch } = await loadCheckHistoryModule()

  assert.deepEqual(
    Array.from({ length: 10 }, (_, index) => assignCheckBatch(index, 10)),
    [1, 2, 3, 4, 1, 2, 3, 4, 1, 2],
  )
})

test('calculates the next scheduled check minute for each batch', async () => {
  const { getNextCheckTime } = await loadCheckHistoryModule()

  freezeTime(new RealDate(2026, 5, 30, 10, 4, 30, 123))
  assert.equal(new RealDate(getNextCheckTime(1)).getMinutes(), 20)
  assert.equal(new RealDate(getNextCheckTime(2)).getMinutes(), 5)
  assert.equal(new RealDate(getNextCheckTime(3)).getMinutes(), 10)
  assert.equal(new RealDate(getNextCheckTime(4)).getMinutes(), 15)
})

test('rolls the next check time to the next hour after the last slot', async () => {
  const { getNextCheckTime } = await loadCheckHistoryModule()

  freezeTime(new RealDate(2026, 5, 30, 10, 56, 0, 0))
  const nextBatchFourCheck = new RealDate(getNextCheckTime(4))

  assert.equal(nextBatchFourCheck.getHours(), 11)
  assert.equal(nextBatchFourCheck.getMinutes(), 15)
  assert.equal(nextBatchFourCheck.getSeconds(), 0)
  assert.equal(nextBatchFourCheck.getMilliseconds(), 0)
})

test('allows immediate checks for domains without an assigned batch', async () => {
  const { shouldCheckNow } = await loadCheckHistoryModule()

  freezeTime(new RealDate(2026, 5, 30, 10, 12, 0, 0))

  assert.equal(shouldCheckNow({ id: 'd1', url: 'new.kendalkab.go.id' }), true)
})

test('allows batch checks inside the current one-minute schedule window', async () => {
  const { shouldCheckNow } = await loadCheckHistoryModule()

  freezeTime(new RealDate(2026, 5, 30, 10, 19, 30, 0))

  assert.equal(
    shouldCheckNow({ id: 'd1', url: 'new.kendalkab.go.id', checkBatch: 1 }),
    true,
  )
})
