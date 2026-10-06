# Panduan Mengisi Konten Portfolio

Panduan lengkap untuk mengganti placeholder dengan konten asli.

---

## 📂 Struktur Folder

```
src/
├── data/
│   ├── content.ts          # Teks i18n (ID/EN)
│   └── experiences.js      # Data achievements/projects/writeups
└── pages/
    ├── projects/           # Detail project pages
    │   ├── sigap-mbg.astro
    │   ├── fraudlens.astro
    │   └── fabric-cnn.astro
    └── writeups/           # Detail writeup pages
        ├── itsecdevx26-forensics.astro
        └── itsecdevx26-web.astro

public/
├── icons/                  # Icons SVG (24x24px)
├── projects/              # Project images
└── writeups/              # Writeup images
```

---

## 1. Foto Profil

### Lokasi
- File: `src/components/sections/About.astro` (line 11-13)
- Placeholder: kotak border glowing dengan teks "FOTO"

### Cara Ganti
1. Siapkan foto rasio **3:4** (contoh: 600×800px)
2. Simpan di `public/images/profile.jpg` atau `.png`
3. Edit `About.astro`:

```astro
<!-- SEBELUM (line 11-13) -->
<div class="about__photo-placeholder" aria-label="Foto placeholder">
  <span class="photo-hint">Foto</span>
</div>

<!-- SESUDAH -->
<img 
  src="/images/profile.jpg" 
  alt="Mahdi Habibi" 
  class="about__photo"
  width="600" 
  height="800"
/>
```

4. Tambahkan CSS style (setelah line 77):

```css
.about__photo {
  margin-top: 1rem;
  width: 100%;
  aspect-ratio: 3 / 4;
  max-width: 16rem;
  border: 2px solid rgba(232, 224, 212, 0.3);
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 
    0 0 20px rgba(160, 120, 80, 0.15),
    inset 0 0 20px rgba(232, 224, 212, 0.05);
}
```

---

## 2. Teks / Copy

### Lokasi
File: `src/data/content.ts`

### Format
```typescript
export const content = {
  id: {
    hero: {
      name: "Nama Kamu",
      title: "Job Title",
      subtitle: "Afiliasi · Tag1 · Tag2"
    },
    about: {
      label: "Tentang",
      heading: "Siapa Saya",
      bio1: "Paragraf pertama...",
      bio2: "Paragraf kedua..."
    },
    // dst...
  },
  en: {
    // Versi bahasa Inggris
  }
}
```

### Yang Perlu Diganti
- `hero.name` — Nama lengkap
- `hero.title` — Security & ML Engineer / CTF Player / dsb
- `hero.subtitle` — Universitas · Tim · Status
- `about.bio1` & `bio2` — Cerita tentang kamu (2 paragraf)
- `contact.subtitle` — Call-to-action kontak

---

## 3. Achievements

### Lokasi
File: `src/data/experiences.js` → array `achievements`

### Format Entry
```javascript
{
  id: 'unique-slug',        // URL-friendly
  title: 'Juara 1 CTF X',
  date: 'Oktober 2024',
  category: 'Competition',  // Competition / Certification / Award
  icon: 'trophy.svg',       // File di public/icons/
  description: 'Deskripsi singkat pencapaian (1-2 kalimat)',
}
```

### Cara Tambah/Edit
1. Buka `src/data/experiences.js`
2. Cari `export const achievements = [`
3. Tambah/edit entry:

```javascript
export const achievements = [
  {
    id: 'ctf-gemastik-2024',
    title: 'Juara 3 Gemastik XVII CTF',
    date: 'September 2024',
    category: 'Competition',
    icon: 'trophy.svg',
    description: 'Finalis Capture The Flag Gemastik XVII kategori keamanan siber.',
  },
  // Entry lainnya...
];
```

### Icon yang Tersedia
- `trophy.svg` — Kompetisi/lomba
- `shield-lock.svg` — Security/sertifikat
- `target.svg` — Target/goal achieved
- `document-check.svg` — Sertifikasi
- `lightbulb.svg` — Inovasi/ide

---

## 4. Projects

### Lokasi
1. Data: `src/data/experiences.js` → array `projects`
2. Detail page: `src/pages/projects/{slug}.astro`
3. Gambar: `public/projects/{slug}/`

### Format Entry (experiences.js)
```javascript
{
  id: 'sigap-mbg',           // Slug untuk URL
  title: 'SIGAP MBG',
  category: 'IoT + ML',
  description: 'Deskripsi singkat untuk card (1 kalimat)',
  tags: ['Python', 'IoT', 'TensorFlow'],
  link: '/projects/sigap-mbg',  // Link ke detail page
  thumbnail: '/projects/sigap-mbg/thumb.jpg',  // Opsional
}
```

### Cara Buat Project Baru

