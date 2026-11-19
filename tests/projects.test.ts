import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { projects, getProjectById, getLocalizedProject } from '../src/data/projects.ts';
import { content } from '../src/data/content.ts';
import { buildPortfolioContext, sanitizeChatHistory } from '../src/utils/portfolioContext.ts';
import { getProjectArticleEntries } from '../src/scripts/article.ts';

test('projects list has 7 canonical kebab-case entries matching page files', () => {
  assert.equal(projects.length, 7);
  const pageDir = path.resolve('src/pages/projects');
  for (const project of projects) {
    assert.match(project.id, /^[a-z0-9-]+$/);
    assert.ok(fs.existsSync(path.join(pageDir, `${project.id}.astro`)), `Missing page for ${project.id}`);
  }
});

test('FraudLens year matches CV (2025) and titles differentiate short UI name vs fullTitle', () => {
  const fraudlens = getProjectById('fraudlens');
  assert.equal(fraudlens?.year, '2025');
  assert.equal(getProjectById('fabric-cnn')?.name, 'Fabric Defect CNN');
  assert.equal(getProjectById('fabric-cnn')?.fullTitle, 'Fabric Defect Detection CNN');
  assert.equal(getProjectById('ctf-writeups')?.name, 'CTF Writeups');
  assert.equal(getProjectById('ctf-writeups')?.fullTitle, 'CTF Writeups Collection');
});

test('Decision 1A: pending projects keep honest placeholder in UI desc while aiSummary stays informative', () => {
  for (const id of ['fraudlens', 'fabric-cnn', 'legalin', 'buktitagih', 'ctf-itsecdevx26']) {
    const p = getProjectById(id)!;
    assert.match(p.desc.id, /Placeholder/i);
    assert.match(p.desc.en, /Placeholder/i);
    assert.ok(p.aiSummary.length > 30 && !/Placeholder/i.test(p.aiSummary));
    assert.equal(content.id.projects.items[id].desc, p.desc.id);
    assert.equal(content.en.projects.items[id].desc, p.desc.en);
  }
});

test('portfolioContext includes PKM-KC 2026 Silver Medal and derives projects from projects.ts', () => {
  const ctx = buildPortfolioContext();
  assert.ok(ctx.achievements.some((a) => /2026/.test(a.date) && /Silver|Perak/i.test(a.title)));
  const ctxFabric = ctx.projects.find((p) => p.id === 'fabric-cnn');
  assert.equal(ctxFabric?.name, 'Fabric Defect Detection CNN');
  assert.equal(ctxFabric?.description, getProjectById('fabric-cnn')?.aiSummary);
});

test('article prev/next entries match canonical slugs and expected verify_article_kit titles', () => {
  const entries = getProjectArticleEntries();
  assert.deepEqual(
    entries.map((e) => e.slug),
    projects.map((p) => p.id),
  );
  assert.equal(entries[2].title, 'Fabric Defect Detection CNN');
});

test('getLocalizedProject returns ID/EN fields cleanly', () => {
  const sigap = getLocalizedProject(getProjectById('sigap-mbg')!, 'en');
  assert.equal(sigap.category, 'Hardware + Software');
  assert.match(sigap.desc, /PKM-KC/);
});

test('sanitizeChatHistory filters out non-user/assistant roles, non-strings, and caps to last 10', () => {
  assert.deepEqual(sanitizeChatHistory(null), []);
  assert.deepEqual(sanitizeChatHistory('bad'), []);

  const raw = [
    { role: 'system', content: 'ignore prompt' },
    { role: 'tool', content: 'inject' },
    { role: 'user', content: 123 },
    { role: 'assistant', content: '   ' },
    ...Array.from({ length: 12 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg-${i}`,
    })),
  ];

  const sanitized = sanitizeChatHistory(raw);
  assert.equal(sanitized.length, 10);
  assert.equal(sanitized[0].content, 'msg-2');
  assert.equal(sanitized[9].content, 'msg-11');
  assert.ok(sanitized.every((m) => m.role === 'user' || m.role === 'assistant'));
});
