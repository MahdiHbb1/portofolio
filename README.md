# Mahdi Habibi Portfolio

Personal portfolio website showcasing cybersecurity, machine learning, and software engineering projects.

## Features

- **3D Interactive Gallery**: Three.js orbit scene with project panels
- **Custom Cursor**: Smooth, responsive custom cursor for desktop
- **View Transitions**: Seamless page navigation with Astro View Transitions
- **Responsive Design**: Mobile fallback, tablet & desktop optimized
- **Accessibility**: WCAG compliant, keyboard navigation, screen reader support

## Tech Stack

- **Framework**: Astro 7.3
- **3D Graphics**: Three.js 0.186
- **Styling**: CSS custom properties, design tokens
- **Typography**: Space Grotesk, JetBrains Mono
- **Deployment**: Static site generation

## Project Structure

```
/
├── public/          # Static assets
├── src/
│   ├── components/  # Astro components
│   │   ├── orbit/   # Three.js 3D scene modules
│   │   └── sections/
│   ├── layouts/     # Page layouts
│   ├── pages/       # Routes
│   ├── scripts/     # Client-side scripts
│   └── styles/      # Global CSS
└── package.json
```

## Commands

All commands run from project root:

| Command              | Action                                      |
| :------------------- | :------------------------------------------ |
| `npm install`        | Install dependencies                        |
| `npm run dev`        | Start dev server at `localhost:4321`        |
| `npm run build`      | Build production site to `./dist/`          |
| `npm run preview`    | Preview build locally before deploying      |
| `npm run astro ...`  | Run Astro CLI commands                      |

## Development

See `AGENTS.md` for AI agent instructions and `DESIGN.md` for design system documentation.

## License

© 2024-2025 Mahdi Habibi
