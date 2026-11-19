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
  /** Canonical kebab-case slug matching src/pages/projects/<id>.astro. */
  id: string;
  /** Compact UI display name used on homepage cards, 3D panels, and headings. */
  name: string;
  /** Longer title preserved for prev/next nav, AI context, and SEO/OG parity. */
  fullTitle?: string;
  category: LocalizedText;
  year: string;
  featured: boolean;
  gradient: string;
  cardColor: number;
  tags: string[];
  /** Public UI copy (pending projects keep explicit placeholder labels). */
  desc: LocalizedText;
  /** English background summary consumed by Kevin AI, Terminal, and JSON-LD. */
  aiSummary: string;
  achievements?: string[];
  screenshots?: ProjectScreenshot[];
}

export const projects: ProjectEntry[] = [
  {
    id: 'sigap-mbg',
    name: 'SIGAP MBG',
    category: {
      id: 'Hardware + Software',
      en: 'Hardware + Software',
    },
    year: '2025',
    featured: true,
    gradient: 'linear-gradient(135deg, rgba(232, 224, 212, 0.08), rgba(160, 120, 80, 0.12))',
    cardColor: 0x0f1519,
    tags: ['PKM-KC', 'ML', 'IoT'],
    desc: {
      id: 'Sistem monitoring berbasis ML untuk program makan bergizi gratis nasional. Mendapat pendanaan PKM-KC nasional.',
      en: 'ML-powered monitoring system for national free nutritious meal program. Secured PKM-KC national funding.',
    },
    aiSummary:
      "ML-powered monitoring system for Indonesia's national free nutritious meal program (Program Makan Bergizi Gratis). Secured PKM-KC national funding in 2025 and won Silver Medal in Room KC 1 at PKM AMLI 2026. Combines IoT sensors with machine learning for real-time monitoring and quality assurance.",
    achievements: [
      'Medali Perak Room KC 1 at PKM AMLI 2026',
      'Secured PKM-KC national funding from Kemdikbud',
      'Real-time ML-powered monitoring system',
      'IoT hardware integration',
    ],
  },
  {
    id: 'fraudlens',
    name: 'FraudLens',
    category: {
      id: 'Deteksi Penipuan',
      en: 'Fraud Detection',
    },
    year: '2025',
    featured: false,
    gradient: 'linear-gradient(135deg, rgba(255, 120, 60, 0.08), rgba(139, 115, 85, 0.12))',
    cardColor: 0x1a1410,
    tags: ['Security', 'ML', 'Fraud Detection'],
    desc: {
      id: 'Placeholder: tambahkan deskripsi project.',
      en: 'Placeholder: add project description.',
    },
    aiSummary:
      'AI-based online fraud detection system developed and applied at BMT Insan Mandiri in December 2025 to identify suspicious transactions and patterns.',
  },
  {
    id: 'fabric-cnn',
    name: 'Fabric Defect CNN',
    fullTitle: 'Fabric Defect Detection CNN',
    category: {
      id: 'Computer Vision',
      en: 'Computer Vision',
    },
    year: '2024',
    featured: false,
    gradient: 'linear-gradient(135deg, rgba(100, 150, 200, 0.08), rgba(107, 93, 79, 0.12))',
    cardColor: 0x0e1318,
    tags: ['Deep Learning', 'CNN', 'Computer Vision'],
    desc: {
      id: 'Placeholder: tambahkan deskripsi project.',
      en: 'Placeholder: add project description.',
    },
    aiSummary:
      'CNN-based system for detecting defects in textile fabrics using computer vision. Research paper pending publication. Uses deep learning for automated quality control in textile manufacturing.',
    achievements: [
      'Publication in progress',
      'Automated textile quality control',
    ],
  },
  {
    id: 'legalin',
    name: 'LegalIn',
    category: {
      id: 'Asisten Legal AI',
      en: 'AI Legal Assistant',
    },
    year: '2024',
    featured: false,
    gradient: 'linear-gradient(135deg, rgba(120, 180, 120, 0.08), rgba(107, 93, 79, 0.12))',
    cardColor: 0x101814,
    tags: ['AI', 'Web', 'Legal Tech'],
    desc: {
      id: 'Placeholder: tambahkan deskripsi project.',
      en: 'Placeholder: add project description.',
    },
    aiSummary:
      'AI-powered legal assistant application for Indonesian law. Helps users understand legal documents and get basic legal information.',
  },
  {
    id: 'buktitagih',
    name: 'BuktiTagih AI',
    category: {
      id: 'Hackathon',
      en: 'Hackathon',
    },
    year: '2024',
    featured: false,
    gradient: 'linear-gradient(135deg, rgba(160, 100, 200, 0.08), rgba(107, 93, 79, 0.12))',
    cardColor: 0x181410,
    tags: ['AI', 'Hackathon', 'OCR'],
    desc: {
      id: 'Placeholder: tambahkan deskripsi project.',
      en: 'Placeholder: add project description.',
    },
    aiSummary:
      'OCR-based invoice verification system built in 48 hours for AI hackathon. Automatically extracts and verifies invoice data using computer vision and OCR technology.',
    achievements: [
      'Built in 48 hours',
      'OCR invoice verification',
    ],
  },
  {
    id: 'ctf-itsecdevx26',
    name: 'CTF itsecdevx26',
    category: {
      id: 'Tantangan Keamanan',
      en: 'Security Challenge',
    },
    year: '2024',
    featured: false,
    gradient: 'linear-gradient(135deg, rgba(200, 80, 80, 0.08), rgba(139, 115, 85, 0.12))',
    cardColor: 0x13100e,
    tags: ['CTF', 'Web Security', 'Forensics'],
    desc: {
      id: 'Placeholder: tambahkan deskripsi challenge.',
      en: 'Placeholder: add challenge description.',
    },
    aiSummary:
      'Participated in itsecdevx26 CTF competition, solving web exploitation and forensics challenges.',
  },
  {
    id: 'ctf-writeups',
    name: 'CTF Writeups',
    fullTitle: 'CTF Writeups Collection',
    category: {
      id: 'Writeups',
      en: 'Writeups',
    },
    year: '2024–2025',
    featured: false,
    gradient: 'linear-gradient(135deg, rgba(255, 180, 100, 0.08), rgba(139, 115, 85, 0.12))',
    cardColor: 0x141118,
    tags: ['CTF', 'Writeups', 'Security'],
    desc: {
      id: 'Kumpulan writeup dari berbagai kompetisi CTF.',
      en: 'Collection of writeups from various CTF competitions.',
    },
    aiSummary:
      'Collection of detailed writeups from various CTF competitions, documenting solutions to web exploitation, forensics, cryptography, and other security challenges.',
  },
];

export function getProjectById(id: string): ProjectEntry | undefined {
  return projects.find((project) => project.id === id);
}

export function getLocalizedProject(project: ProjectEntry, lang: 'id' | 'en') {
  return {
    id: project.id,
    name: project.name,
    fullTitle: project.fullTitle ?? project.name,
    category: project.category[lang],
    year: project.year,
    featured: project.featured,
    tags: project.tags,
    desc: project.desc[lang],
    screenshots: (project.screenshots ?? []).map((shot) => ({
      src: shot.src,
      alt: shot.alt[lang],
      caption: shot.caption?.[lang],
    })),
  };
}
