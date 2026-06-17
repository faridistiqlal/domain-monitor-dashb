import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const projectRoot = process.cwd()

const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8')

const extractAppVersion = (content) => {
  const match = content.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/)
  return match?.[1] ?? null
}

test('project metadata matches app version source of truth', async () => {
  const [versionContent, packageContent, lockContent] = await Promise.all([
    readText('src/lib/version.ts'),
    readText('package.json'),
    readText('package-lock.json'),
  ])

  const appVersion = extractAppVersion(versionContent)
  assert.ok(appVersion, 'APP_VERSION must be declared in src/lib/version.ts')

  const packageJson = JSON.parse(packageContent)
  const packageLock = JSON.parse(lockContent)

  assert.equal(packageJson.name, 'domain-monitor-dashboard')
  assert.equal(packageJson.version, appVersion)
  assert.equal(packageLock.name, packageJson.name)
  assert.equal(packageLock.version, appVersion)
  assert.equal(packageLock.packages[''].name, packageJson.name)
  assert.equal(packageLock.packages[''].version, appVersion)
})

test('documentation version markers match app version source of truth', async () => {
  const versionContent = await readText('src/lib/version.ts')
  const appVersion = extractAppVersion(versionContent)
  assert.ok(appVersion, 'APP_VERSION must be declared in src/lib/version.ts')

  const checks = [
    {
      file: 'README.md',
      pattern: new RegExp(`^- Current Version: ${appVersion}$`, 'm'),
      label: 'README current version',
    },
    {
      file: 'docs/NOW.md',
      pattern: new RegExp(`^\\*\\*Current Version:\\*\\* ${appVersion}\\b`, 'm'),
      label: 'NOW current version',
    },
    {
      file: 'docs/GUIDES.md',
      pattern: new RegExp(`^\\*\\*Version:\\*\\* ${appVersion}\\s*$`, 'm'),
      label: 'GUIDES header version',
    },
    {
      file: 'docs/GUIDES.md',
      pattern: new RegExp(`^\\*\\*App Version:\\*\\* ${appVersion}\\s*$`, 'm'),
      label: 'GUIDES footer app version',
    },
    {
      file: 'docs/CHANGELOG.md',
      pattern: new RegExp(`^## Version ${appVersion}\\b`, 'm'),
      label: 'CHANGELOG release heading',
    },
  ]

  for (const check of checks) {
    const content = await readText(check.file)
    assert.match(content, check.pattern, check.label)
  }
})
