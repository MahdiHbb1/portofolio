import type { ProjectEntry } from '../../data/projects.ts';

export interface OrbitLayerSpec {
  projectIds: string[];
  radius: number;
  speed: number;
  axis: [number, number, number];
}

/**
 * Decouples 3D orbital ring placement from homepage grid order so sigap-mbg
 * can stay featured first in Projects while preserving the 3-ring orbit layout.
 */
export const ORBIT_LAYER_SPECS: OrbitLayerSpec[] = [
  { projectIds: ['fraudlens', 'fabric-cnn'], radius: 2.4, speed: 0.07, axis: [0, 1, 0] },
  { projectIds: ['legalin', 'buktitagih', 'sigap-mbg'], radius: 3.6, speed: 0.14, axis: [0.25, 1, 0.15] },
  { projectIds: ['ctf-itsecdevx26', 'ctf-writeups'], radius: 5.2, speed: 0.24, axis: [0.08, 1, 0.28] },
];

export interface CardRenderModel {
  id: string;
  title: string;
  category: string;
  year: string;
  featured: boolean;
  cardColor: number;
  descLines: string[];
  tags: string[];
}

function truncateLine(line: string, maxChars: number): string {
  if (maxChars <= 0) return '';
  if (line.length <= maxChars) {
    if (maxChars === 1) return '…';
    return `${line.slice(0, maxChars - 1).trimEnd()}…`;
  }
  return `${line.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

export function wrapCardText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  if (maxCharsPerLine <= 0 || maxLines <= 0) return [];
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = '';
  let truncated = false;

  const pushLine = (line: string): boolean => {
    if (lines.length < maxLines) {
      lines.push(line);
      return true;
    }
    truncated = true;
    return false;
  };

  for (let wi = 0; wi < words.length; wi++) {
    let word = words[wi];

    while (word.length > maxCharsPerLine) {
      if (current) {
        if (!pushLine(current)) break;
        current = '';
      }
      const chunk = word.slice(0, maxCharsPerLine);
      word = word.slice(maxCharsPerLine);
      if (word.length > 0) {
        if (!pushLine(chunk)) break;
      } else {
        current = chunk;
      }
    }

    if (truncated) break;

    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxCharsPerLine) {
      current = `${current} ${word}`;
    } else {
      if (!pushLine(current)) {
        current = '';
        break;
      }
      current = word;
    }

    if (lines.length === maxLines) {
      if (current || wi < words.length - 1) truncated = true;
      current = '';
      break;
    }
  }

  if (current && !truncated) {
    pushLine(current);
  }

  if (truncated && lines.length > 0) {
    const lastIdx = lines.length - 1;
    lines[lastIdx] = truncateLine(lines[lastIdx], maxCharsPerLine);
  }

  return lines;
}

export function buildCardModel(project: ProjectEntry, lang: 'id' | 'en'): CardRenderModel {
  return {
    id: project.id,
    title: project.name,
    category: project.category[lang],
    year: project.year,
    featured: project.featured,
    cardColor: project.cardColor,
    descLines: wrapCardText(project.desc[lang], 46, 3),
    tags: project.tags.slice(0, 3),
  };
}
