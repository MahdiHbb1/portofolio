import { projects } from './projects.ts';

export type Lang = 'id' | 'en';

function buildProjectDescMap(lang: Lang): Record<string, { desc: string }> {
  const map: Record<string, { desc: string }> = {};
  for (const project of projects) {
    map[project.id] = { desc: project.desc[lang] };
  }
  return map;
}

export const content = {
  id: {
    hero: {
      name: 'Mahdi Habibi',
      title: 'Security & ML Engineer',
      subtitle: 'Informatika UNNES · CTF · PKM-KC',
      ctaWork: 'Lihat Karya',
      ctaContact: 'Hubungi Saya',
    },
    about: {
      label: 'Tentang',
      heading: 'Siapa Saya',
      bio1: 'Mahasiswa Informatika di Universitas Negeri Semarang. Saat ini menjabat sebagai Kepala Divisi IT Security di CODELINES UKM RIPTEK UNNES dan aktif berkompetisi di Capture The Flag.',
      bio2: 'Paralel dengan itu, mengerjakan bagian ML dan web development untuk SIGAP MBG, proyek PKM-KC yang sudah lolos pendanaan. Tertarik di persimpangan antara keamanan sistem, machine learning, dan produk yang bisa dipakai orang beneran.',
    },
    skills: {
      label: 'Keahlian',
      heading: 'Skills',
    },
    achievements: {
      label: 'Pencapaian',
      heading: 'Achievements',
      certificate: 'Lihat sertifikat',
      items: {
        pkmkcSilver: {
          desc: 'Medali perak Room KC 1 pada PKM Asosiasi MIPA LPTK Indonesia 2026 untuk SIGAP MBG.',
        },
        pkmkc: {
          desc: 'Pendanaan nasional untuk sistem monitoring berbasis ML SIGAP MBG',
        },
        ctf: {
          desc: 'Kompetisi CTF: web exploitation & forensics',
        },
        fabricCnn: {
          desc: 'Deteksi cacat tekstil berbasis CNN: publikasi dalam proses',
        },
        aiHackathon: {
          desc: 'BuktiTagih AI: verifikasi invoice OCR dalam 48 jam',
        },
      },
    },
    projects: {
      label: 'Karya',
      heading: 'Projects',
      items: buildProjectDescMap('id'),
    },
    project: {
      back: 'Semua project',
      screenshotsLabel: 'Preview',
      screenshotsHeading: 'Cuplikan Preview',
      screenshotsEmptyTitle: 'Cuplikan Preview: Segera hadir',
      screenshotsEmptyHint: 'Screenshot untuk project ini akan tampil di sini setelah ditambahkan ke public/images/projects/.',
      modalView: 'Lihat Project →',
      modalBack: '← Kembali ke Galeri',
      featuredBadge: 'UNGGULAN',
    },
    writeups: {
      label: 'Keamanan',
      heading: 'CTF Writeups',
    },
    terminal: {
      label: 'Playground',
      heading: 'Terminal',
      hint: 'Bukan tangkapan layar, ini shell beneran. Ketik help buat mulai, intip isi filesystem-nya, siapa tahu ada yang menarik.',
    },
    contact: {
      label: 'Kontak',
      heading: 'Hubungi Saya',
      subtitle: 'Terbuka untuk kolaborasi, diskusi CTF, atau sekadar ngobrol soal security dan ML.',
    },
  },
  en: {
    hero: {
      name: 'Mahdi Habibi',
      title: 'Security & ML Engineer',
      subtitle: 'Computer Science UNNES · CTF · PKM-KC',
      ctaWork: 'View Work',
      ctaContact: 'Get in Touch',
    },
    about: {
      label: 'About',
      heading: 'Who I Am',
      bio1: 'Computer Science student at Universitas Negeri Semarang. Currently serving as Head of IT Security Division at CODELINES UKM RIPTEK UNNES and actively competing in Capture The Flag competitions.',
      bio2: 'In parallel, working on ML and web development for SIGAP MBG, a PKM-KC project that secured national funding. Interested in the intersection of system security, machine learning, and products people actually use.',
    },
    skills: {
      label: 'Expertise',
      heading: 'Skills',
    },
    achievements: {
      label: 'Recognition',
      heading: 'Achievements',
      certificate: 'View certificate',
      items: {
        pkmkcSilver: {
          desc: 'Silver medal in Room KC 1 at PKM Asosiasi MIPA LPTK Indonesia 2026 for SIGAP MBG.',
        },
        pkmkc: {
          desc: 'National funding for SIGAP MBG ML-powered monitoring system',
        },
        ctf: {
          desc: 'CTF competition: web exploitation & forensics',
        },
        fabricCnn: {
          desc: 'CNN-based textile defect detection: pending publication',
        },
        aiHackathon: {
          desc: 'BuktiTagih AI: OCR invoice verification in 48h',
        },
      },
    },
    projects: {
      label: 'Work',
      heading: 'Projects',
      items: buildProjectDescMap('en'),
    },
    project: {
      back: 'All projects',
      screenshotsLabel: 'Preview',
      screenshotsHeading: 'Preview Screenshots',
      screenshotsEmptyTitle: 'Preview Screenshots: Coming soon',
      screenshotsEmptyHint: 'Screenshots for this project will appear here once added to public/images/projects/.',
      modalView: 'View Project →',
      modalBack: '← Back to Overview',
      featuredBadge: 'FEATURED',
    },
    writeups: {
      label: 'Security',
      heading: 'CTF Writeups',
    },
    terminal: {
      label: 'Playground',
      heading: 'Terminal',
      hint: 'Not a screenshot. A real shell, running right here. Type help to start, poke around the filesystem, see if anything interesting turns up.',
    },
    contact: {
      label: 'Contact',
      heading: 'Get in Touch',
      subtitle: 'Open for collaboration, CTF discussions, or just chatting about security and ML.',
    },
  },
};
