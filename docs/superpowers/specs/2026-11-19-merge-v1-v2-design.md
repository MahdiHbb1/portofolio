# Design Spec: Unified Portfolio Merge (v1 + v2), 3D Gallery Cards, and Project Preview Support

**Date:** 2026-11-19
**Target Workspace:** `D:\HBB\WEBPORTOPROJEK` (root `master` branch)
**Status:** Ready for owner approval (builder-check completed and resolved)

---

## 1. Intent & Why

The portfolio currently exists in two diverged trees inside the workspace:

1. **Root (`v1`, `master` branch):** Original portfolio site that recently received three commits on 2026-11-18 (`9b2436c`, `62cd0e4`, `8c345ad`) adding the real profile photo (`public/images/profile.jpg`), the **Medali Perak PKM-KC 2026** achievement (`pkmkcSilver`), and a clickable PDF certificate link (`/certificates/pkm-kc-2026-medali-perak.pdf`) with a `pointer-events: none` fix on `.achievement-card__inner::before`.
2. **Version 2 (`versi2/portofolio-master`, `main` branch):** Forked after root commit `b1002ed` (2026-10-07) and upgraded over Rounds 1–6 (2026-10-14..18) with performance optimizations (lazy-loaded 3D scene moved below About, Canvas 2D hero `ParticleField`), bug fixes (kebab-case project links resolving 404s, delegated lang toggle, sticky About containment, parallax `maxTravel` clamp, WCAG contrast improvements), SEO/OG cards, interactive features (`CommandPalette`, `ChatAssistant` "Kevin", `TerminalEgg` modal + inline `#terminal` playground, `ScrollProgress`, `Toast`, `LoadingScreen`, WebGL `SectionTransition`, `article.ts` UX kit), and Playwright QA suites.

In addition, **both** versions share incomplete UX in the 3D Orbit Gallery and project pages:
- 3D nodes (`src/components/orbit/panels.ts`) render `makePlaceholderTexture` with only the title and category.
- Clicking a 3D node (`src/components/orbit/controls.ts` + `src/components/PanelDetailModal.astro`) never updates `#modal-description`, always displaying `"Project details will appear here."`, and `zoomToPanel` aims inward toward the center blob while `panels.tick` keeps orbiting the clicked mesh.
- Project pages (`src/layouts/ProjectLayout.astro` + `src/pages/projects/*.astro`) lack a dedicated screenshot showcase section for when project preview screenshots are added later.

**Goal of this work:** Consolidate `v2` and the `v1` updates into a single clean Astro codebase at the repository root (`D:\HBB\WEBPORTOPROJEK`), backed by a unified `src/data/projects.ts` single source of truth, informative 3D card nodes + fixed zoom/modal details, and a bilingual screenshot showcase slot on project detail pages.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
1. **Unify codebase at root (`D:\HBB\WEBPORTOPROJEK`)** using `v2` as the base architecture while preserving all `v1` updates from 2026-11-18 (`profile.jpg`, `pkmkcSilver`, clickable certificate PDF, `achievements.certificate` i18n, and `content/` source backups).
2. **Create `src/data/projects.ts`** as the single source of truth for all 7 projects (matching `src/data/writeups.ts`), separating UI copy (`desc`) from Kevin AI/Terminal context (`aiSummary`) for the 5 placeholder projects.
3. **Upgrade 3D Gallery nodes (`panels.ts`) as informative cards (no screenshots on 3D nodes):**
   - Render crisp `640x400` card textures on `PlaneGeometry(1.6, 1.0)` containing header chrome + year/featured marker, title, category, wrapped 2–3 line summary (`ID`/`EN`), and up to 3 tag pills.
   - Read active language (`localStorage.getItem('lang') || 'id'`) on gallery init so card summaries match the selected language.
