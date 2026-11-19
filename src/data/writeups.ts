// Sumber tunggal data CTF writeups.
// Dipakai halaman writeups, terminal, artikel prev/next, dan konteks Kevin.

export interface Writeup {
  id: string;
  title: string;
  event: string;
  year: string;
  category: string;
  tags: string[];
}

export const writeups: Writeup[] = [
  {
    id: 'itsecdevx26-web',
    title: 'SQL Injection via Login Bypass',
    event: 'itsecdevx26 CTF',
    year: '2024',
    category: 'Web Exploitation',
    tags: ['SQLi', 'auth bypass'],
  },
  {
    id: 'itsecdevx26-forensics',
    title: 'Memory Dump Analysis',
    event: 'itsecdevx26 CTF',
    year: '2024',
    category: 'Forensics',
    tags: ['volatility', 'memory'],
  },
  {
    id: 'placeholder-xss',
    title: 'XSS to Admin Takeover',
    event: 'CTF Event Placeholder',
    year: '2024',
    category: 'Web Exploitation',
    tags: ['XSS', 'session'],
  },
  {
    id: 'placeholder-crypto',
    title: 'RSA Key Recovery',
    event: 'CTF Event Placeholder',
    year: '2025',
    category: 'Cryptography',
    tags: ['RSA', 'crypto'],
  },
];