#### Step 1: Tambah entry di `experiences.js`
```javascript
export const projects = [
  {
    id: 'nama-project',
    title: 'Nama Project',
    category: 'Web App',
    description: 'Project web aplikasi untuk X dengan fitur Y.',
    tags: ['Astro', 'TypeScript', 'REST API'],
    link: '/projects/nama-project',
  },
  // ...
];
```

#### Step 2: Buat detail page
Duplikat `src/pages/projects/sigap-mbg.astro` → `nama-project.astro`

Edit frontmatter & konten:
```astro
---
import ProjectLayout from '../../layouts/ProjectLayout.astro';
const meta = {
  title: 'Nama Project — Mahdi Habibi',
  description: 'Deskripsi lengkap project untuk SEO',
};
---

<ProjectLayout meta={meta}>
  <div class="project-header">
    <span class="project-category">Web App</span>
    <h1>Nama Project</h1>
    <p class="project-lead">
      Deskripsi singkat yang menarik (1-2 kalimat).
    </p>
  </div>

  <div class="project-meta">
    <div class="meta-item">
      <span class="meta-label">Timeline</span>
      <span class="meta-value">Agustus - Oktober 2024</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Role</span>
      <span class="meta-value">Full-stack Developer</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Tech Stack</span>
      <span class="meta-value">Astro, TypeScript, Tailwind CSS</span>
    </div>
  </div>

  <section class="project-section">
    <h2>Latar Belakang</h2>
    <p>
      Cerita kenapa project ini dibuat, masalah apa yang diselesaikan.
    </p>
  </section>

  <section class="project-section">
    <h2>Solusi</h2>
    <p>
      Pendekatan teknis yang diambil, fitur utama, arsitektur sistem.
    </p>
  </section>

  <section class="project-section">
    <h2>Hasil</h2>
    <ul>
      <li>Metrik pencapaian 1</li>
      <li>Metrik pencapaian 2</li>
    </ul>
  </section>

  <!-- Opsional: Tambah gambar -->
  <figure class="project-image">
    <img src="/projects/nama-project/screenshot.jpg" alt="Screenshot aplikasi" />
    <figcaption>Caption gambar</figcaption>
  </figure>
</ProjectLayout>
```

#### Step 3: Tambah gambar (opsional)
```
public/projects/nama-project/
├── screenshot.jpg       # Screenshot utama
├── thumb.jpg           # Thumbnail untuk card
└── diagram.png         # Diagram arsitektur
```

---

## 5. Writeups (CTF)

### Lokasi
1. Data: `src/data/experiences.js` → array `writeups`
2. Detail page: `src/pages/writeups/{slug}.astro`
3. Gambar: `public/writeups/{slug}/`

### Format Entry (experiences.js)
```javascript
{
  id: 'itsecdevx26-web',
  title: 'ITSecDevX 2026 - Web Exploitation',
  category: 'Web Security',
  description: 'Writeup challenge "Admin Panel Bypass" dari ITSecDevX CTF.',
  tags: ['SQL Injection', 'XSS', 'IDOR'],
  link: '/writeups/itsecdevx26-web',
}
```

### Cara Buat Writeup Baru

#### Step 1: Tambah entry di `experiences.js`
```javascript
export const writeups = [
  {
    id: 'ctf-nama-challenge',
    title: 'Nama CTF - Challenge Title',
    category: 'Forensics',
    description: 'Deskripsi singkat challenge.',
    tags: ['Wireshark', 'Steganography'],
    link: '/writeups/ctf-nama-challenge',
  },
];
```

#### Step 2: Buat detail page
Duplikat `src/pages/writeups/itsecdevx26-web.astro` → `ctf-nama-challenge.astro`

Struktur writeup:
```astro
<ProjectLayout meta={meta}>
  <div class="project-header">
    <span class="project-category">Forensics</span>
    <h1>Nama CTF - Challenge Title</h1>
    <p class="project-lead">
      Deskripsi challenge singkat.
    </p>
  </div>

  <div class="project-meta">
    <div class="meta-item">
      <span class="meta-label">CTF</span>
      <span class="meta-value">Nama Event CTF 2024</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Category</span>
      <span class="meta-value">Forensics</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Points</span>
      <span class="meta-value">500 pts</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Solves</span>
      <span class="meta-value">12/150 teams</span>
    </div>
  </div>

  <section class="project-section">
    <h2>Challenge Description</h2>
    <blockquote>
      Teks soal challenge (copy-paste dari platform CTF).
    </blockquote>
  </section>

  <section class="project-section">
    <h2>Recon</h2>
    <p>
      Langkah awal eksplorasi, tools yang dipakai, findings awal.
    </p>
    <pre><code>$ wireshark capture.pcap</code></pre>
  </section>

  <section class="project-section">
    <h2>Exploitation</h2>
    <p>Step-by-step exploit:</p>
    <ol>
      <li>Langkah 1: Identifikasi vuln X</li>
      <li>Langkah 2: Craft payload</li>
      <li>Langkah 3: Execute & capture flag</li>
    </ol>
  </section>

  <section class="project-section">
    <h2>Flag</h2>
    <pre><code>FLAG{example_flag_here}</code></pre>
  </section>

  <!-- Tambahkan screenshot -->
  <figure class="project-image">
    <img src="/writeups/ctf-nama-challenge/screenshot1.jpg" alt="Wireshark capture" />
    <figcaption>Packet analysis hasil capture</figcaption>
  </figure>
</ProjectLayout>
```

