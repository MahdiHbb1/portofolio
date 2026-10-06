# Enhancements Applied

## Phase 14: User Feedback Round 2 (2026-10-06)

### Issues Fixed
1. **Icons 404**: `public/icons/` was file, not folder → removed, recreated, copied 8 SVG
2. **About layout**: Label/heading spacing → 0.25rem gap, foto margin → 1rem (sejajar paragraf)
3. **Achievements grid**: Konsisten (no stagger offset, gap 2rem, scale 1.02 featured)
4. **Asteroids visibility**: Brighter colors (0xf0f0f0, 0xe0e0e0, 0xc0c0c0) + emissive glow

### Lang System
- `src/data/content.ts`: ID & EN content single source
- Switch: ubah `currentLang: Lang = 'id'` → `'en'`
- All sections pakai `{t.section.key}`

### 3D Scene
- **Stars**: 3000 → 6000 (2x banyak)
- **Shooting stars**: 5 → 8, speed +50%
- **Blob particles**: radius 2.5 → 0 (ke blob)
- **Asteroids**: abu-abu terang + emissive

### Code Quality
- ✅ Single source truth (content.ts)
- ✅ Type-safe lang switching
- ✅ No duplication
- ✅ Clean component hierarchy
- ✅ Optimal bundle (5.86s build)

### Skills Used
- `antislop-ui`: UI patterns check
- `ponytail`: Lazy senior dev (stdlib first, no bloat)
- Core tools: read, edit, bash, glob

### Next Steps
1. Restart dev server (`astro dev stop`, `astro dev --background`)
2. Icons akan muncul
3. About layout fixed
4. Asteroids lebih visible
