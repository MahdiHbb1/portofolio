import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { projects } from '../src/data/projects.ts';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');
const CLIENT_DIR = path.join(DIST_DIR, 'client');

function walkFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function getConfiguredOpenAiSecrets(): string[] {
  const candidates = new Set<string>();
  const envVal = process.env.OPENAI_API_KEY?.trim();
  if (envVal && envVal.length >= 12 && !envVal.startsWith('your-')) {
    candidates.add(envVal);
  }
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*OPENAI_API_KEY\s*=\s*(.+?)\s*$/);
      if (!m) continue;
      const val = m[1].replace(/^['"]|['"]$/g, '').trim();
      if (val && val.length >= 12 && !val.startsWith('your-')) {
        candidates.add(val);
      }
    }
  }
  return [...candidates];
}

test('OG assets remove og-default.png and keep 12 non-empty og/*.png files', () => {
  assert.equal(
    fs.existsSync(path.join(ROOT, 'public', 'og-default.png')),
    false,
    'stale 0-byte public/og-default.png should be deleted',
  );
  assert.equal(
    fs.existsSync(path.join(CLIENT_DIR, 'og-default.png')),
    false,
    'dist/client/og-default.png should not exist',
  );

  const ogDir = path.join(CLIENT_DIR, 'og');
  assert.equal(fs.existsSync(ogDir), true, 'dist/client/og directory must exist');
  const pngs = fs.readdirSync(ogDir).filter((name) => name.endsWith('.png'));
  assert.equal(pngs.includes('home.png'), true, 'og/home.png must exist');
  assert.equal(pngs.length, 12, `expected 12 OG PNGs (home + 7 projects + 4 writeups), got ${pngs.length}`);

  for (const name of pngs) {
    const stat = fs.statSync(path.join(ogDir, name));
    assert.ok(stat.size > 0, `OG asset ${name} must be non-empty`);
  }
});

test('dist/client preserves v1 profile photo and clickable PKM-KC 2026 certificate PDF', () => {
  const photoPath = path.join(CLIENT_DIR, 'images', 'profile.jpg');
  const certPath = path.join(CLIENT_DIR, 'certificates', 'pkm-kc-2026-medali-perak.pdf');

  assert.equal(fs.existsSync(photoPath), true, 'profile.jpg must be copied to dist/client/images/');
  assert.ok(fs.statSync(photoPath).size > 0, 'profile.jpg must be non-empty');

  assert.equal(fs.existsSync(certPath), true, 'PKM-KC 2026 certificate PDF must be copied to dist/client/certificates/');
  const pdfBytes = fs.readFileSync(certPath);
  assert.ok(pdfBytes.length > 0, 'certificate PDF must be non-empty');
  assert.equal(pdfBytes.subarray(0, 5).toString('ascii'), '%PDF-', 'certificate must have valid PDF header');
});

test('dist/client/index.html renders merged v1/v2 sections, JSON-LD 2026 PKM-KC award, and 7 project links', () => {
  const indexPath = path.join(CLIENT_DIR, 'index.html');
  assert.equal(fs.existsSync(indexPath), true, 'dist/client/index.html must exist');
  const html = fs.readFileSync(indexPath, 'utf8');

  assert.ok(html.includes('pkm-kc-2026-medali-perak.pdf'), 'index.html must link PKM-KC 2026 PDF');
  assert.ok(html.includes('profile.jpg'), 'index.html must reference profile.jpg');
  assert.ok(html.includes('id="gallery"') || html.includes('id=gallery'), 'index.html must include #gallery section');
  assert.ok(html.includes('id="terminal"') || html.includes('id=terminal'), 'index.html must include #terminal section');

  for (const project of projects) {
    const linkPattern = new RegExp(`href="/projects/${project.id}/?"`);
    assert.match(html, linkPattern, `index.html must link /projects/${project.id}`);
  }

  const ldMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(ldMatch, 'index.html must contain application/ld+json script');
  const ldText = ldMatch[1];
  const ldJson = JSON.parse(ldText) as Array<Record<string, unknown>>;
  const person = ldJson.find((item) => item['@type'] === 'Person');
  assert.ok(person, 'JSON-LD must contain Person entry');
  const awardsText = JSON.stringify(person.award ?? []);
  assert.ok(
    awardsText.includes('PKM-KC') && awardsText.includes('2026'),
    `JSON-LD Person.award must mention 2026 PKM-KC; got ${awardsText}`,
  );
});

test('all 7 project detail pages include preview screenshots showcase and ProjectLayout main container', () => {
  assert.equal(projects.length, 7);
  for (const project of projects) {
    const pagePath = path.join(CLIENT_DIR, 'projects', project.id, 'index.html');
    assert.equal(fs.existsSync(pagePath), true, `missing built page for ${project.id}`);
    const html = fs.readFileSync(pagePath, 'utf8');
    assert.ok(html.includes('project-page__screenshots'), `${project.id} must render .project-page__screenshots`);
    assert.ok(
      /<main\b[^>]*class="[^"]*\bproject-page\b/.test(html),
      `${project.id} must render <main class="project-page">`,
    );
  }
});

test('no OPENAI_API_KEY secret value or client exposure appears anywhere in dist/', () => {
  const secrets = getConfiguredOpenAiSecrets();
  const distFiles = walkFiles(DIST_DIR);
  assert.ok(distFiles.length > 0, 'dist/ must contain built files');

  for (const file of distFiles) {
    const content = fs.readFileSync(file, 'utf8');
    for (const secret of secrets) {
      assert.equal(
        content.includes(secret),
        false,
        `OPENAI_API_KEY secret leaked into ${path.relative(ROOT, file)}`,
      );
    }
    if (file.startsWith(CLIENT_DIR)) {
      assert.equal(
        content.includes('OPENAI_API_KEY') || /sk-proj-[A-Za-z0-9_-]{10,}/.test(content),
        false,
        `client bundle must not contain OPENAI_API_KEY or secret tokens: ${path.relative(ROOT, file)}`,
      );
    }
  }
});