---

## 6. Skills

### Lokasi
File: `src/components/sections/Skills.astro` (line 4-54)

### Format
```javascript
const categories = [
  {
    name: 'Security',
    icon: 'shield-lock.svg',
    items: [
      { skill: 'CTF', level: 85 },
      { skill: 'Web Exploitation', level: 80 },
      // ...
    ],
  },
];
```

### Cara Edit
1. Ubah `level` (0-100) sesuai self-assessment
2. Tambah/hapus skill di array `items`
3. Untuk Tools & Infra: tambahkan `icon` per item

```javascript
{
  name: 'Tools & Infra',
  icon: 'wrench-terminal.svg',
  isMarquee: true,
  items: [
    { skill: 'Git', level: 85, icon: 'git.svg' },
    { skill: 'Kubernetes', level: 70, icon: 'kubernetes.svg' },  // Buat icon baru
  ],
}
```

---

## 7. Contact

### Lokasi
File: `src/components/sections/Contact.astro` (line 4-23)

### Format
```javascript
const links = [
  {
    label: 'Email',
    value: 'email@example.com',
    href: 'mailto:email@example.com',
    mono: true,
  },
  {
    label: 'GitHub',
    value: 'username',
    href: 'https://github.com/username',
    mono: true,
  },
];
```

### Cara Edit
Ganti `value` dan `href` dengan data asli. Tambah link baru (LinkedIn, Twitter, dsb):

```javascript
{
  label: 'Twitter',
  value: '@username',
  href: 'https://twitter.com/username',
  mono: true,
},
```

---

## 8. Icons Custom

### Format
- SVG 24×24px
- `stroke="#e8e0d4"` (putih warm)
- `stroke-width="1.5"`
- `fill="none"`

### Cara Tambah Icon Baru
1. Buat SVG di Figma/Illustrator (24×24 artboard)
2. Export sebagai SVG
3. Edit file, pastikan format:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e8e0d4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="..."/>
</svg>
```

4. Simpan di `public/icons/{nama}.svg`
5. Gunakan di data dengan key `icon: 'nama.svg'`

---

## 9. SEO & Meta

### OpenGraph Image
Lokasi: `public/og-default.svg`

Buat gambar 1200×630px (PNG/JPG), simpan sebagai `og-default.jpg`.

Edit `src/layouts/Base.astro` (line 18):
```astro
ogImage = '/og-default.jpg',  // Ganti dari .svg
```

### Favicon
Ganti `public/favicon.svg` dengan logo/icon kamu (SVG 32×32 atau 64×64).

---

## 10. Build & Deploy

### Build Lokal
```bash
npm run build
```

Output ada di `dist/` — bisa langsung deploy ke:
- **Netlify**: Drag & drop folder `dist/`
- **Vercel**: Connect repo GitHub
- **GitHub Pages**: Push ke branch `gh-pages`

### Preview Sebelum Deploy
```bash
npm run preview
```

Buka `http://localhost:4321` untuk cek hasil final.

---

## Checklist Konten

- [ ] Foto profil (About section)
- [ ] Teks hero (nama, title, subtitle)
- [ ] Bio About (2 paragraf)
- [ ] Email & sosmed di Contact
- [ ] Achievements (min 3 entry)
- [ ] Projects (min 3 project dengan detail page)
- [ ] Writeups (min 2 writeup dengan detail page)
- [ ] Skills level self-assessment
- [ ] OG image & favicon
- [ ] Build & test lokal
- [ ] Deploy ke hosting

---

## Tips

1. **Gambar:** Compress dulu pakai TinyPNG/Squoosh sebelum upload (target <200KB/gambar)
2. **Writeup:** Hindari copas command/code tanpa format — pakai \`code inline\` atau blok code
3. **SEO:** Setiap detail page punya `title` & `description` unik
4. **Git:** Commit per section (foto, projects, writeups) biar mudah rollback
5. **Backup:** Simpan `content.ts` & `experiences.js` original sebelum edit besar

---

Butuh bantuan? Cek struktur file existing sebagai referensi.