4. **Fix 3D Gallery click-zoom and detail modal (`controls.ts`, `OrbitGallery.astro`, `PanelDetailModal.astro`):**
   - Pause panel orbital motion during `TRANSITIONING` and `DETAIL` states (resuming smoothly from the paused phase on return).
   - Zoom camera toward the **front face** of the clicked panel (`camera.position - panelPos`), never inward through the center blob.
   - Populate `#panel-modal` dynamically with real localized project data: `#modal-year`, `#modal-title`, `#modal-category`, `#modal-description`, `#modal-tags`, and localized `#modal-link` (`href="/projects/${projectId}"`).
   - Full keyboard/accessibility behavior: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`, focus management on open/close, and `Escape`/backdrop close.
5. **Add bilingual Project Preview Screenshot Showcase to `ProjectLayout.astro`:**
   - Support optional `screenshots?: ProjectScreenshot[]` prop in `ProjectLayout.astro` (or fetched from `projects.ts`), plus runtime `ID`/`EN` translation in `Base.astro` for `ProjectLayout` chrome (`All projects` / `Semua project`, localized category, `Preview Screenshots` / `Cuplikan Preview`, screenshot `alt`/`caption`, and placeholder notice).
   - When real screenshots exist, render a responsive 16:10 grid; when empty/omitted, render an honest placeholder frame (`antislop` R-23 / R-38 compliant — no skeleton bars or fabricated mockups).
6. **Synchronize `v1` updates with `v2` modules:**
   - Update `About.astro` (`profile.jpg` inside `.about__header-sticky` alongside `v2`'s 4 `.about__stats` cards) and fix `src/scripts/parallax.ts` selector from `.about__photo-placeholder` to `.about__photo`.
   - Merge `Achievements.astro` (`pkmkcSilver` + certificate link + `pointer-events: none` on `::before`) with `v2`'s per-card icons (`trophy.svg`, `flag.svg`, `file-check.svg`, `lightbulb.svg`).
   - Update `src/utils/portfolioContext.ts` (used by Kevin AI, Terminal, and JSON-LD) to include **Medali Perak PKM-KC 2026** and derive projects from `src/data/projects.ts`.
7. **Fix mobile `#gallery` navigation consistency & polish items:**
   - Hide `.gallery3d` on `<= 640px` (`display: none`) AND update mobile navigation targets so zero dead links exist on phones (`Hero.astro` CTA routes to `#projects` on `<= 640px`, `MobileNav.astro` swaps `Gallery` to `Writeups` on `<= 640px`, `CommandPalette.astro` omits `3D Gallery` on `<= 640px`).
   - Restore `Writeups` link (`/#writeups`) in desktop `Navbar.astro`.
   - Mark `Download Resume (Coming soon)` explicitly in `CommandPalette.astro` (`antislop` R-26); add `Writeups` & `Terminal` navigation entries.
   - Clean up unused `v1` icons in `public/icons/`, remove 0-byte `public/og-default.png`, exclude `versi2` in `tsconfig.json`, and port `tools/og/` and `tools/qa/` suites into root.

### Non-Goals
- Authoring full case-study text for the 5 placeholder project pages (`fraudlens`, `fabric-cnn`, `legalin`, `buktitagih`, `ctf-itsecdevx26`) or the 2 placeholder writeups (`placeholder-xss`, `placeholder-crypto`).
- Generating fake project screenshots or a dummy `public/resume.pdf`.
- Replacing the placeholder `site: 'https://mahdihabibi.example'` domain in `astro.config.mjs` (remains `TODO(deploy)`).
- Deleting `versi2/` or `content/` backup directories automatically without explicit post-verification confirmation.

### Anti-Goals
- Do NOT render project screenshot images inside the 3D gallery canvas nodes (keep nodes as clean informative cards).
- Do NOT promote unverified draft AI summaries from `portfolioContext.ts` onto the homepage UI or 3D cards where placeholders are intended (`1A` decision).
- Do NOT regress `v2`'s lazy-loaded Three.js (`IntersectionObserver`), runtime `is:global` styles, kebab-case routes, or WCAG AA color contrast tokens.
- Do NOT introduce new em dash (`—`) characters in UI copy (`antislop` R-02), fabricated metrics (`R-17`/`R-38`), dead buttons (`R-26`), or horizontal overflow on mobile (`R-03`).

