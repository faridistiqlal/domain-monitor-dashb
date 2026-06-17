import { readFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();

const readText = async (relativePath) => {
  const absolutePath = path.join(projectRoot, relativePath);
  return readFile(absolutePath, 'utf8');
};

const extractAppVersion = (content) => {
  const match = content.match(/APP_VERSION\s*=\s*['\"]([^'\"]+)['\"]/);
  return match?.[1] ?? null;
};

const checks = [
  {
    file: 'README.md',
    pattern: (version) => new RegExp(`^- Current Version: ${version}$`, 'm'),
    label: 'README current version',
  },
  {
    file: 'docs/NOW.md',
    pattern: (version) => new RegExp(`^\\*\\*Current Version:\\\*\\* ${version}\\b`, 'm'),
    label: 'NOW current version',
  },
  {
    file: 'docs/GUIDES.md',
    pattern: (version) => new RegExp(`^\\*\\*Version:\\\*\\* ${version}\\s*$`, 'm'),
    label: 'GUIDES header version',
  },
  {
    file: 'docs/GUIDES.md',
    pattern: (version) => new RegExp(`^\\*\\*App Version:\\\*\\* ${version}\\s*$`, 'm'),
    label: 'GUIDES footer app version',
  },
  {
    file: 'docs/CHANGELOG.md',
    pattern: (version) => new RegExp(`^## Version ${version}\\b`, 'm'),
    label: 'CHANGELOG release heading',
  },
];

const run = async () => {
  const versionFile = 'src/lib/version.ts';
  const versionContent = await readText(versionFile);
  const appVersion = extractAppVersion(versionContent);

  if (!appVersion) {
    console.error(`❌ Tidak bisa membaca APP_VERSION dari ${versionFile}`);
    process.exit(1);
  }

  const failures = [];

  for (const check of checks) {
    const content = await readText(check.file);
    const regex = check.pattern(appVersion);

    if (!regex.test(content)) {
      failures.push(`${check.label} tidak sinkron di ${check.file} (expected: ${appVersion})`);
    }
  }

  if (failures.length > 0) {
    console.error(`❌ Version consistency check gagal untuk APP_VERSION ${appVersion}`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`✅ Semua marker versi sinkron dengan APP_VERSION ${appVersion}`);
};

run().catch((error) => {
  console.error('❌ Gagal menjalankan check-doc-version-consistency:', error.message);
  process.exit(1);
});
