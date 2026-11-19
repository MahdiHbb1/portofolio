// Detail-page UX kit untuk halaman project dan writeup:
// - TOC otomatis dari h2/h3 (details, collapsible) + scrollspy
// - Tombol copy di tiap blok <pre>
// - Navigasi prev/next antar halaman dalam seri yang sama
//
// Aktif otomatis kalau kontainer artikel ada; kalau tidak, no-op.
// Gaya visualnya di global.css (.toc, .copy-code, .article-nav).

import { projects } from '../data/projects.ts';
import { writeups } from '../data/writeups.ts';

export interface ArticleEntry {
  slug: string;
  title: string;
}

export function getProjectArticleEntries(): ArticleEntry[] {
  return projects.map((project) => ({
    slug: project.id,
    title: project.fullTitle ?? project.name,
  }));
}

const PROJECTS: ArticleEntry[] = getProjectArticleEntries();

const WRITEUPS: ArticleEntry[] = writeups.map((writeup) => ({
  slug: writeup.id,
  title: writeup.title,
}));

const CONTAINER_SELECTOR = '.project-page__body, .writeup__content';

const spyCleanups: Array<() => void> = [];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function uniqueId(base: string, used: Set<string>): string {
  const root = base || 'section';
  let candidate = root;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate;
}

// --- TOC ---

function buildToc(container: HTMLElement): void {
  const headings = Array.from(
    container.querySelectorAll<HTMLElement>('h2, h3'),
  ).filter((heading) => heading.textContent?.trim());

  if (headings.length < 2) return;

  const used = new Set<string>();
  const entries: Array<{ id: string; text: string; level: 2 | 3 }> = [];

  headings.forEach((heading) => {
    const text = heading.textContent!.trim();
    const id = heading.id || uniqueId(slugify(text), used);
    used.add(id);
    heading.id = id;
    heading.classList.add('article-heading');
    entries.push({ id, text, level: heading.tagName === 'H2' ? 2 : 3 });
  });

  const details = document.createElement('details');
  details.className = 'toc';
  details.open = true;

  const summary = document.createElement('summary');
  summary.className = 'toc__summary';
  summary.textContent = 'On this page';
  details.appendChild(summary);

  const nav = document.createElement('nav');
  nav.className = 'toc__nav';
  nav.setAttribute('aria-label', 'Table of contents');

  const linkById = new Map<string, HTMLAnchorElement>();

  entries.forEach((entry) => {
    const link = document.createElement('a');
    link.className = `toc__link toc__link--h${entry.level}`;
    link.href = `#${entry.id}`;
    link.textContent = entry.text;
    nav.appendChild(link);
    linkById.set(entry.id, link);
  });

  details.appendChild(nav);
  container.prepend(details);

  attachSpy(headings, linkById);
}

// --- Scrollspy ---
// Garis imajiner 140px dari atas viewport: section terakhir yang melewatinya
// dianggap sedang dibaca; saat sudah mentok bawah, section terakhir menang
// (supaya halaman pendek tetap benar).
function attachSpy(
  headings: HTMLElement[],
  linkById: Map<string, HTMLAnchorElement>,
): void {
  let ticking = false;

  const update = () => {
    ticking = false;

    const threshold = 140;
    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 16;

    let current = headings[0];
    if (atBottom) {
      current = headings[headings.length - 1];
    } else {
      headings.forEach((heading) => {
        if (heading.getBoundingClientRect().top <= threshold) current = heading;
      });
    }

    const link = linkById.get(current.id);
    if (!link || link.classList.contains('is-active')) return;
    linkById.forEach((l) => l.classList.remove('is-active'));
    link.classList.add('is-active');
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  spyCleanups.push(() => window.removeEventListener('scroll', onScroll));
  update();
}

// --- Copy code ---

function buildCopyButtons(container: HTMLElement): void {
  container.querySelectorAll<HTMLPreElement>('pre').forEach((pre) => {
    if (pre.querySelector(':scope > .copy-code')) return;

    pre.classList.add('article-pre');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = 'Copy';

    button.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.textContent ?? pre.textContent ?? '';
      try {
        await navigator.clipboard.writeText(code.replace(/\n$/, ''));
        button.textContent = 'Copied';
        button.classList.add('is-copied');
      } catch {
        button.textContent = 'Failed';
      }
      window.setTimeout(() => {
        button.textContent = 'Copy';
        button.classList.remove('is-copied');
      }, 1600);
    });

    pre.appendChild(button);
  });
}

// --- Prev / next ---

function locate<T extends ArticleEntry>(
  list: T[],
  base: string,
): { list: T[]; index: number; base: string } | null {
  const match = window.location.pathname.match(
    new RegExp(`^${base}/([^/]+)/?$`),
  );
  if (!match) return null;
  const index = list.findIndex((entry) => entry.slug === match[1]);
  if (index === -1) return null;
  return { list, index, base };
}

function buildPrevNext(container: HTMLElement): void {
  const series =
    locate(PROJECTS, '/projects') ?? locate(WRITEUPS, '/writeups');
  if (!series) return;

  const previous = series.list[series.index - 1];
  const next = series.list[series.index + 1];
  if (!previous && !next) return;

  const nav = document.createElement('nav');
  nav.className = 'article-nav';
  nav.setAttribute('aria-label', 'More pages');

  const makeLink = (entry: ArticleEntry, dir: 'prev' | 'next'): HTMLElement => {
    const link = document.createElement('a');
    link.className = `article-nav__link article-nav__link--${dir}`;
    link.href = `${series.base}/${entry.slug}/`;

    const label = document.createElement('span');
    label.className = 'article-nav__dir';
    label.textContent = dir === 'prev' ? '← Previous' : 'Next →';

    const title = document.createElement('span');
    title.className = 'article-nav__title';
    title.textContent = entry.title;

    link.append(label, title);
    return link;
  };

  if (previous) nav.appendChild(makeLink(previous, 'prev'));
  if (next) nav.appendChild(makeLink(next, 'next'));

  container.appendChild(nav);
}

// --- Init ---

export function initArticle(): void {
  spyCleanups.forEach((cleanup) => cleanup());
  spyCleanups.length = 0;

  document
    .querySelectorAll<HTMLElement>(CONTAINER_SELECTOR)
    .forEach((container) => {
      // Rebuild-friendly: buang UI lama dulu (ClientRouter nav / re-init).
      container
        .querySelectorAll(':scope > .toc, :scope > .article-nav')
        .forEach((el) => el.remove());

      buildToc(container);
      buildCopyButtons(container);
      buildPrevNext(container);
    });
}