---

## 3. Approach Chosen

**Selected Approach (Option 1): `v2` Base + Port `v1` Updates + Unified `src/data/projects.ts` Single Source of Truth**

- **Why:** `v2` already includes major architectural gains (lazy-loaded 3D, Canvas 2D hero, kebab-case routing, SEO/OG, AI chat, interactive terminal, article kit, WCAG contrast). Porting `v1`'s 18 Nov additions onto `v2` and introducing `src/data/projects.ts` ensures 3D cards, modal details, project grid, detail pages, prev/next nav, Kevin AI, and terminal commands stay consistent while cleanly separating public UI placeholder descriptions from Kevin AI's background context.

---

## 4. Constraints & Architecture

### Dependencies & Astro Configuration
- **`package.json`**: Keep `astro` (`^7.3.2`), `three` (`^0.186.0`), `@types/three` (`^0.186.0`), `@fontsource-variable/space-grotesk`, `@fontsource/jetbrains-mono`, `@astrojs/check`, `typescript`; add `@astrojs/node` (`^11.1.8`), `@astrojs/sitemap` (`^3.7.4`), `fuse.js` (`^7.5.0`), `nanoid` (`^6.0.2`), `openai` (`^7.33.0`).
- **`astro.config.mjs`**: Adopt `v2` config (`adapter: node({ mode: 'standalone' })`, `integrations: [sitemap()]`, `site: 'https://mahdihabibi.example'`, `env.schema` for `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `CHAT_MODEL`).
- **`tsconfig.json`**: Set `"exclude": ["dist", "versi2", "node_modules"]` so `astro check` does not scan backup files if `versi2/` remains on disk.
- **`.gitignore` & `.gitattributes`**: Port `v2` entries (`.env.*`, `!.env.example`, `tools/qa/shots/`, `.gitattributes`); never commit `.env`.

### Design System & Antislop Compliance (Mode 1: DURING)
- Follow `DESIGN.md` tokens & dials: `ENERGY 2 / RHYTHM 2 / MOTION 2`, palette `#0f0e0d` bg, `#e8e0d4` fg, `#a07850` accent, `#b98f60` accent-bright.
- Avoid new `—` em dashes in UI text (`R-02`); use punctuation like `,`, `:`, `.`, or `·`.
- Maintain WCAG AA contrast (`R-25`), `>= 44px` tap targets and `0px` horizontal overflow from `320px` to `1440px` (`R-03`), keyboard + `Esc` modal handling (`R-32`), and concise why-focused code comments (`antislop-code`).

---

## 5. Component & Data Design

### 5.1 Unified Project Data (`src/data/projects.ts`)

Create `src/data/projects.ts` modeled after `src/data/writeups.ts`:

```ts
export interface LocalizedText {
  id: string;
  en: string;
}

export interface ProjectScreenshot {
  src: string;
  alt: LocalizedText;
  caption?: LocalizedText;
}

export interface ProjectEntry {
  id: string; // canonical kebab-case slug matching src/pages/projects/<id>.astro
  name: string; // compact UI display name (used in cards, 3D panels, headers)
  fullTitle?: string; // [Builder call] optional longer title for prev/next, SEO/OG, AI context
  category: LocalizedText;
  year: string;
  featured: boolean;
  gradient: string;
  cardColor: number; // 3D card base hex tint
  tags: string[];
  desc: LocalizedText; // UI description (honest placeholder for 5 pending projects per 1A)
  aiSummary: string; // English summary for Kevin AI, Terminal `cat projects/<id>`, JSON-LD
  achievements?: string[];
  screenshots?: ProjectScreenshot[];
}
```

**[Builder call] Title & FraudLens Year Reconciliation:**
- Keep compact `name` (`"Fabric Defect CNN"`, `"CTF Writeups"`) for UI cards and 3D panels (so text fits cleanly without clipping), while preserving `fullTitle` (`"Fabric Defect Detection CNN"`, `"CTF Writeups Collection"`) for `article.ts` prev/next nav, `portfolioContext.ts`, and existing `public/og/*.png` cards + `tools/qa/verify_article_kit.py` compatibility.
- Update `fraudlens` `year` in `projects.ts` (`aiSummary` + `year`) to `"2025"` to match `cv/CV_Mahdi_Habibi.md` (Dec 2025, BMT Insan Mandiri), removing the CV-vs-AI contradiction.
- Keep `desc` as the existing honest placeholder copy for the 5 pending projects (`fraudlens`, `fabric-cnn`, `legalin`, `buktitagih`, `ctf-itsecdevx26`) while keeping `aiSummary` populated for `portfolioContext.ts` (Decision `1A`).

**Consumers:**
1. `src/data/content.ts`: derives `content[lang].projects.items` from `projects` (`desc[lang]`), preserving `data-i18n="projects.items.<slug>.desc"`.
2. `src/components/sections/Projects.astro`: renders cards directly from `projects`.
3. `src/components/orbit/panels.ts`: maps the 7 entries onto the 3 orbital layers by `id` (`['fraudlens', 'fabric-cnn']`, `['legalin', 'buktitagih', 'sigap-mbg']`, `['ctf-itsecdevx26', 'ctf-writeups']`) — **[Builder call]** lookup by ID decouples 3D orbital placement from homepage grid order (`sigap-mbg` first).
4. `src/components/orbit/controls.ts`: looks up full localized project details via `getProjectById(id)`.
5. `src/scripts/article.ts`: derives `PROJECTS` prev/next entries from `projects` (`slug: p.id`, `title: p.fullTitle ?? p.name`).
6. `src/utils/portfolioContext.ts`: derives `projects` context from `projects` (`name: p.fullTitle ?? p.name`, `description: p.aiSummary`, `category: p.category.en`).

### 5.2 3D Gallery Cards (`panels.ts`)

- Extract pure canvas text-wrapping/truncation helpers (unit-testable) and replace `makePlaceholderTexture` with `makeProjectCardTexture(project, lang)`:
  - Offscreen canvas `640x400` mapped to `PlaneGeometry(1.6, 1.0)` with `texture.colorSpace = THREE.SRGBColorSpace` and safe anisotropy (`Math.min(4, ctx.renderer.capabilities.getMaxAnisotropy())`).
  - **Card anatomy (top to bottom):**
    1. **Top bar (`40px`):** subtle copper/warm header fill, 3 window chrome dots on left, `year` (and `FEATURED` label pill if `project.featured`) in `#b98f60` monospace on right.
    2. **Category label:** monospace `#b98f60` (`14px`) below header (`project.category[lang]`).
    3. **Project title:** bold `#e8e0d4` (`30px`, wraps cleanly up to 2 lines if needed).
    4. **Short content summary:** `#e8e0d4` @ 78% opacity (`17px`), word-wrapped cleanly to max 3 lines with `…` truncation using `project.desc[lang]`.
    5. **Bottom tag strip:** up to 3 compact bordered pills (`#a07850` border @ 45%, `#e8e0d4` text @ 85%) showing `project.tags.slice(0, 3)`.
  - **Border & contrast:** `2px` crisp frame (`rgba(160, 120, 80, 0.72)` for featured, `rgba(232, 224, 212, 0.42)` otherwise) over dark tinted background (`project.cardColor`).
  - Keep `7` panels matching `lines.ts` (`PANEL_COUNT = 7`).

### 5.3 3D Click Focus & Modal Details (`OrbitGallery.astro`, `controls.ts`, `PanelDetailModal.astro`)

- **Orbit Pause & Smooth Resume:**
  - `controls.ts` exposes `isInspecting(): boolean` (`currentState !== ViewState.ORBIT`).
  - In `OrbitGallery.astro`, accumulate `orbitTime` only when `!controls.isInspecting()` (incrementing by `Math.min(delta, 0.1)`), and pass `orbitTime` to `panels.tick(orbitTime, ctx.camera)`. Background nebulae/starfield/blob/lines keep animating continuously while project panels hold steady during camera zoom and detail modal view.
- **Camera Target Math Fix (`controls.ts`):**
  - Place the camera `2.4` units in front of the facing side of the clicked panel (`toCamera = camera.position.clone().sub(panelPos)` normalized, with `(0, 0, 1)` fallback if degenerate), avoiding swinging behind the panel or through the center blob.
  - Cancel pending transition cleanly in `dispose()` or on navigation.
- **Populating `PanelDetailModal.astro`:**
  - Add `#modal-year` (header meta), `#modal-tags` (`<ul id="modal-tags" class="panel-modal__tags">`), localized `#modal-description` (from `project.desc[lang]`), and localized `#modal-link` / `#modal-back` labels (`ID`/`EN`).
  - Set `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`, and toggle `aria-hidden` alongside `data-state="visible" | "hidden"`.
  - Remove static `"Project details will appear here."` placeholder from markup; populate dynamically before setting `data-state="visible"`.
  - Move focus to `#modal-close` or `#modal-link` on open and restore focus to `.orbit-canvas` / `.orbit-reset` on close.

### 5.4 Bilingual Project Detail Pages & Preview Screenshots (`ProjectLayout.astro`, `Base.astro`, `src/pages/projects/*.astro`)

- Extend `ProjectLayout.astro` Props to accept `projectId?: string` (or `category: LocalizedText | string`, `description: string`, `screenshots?: ProjectScreenshot[]`), preferring lookup via `getProjectById(projectId)` when `projectId` is passed so metadata stays centralized.
- Add `<section class="project-page__screenshots">` inside `.project-page__article`:
  - **When `screenshots && screenshots.length > 0`:** render a responsive grid (`1` col if 1 image or mobile; `repeat(auto-fit, minmax(min(100%, 20rem), 1fr))` if `>= 2`), each `<figure class="project-shot">` with `aspect-ratio: 16 / 10`, `object-fit: cover`, `1px solid var(--border)`, `border-radius: 8px`, `loading="lazy"`, `decoding="async"`, and `<figcaption>` carrying `data-i18n` / bilingual attributes (`data-i18n-id`, `data-i18n-en`).
  - **When `screenshots` is empty/undefined:** render a modest framed placeholder block (`1px dashed var(--border-accent)`) with bilingual labels (`Preview Screenshots` / `Cuplikan Preview` and `Screenshots for this project will appear here once added.` / `Screenshot untuk project ini akan ditampilkan di sini setelah ditambahkan.`), avoiding fake skeleton bars (`antislop` R-23 / R-38).
- Extend `Base.astro` `applyTranslations()` (Decision `3A`) to translate ProjectLayout chrome (`data-i18n="project.back"`, `project.screenshotsHeading`, `project.screenshotsEmpty`, plus elements carrying `data-i18n-id` / `data-i18n-en` for category, screenshot alt/caption, and Hero CTAs).
- **[Builder call] Existing `<slot />` prose on project pages:** Keep existing Indonesian body paragraphs inside each `src/pages/projects/*.astro` `<slot />` untouched (no invented case-study prose per Non-Goal 1), while all layout chrome, metadata, categories, and screenshot captions/placeholders switch cleanly between `ID` and `EN`.

### 5.5 Navigation, Mobile Gallery (`2A`), & Porting `v1` Updates

1. **`About.astro` & `parallax.ts`:**
   - Place `v1`'s `<img src="/images/profile.jpg" alt="Mahdi Habibi" class="about__photo" width="768" height="1024" loading="lazy" decoding="async" />` inside `v2`'s `.about__header-sticky` above `v2`'s 4 `.about__stats` cards.
   - Update `src/scripts/parallax.ts` line 106 to target `.about__photo` instead of `.about__photo-placeholder`.
2. **`Achievements.astro` & `portfolioContext.ts` & `Base.astro`:**
   - Include all 5 achievement cards (`pkmkcSilver` first with `trophy.svg` and `/certificates/pkm-kc-2026-medali-perak.pdf`, followed by `pkmkc` `trophy.svg`, `ctf` `flag.svg`, `fabricCnn` `file-check.svg`, `aiHackathon` `lightbulb.svg`).
   - Keep `pointer-events: none` on `.achievement-card__inner::before`, `.achievement-card__link`, `achievements.certificate` i18n in `content.ts` + `Base.astro`, and add `Medali Perak PKM-KC 2026` to `portfolioContext.ts` (`achievements` + `sigap-mbg` achievements).
3. **Mobile `<= 640px` Navigation Consistency (`2A` + [Builder call]):**
   - `Gallery3D.astro`: hide `.gallery3d` at `@media (max-width: 640px) { display: none; }`.
   - `Hero.astro`: render `View Work` CTA (`data-hero-work-cta`) defaulting to `#gallery`, and at `<= 640px` point/route its `href` to `#projects` (on initial load and `resize` listener / CSS-free matchMedia sync) so mobile users jump directly to `#projects` rather than a hidden `#gallery`. Also add `data-i18n` for Hero CTAs (`View Work` / `Lihat Karya`, `Get in Touch` / `Hubungi Saya`).
   - `MobileNav.astro`: **[Builder call]** keep 5 visible bottom-nav items across all mobile widths (`<= 900px`) without dead targets by placing a responsive swap on slot 2: `.mobile-nav__item--gallery` (`/#gallery`) shows on `641px–900px` and hides at `<= 640px`, while `.mobile-nav__item--writeups` (`/#writeups`) hides on `641px–900px` and shows at `<= 640px`. This guarantees 5 visible tabs at `320px/360px/390px` (matching `tools/qa/mobile_nav_check.py`) and zero dead `#gallery` links on phones.
   - `CommandPalette.astro`: exclude `3D Gallery` dynamically when building/filtering commands on `<= 640px` (`window.matchMedia('(max-width: 640px)').matches`), add `Writeups` (`/#writeups`) and `Terminal` (`/#terminal`) navigation entries, and label the pending action `Download Resume (Coming soon)` (`antislop` R-26).
4. **Desktop `Navbar.astro`:**
   - Include `Writeups` (`/#writeups`) between `Projects` and `Terminal` (`About`, `Gallery`, `Skills`, `Projects`, `Writeups`, `Terminal`, `Contact`), verifying clean layout without wrapping at `901px+`.
5. **Public Assets:**
   - Keep `public/images/profile.jpg` and `public/certificates/pkm-kc-2026-medali-perak.pdf`.
   - Port `v2`'s `public/icons/*`, `public/og/*.png`, and `public/og-default.svg`.
   - Remove 0-byte `public/og-default.png` and unused `v1` icons (`code-globe.svg`, `document-check.svg`, `linux.svg`, `neural-net.svg`, `shield-lock.svg`, `target.svg`, `wrench-terminal.svg`).

### 5.6 Builder Scope (Left to Planning & Execution)
- File-by-file merge sequence and git worktree isolation in `docs/superpowers/plans/2026-11-19-merge-v1-v2.md`.
- Exact CSS spacing/typography tokens for the 3D card canvas and `ProjectLayout.astro` screenshot grid within `DESIGN.md`.
- Unit tests for `projects.ts` + 3D card canvas wrapping/truncation logic + updating/extending Playwright QA suites in `tools/qa/` (verified via `npx astro check`, `npm run build`, and Playwright against `node dist/server/entry.mjs`).
