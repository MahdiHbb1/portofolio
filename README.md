# Portfolio Website

> 3D interactive portfolio showcasing cybersecurity and machine learning expertise

## Features

- **3D Orbit Gallery**: Interactive Three.js scene with 6000 stars, shooting stars, and orbital asteroids
- **Bilingual Support**: Seamless ID/EN language toggle (localStorage-based)
- **Skills Showcase**: 24 technical skills across Security, ML, Web Development, and Tools
- **Project Portfolio**: 7 projects including PKM-KC funded SIGAP MBG
- **CTF Writeups**: Security competition solutions and forensics challenges
- **Responsive Design**: Mobile-first with warm brown earth-tone palette
- **Type-Safe**: Built with TypeScript and Astro

## Tech Stack

- **Framework**: [Astro](https://astro.build) (Static Site Generator)
- **3D Graphics**: Three.js
- **Styling**: CSS custom properties + responsive design
- **Typography**: Space Grotesk Variable, JetBrains Mono
- **Deployment**: Static export ready

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321)

## Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview built site locally |
| `npm run astro` | Run Astro CLI commands |

## Project Structure

```
src/
├── components/
│   ├── orbit/          # 3D scene modules
│   └── sections/       # Page sections
├── data/
│   └── content.ts      # Bilingual content
├── layouts/
│   └── Base.astro      # Base layout
├── pages/              # Routes
└── styles/
    └── global.css      # Design tokens
```

## Bilingual Content

Switch language via navbar toggle (ID/EN). Content defined in `src/data/content.ts`:

```typescript
export const content = {
  id: { /* Indonesian */ },
  en: { /* English */ }
};
```

## Design System

- **Colors**: Warm brown earth-tone (#a07850 accent)
- **Typography**: Space Grotesk (sans), JetBrains Mono (mono)
- **Spacing**: 8px base scale
- **Dark Theme**: Near-black (#0f0e0d) background

Full design specs in `DESIGN.md`

## 3D Scene Components

- **Starfield**: 6000 particles with twinkle animation
- **Shooting Stars**: 8 trails with Bezier paths
- **Asteroids**: 25 orbital objects with rotation
- **Blob**: Noise-displaced wireframe with energy particles
- **Nebulae**: 5-layer volumetric clouds

## License

© 2024-2026 Mahdi Habibi. All rights reserved.

## Contact

- **Email**: mahdihabibi31352@gmail.com
- **GitHub**: [MahdiHbb1](https://github.com/MahdiHbb1)
- **LinkedIn**: [Mahdi Habibi](https://linkedin.com/in/mahdi-habibi-62a939321/)

---

Built with [Astro](https://astro.build) · Styled with love · Secured by design
