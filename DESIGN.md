# Design Direction — 3D Orbit Gallery

## Product Identity

**Name**: 3D Orbit Gallery
**Type**: Interactive portfolio showcase / personal tech stack visualization
**Audience**: Technical recruiters, developers, cybersecurity professionals
**Purpose**: Display technical expertise through immersive 3D visualization

## Visual Language

**Style**: Cybersecurity-themed dark aesthetic with scientific precision
**Mood**: Professional, technical, innovative, trustworthy
**Character**: Data-driven, interactive, sophisticated

## Dials

```
ENERGY: 2 (Balanced)
RHYTHM: 2 (Consistent with breaks)
MOTION: 2 (Scroll-reveal, transitions)
```

**Reasoning**:
- ENERGY 2: Professional enough for recruiters, interesting enough for developers
- RHYTHM 2: Structured sections with occasional asymmetry for visual interest
- MOTION 2: Smooth interactions without overwhelming the content

## Color Palette

### Primary (Earth-Tone Brown Aesthetic)
- **Background**: `#0f0e0d` (warm near-black, subtle brown undertone)
- **Surface**: `rgba(232, 224, 212, 0.06)` (warm glass)

### Accent
- **Primary Accent**: `#a07850` (warm brown) — blob core, UI highlights, focus states
- **Secondary Accent**: `#b89070` (light brown tint) — particles, secondary elements
- **Tertiary Accent**: `#d0b090` (cream brown) — hover states, subtle glow

### Neutrals (Warm Palette)
- **Text Primary**: `#e8e0d4` (warm off-white, not pure white)
- **Text Secondary**: `rgba(232, 224, 212, 0.7)` (70% warm white)
- **Text Tertiary**: `rgba(160, 120, 80, 0.6)` (brown-tinted tertiary)
- **Border**: `rgba(232, 224, 212, 0.14)` (warm border)
- **Border Accent**: `rgba(160, 120, 80, 0.35)` (brown accent border)

### Semantic
- **Success**: `#6b9e78` (muted sage green)
- **Warning**: `#c89060` (amber brown)
- **Error**: `#b85c5c` (muted terracotta)

**Reason**: Warm brown earth-tone palette creates organic, approachable technical aesthetic. Avoids cold blue/pink sci-fi cliché. Brown (#a07850) as primary accent maintains professional warmth while standing out in tech portfolio space. High contrast maintained (19.8:1 primary text on bg) for WCAG AA compliance.

## Typography

### Typeface
- **Sans-serif**: System stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`)
- **Reason**: Native fonts load instantly, consistent across platforms, professional appearance

### Hierarchy
- **H1 (Title)**: 24px, weight 600, letter-spacing -0.5px
- **Subtitle**: 13px, weight 400, opacity 0.5
- **Section Label**: 11px, uppercase, letter-spacing 1px, opacity 0.4
- **Body**: 14px, weight 400
- **Small**: 12px

**Reason**: Clear hierarchy without excessive size variation. Negative letter-spacing on titles for modern feel without being trendy.

## Spacing Scale

```
xs: 8px
sm: 12px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

## Border Radius

```
sm: 4px (badges)
md: 8px (buttons, cards, icons)
lg: 12px (modals, panels)
```

**Reason**: Consistent rounding system. Not pill-shaped, maintains structure.

## Components

### Buttons
- **Style**: Glassmorphism subtle (8% white bg, 15% border, 10px blur)
- **Hover**: 12% white bg, 25% border, translateY(-1px)
- **Reason**: Floating feel matches 3D scene, glass is accent not default

### Tech Icons
- **Size**: 40px × 40px
- **Background**: 5% white, 10% border
- **Hover**: 10% white, 30% border, translateY(-2px)
- **Reason**: Uniform size for visual rhythm, subtle depth on hover

### Tech Badges
- **Style**: Outlined pills with colored borders
- **Padding**: 4px 12px
- **Font**: 11px, weight 500
- **Reason**: Lightweight, doesn't compete with main content

## Layout Structure

### Sections (top to bottom)
1. **Header** — Title, subtitle (fixed top)
2. **3D Canvas** — Full viewport background
3. **Hint** — Center overlay, minimal
4. **Tech Stack** — Bottom center, above controls
5. **Controls** — Bottom center, primary actions

**Reason**: Content layered over 3D scene. Primary interaction (canvas) fills viewport. Secondary info (tech stack) near bottom doesn't obscure view.

## Motion Principles

### Transitions
- **Duration**: 0.2s–0.3s (quick feedback)
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out)
- **Properties**: background, border, transform

### 3D Animation
- **Auto-rotate**: 0.1 rad/s when idle (subtle, not distracting)
- **Particle speed**: 0.3 (visible flow without racing)
- **Damping**: 0.05 (smooth orbit control)

**Reason**: Motion guides attention without overwhelming. Auto-rotate keeps scene alive. Damping prevents jarring stops.

## Accessibility

### Contrast
- All text meets WCAG AA minimum:
  - Normal text (14px): 4.5:1
  - Large text (18px+): 3:1
  - Hint text (13px, 0.3 opacity): verify against dark bg

### Interaction
- Keyboard navigable (Tab, Enter, Escape)
- Focus indicators visible (outline or custom)
- Touch targets minimum 44px (mobile)

### States
- Loading spinner before scene mount
- Empty/error states for future data sections
- Responsive breakpoints < 768px

## Decorative Elements

### Blob
- **Purpose**: Central focal point, demonstrates shader knowledge
- **Style**: Wireframe, noise displacement, subtle glow
- **Reason**: Technical showcase, not generic decoration

### Starfield
- **Purpose**: Depth perception, space theme
- **Style**: 2000 points, subtle opacity (0.6), varied distance
- **Reason**: Background texture without distraction

### Particles
- **Purpose**: Data flow visualization, connection indicator
- **Style**: Small points, travel along lines, staggered timing
- **Reason**: Reinforces hub-spoke relationship, adds life

## What to Avoid (Antislop Compliance)

### Forbidden
- ❌ Em dashes (`—`)
- ❌ Generic CTAs ("Get Started", "Learn More")
- ❌ Buzzwords ("Revolutionary", "Seamless", "AI Powered")
- ❌ Fake statistics/testimonials
- ❌ Blue-purple gradients as default
- ❌ Excessive glassmorphism (limit to 1-2 elements)
- ❌ Uniform section rhythm (vary composition)

### Allowed with Purpose
- ✅ Warm brown accent (brand identity, consistent hierarchy)
- ✅ Dark theme (appropriate for tech/security portfolio)
- ✅ Glassmorphism (used sparingly on controls only)
- ✅ Animations (serve UX purpose: feedback, attention)

## Design Reasoning

**Why this works**:
- Single accent color focuses attention
- Dark theme appropriate for technical audience
- Glassmorphism accent, not character
- 3D scene demonstrates technical skill
- Tech stack shown directly, no claims
- Responsive and accessible by default
- Content-driven structure

**Identity check**: If logo/name swapped, design still feels cybersecurity/technical through:
- Dark aesthetic
- Warm brown accent (unconventional for tech, memorable)
- 3D shader work (technical showcase)
- Security tool badges (domain specificity)

---

## Advanced Interaction Layer (added Oct 17, 2026)

Motion systems added during the 2026 upgrade. All follow the dials above
(ENERGY 2 / RHYTHM 2 / MOTION 2) and every one has a stated reason.

### Section shader transition
- **What**: fullscreen WebGL dissolve (value noise, accent glow at the edge)
  played when navigating between home sections.
- **Files**: `src/scripts/sectionTransition.ts`
- **Why**: masks the scroll jump and reinforces the technical identity with a
  real GLSL effect. Desktop only, skipped for prefers-reduced-motion.
- **Duration**: 900ms total (360ms cover, instant jump, 540ms reveal).

### Particle field (hero)
- **What**: canvas 2D particle network with cursor repulsion and link lines.
- **Files**: `src/components/ParticleField.astro`
- **Why**: the security/network metaphor as ambient texture, interactive
  without competing with the headline.
- **Budget**: 80 particles desktop, 36 mobile, DPR capped at 1.75, paused when
  the tab is hidden, static single frame for prefers-reduced-motion.

### Command palette
- **What**: Cmd/Ctrl+K or `/` opens fuzzy search over navigation, actions,
  socials (Fuse.js).
- **Files**: `src/components/CommandPalette.astro`
- **Why**: developer audience expects keyboard-first navigation; also makes
  every section reachable in two keystrokes.

### Loading splash
- **What**: brief brand moment on the first load of a session (700ms quick
  path), with hooks to extend when the 3D gallery reports progress.
- **Files**: `src/components/LoadingScreen.astro`
- **Why**: covers the first-paint gap, then gets out of the way. Shown once
  per session, never on in-page navigation.

### Parallax layers
- **What**: scroll-linked depth on hero grid (0.5x), hero glow (1.2x), about
  photo (0.8x), gallery header (0.6x).
- **Files**: `src/scripts/parallax.ts`
- **Why**: depth without motion sickness; RAF-throttled, disabled on mobile
  and for prefers-reduced-motion.

### AI chat assistant
- **What**: portfolio-scoped assistant (gpt-4o-mini) that answers questions
  about projects, skills, experience and redirects off-topic asks.
- **Files**: `src/components/ChatAssistant.astro`, `src/pages/api/chat.ts`,
  `src/utils/portfolioContext.ts`
- **Why**: recruiters get answers without hunting through sections. Rate
  limited (20 messages/hour/session), API key stays server-side.
