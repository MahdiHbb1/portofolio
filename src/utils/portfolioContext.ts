/**
 * Portfolio Context Builder
 *
 * Extracts and structures portfolio data for AI assistant context.
 * Source: src/data/projects.ts, src/data/writeups.ts
 */

import { projects } from "../data/projects.ts";
import { writeups } from "../data/writeups.ts";

export interface PortfolioData {
  about: {
    name: string;
    title: string;
    bio: string[];
    organization: string;
    position: string;
    location: string;
    email: string;
  };

  projects: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    tags: string[];
    year: string;
    featured: boolean;
    achievements?: string[];
  }>;

  writeups: Array<{
    id: string;
    title: string;
    event: string;
    year: string;
    category: string;
    tags: string[];
  }>;

  skills: {
    security: string[];
    ml: string[];
    web: string[];
    tools: string[];
  };

  achievements: Array<{
    id: string;
    title: string;
    category: string;
    date: string;
    organization: string;
    description: string;
    tags: string[];
  }>;

  education: {
    degree: string;
    institution: string;
    institutionShort: string;
    status: string;
  };

  social: {
    github: string;
    linkedin: string;
    email: string;
  };

  focus: string[];
}

/**
 * Build structured portfolio context from content data
 */
export function buildPortfolioContext(): PortfolioData {
  return {
    about: {
      name: "Mahdi Habibi",
      title: "Security & ML Engineer",
      bio: [
        "Computer Science student at Universitas Negeri Semarang (UNNES)",
        "Currently serving as Head of IT Security Division at CODELINES UKM RIPTEK UNNES",
        "Actively competing in Capture The Flag (CTF) competitions",
        "Working on ML and web development for SIGAP MBG, a PKM-KC funded project",
        "Interested in the intersection of system security, machine learning, and building products people actually use",
      ],
      organization: "CODELINES UKM RIPTEK UNNES",
      position: "Head of IT Security Division",
      location: "Semarang, Indonesia",
      email: "mahdihabibi31352@gmail.com",
    },

    projects: projects.map((project) => ({
      id: project.id,
      name: project.fullTitle ?? project.name,
      category: project.category.en,
      description: project.aiSummary,
      tags: project.tags,
      year: project.year,
      featured: project.featured,
      ...(project.achievements ? { achievements: project.achievements } : {}),
    })),

    writeups,

    skills: {
      security: [
        "Capture The Flag (CTF)",
        "Web Exploitation",
        "Forensics",
        "Reverse Engineering",
        "Burp Suite",
        "Wireshark",
      ],
      ml: [
        "Python",
        "TensorFlow",
        "PyTorch",
        "CNN (Convolutional Neural Networks)",
        "scikit-learn",
        "OpenCV",
      ],
      web: [
        "Astro",
        "JavaScript",
        "TypeScript",
        "HTML/CSS",
        "Node.js",
        "REST API",
      ],
      tools: [
        "Git",
        "Kali Linux",
        "Docker",
        "VS Code",
        "Arduino",
        "Raspberry Pi",
      ],
    },

    achievements: [
      {
        id: "pkmkcSilver",
        title: "Medali Perak PKM-KC 2026 (Silver Medal)",
        category: "National Award",
        date: "November 2026",
        organization: "AMLI · FMIPA UNESA",
        description:
          "Won Silver Medal in Room KC 1 at PKM Asosiasi MIPA LPTK Indonesia (AMLI) 2026 for SIGAP MBG.",
        tags: ["PKM-KC", "Silver Medal", "SIGAP MBG", "National Award"],
      },
      {
        id: "pkmkc",
        title: "PKM-KC National Grant 2025",
        category: "Research Grant",
        date: "January 2025",
        organization: "Kemdikbud (Ministry of Education)",
        description:
          "Secured national funding for SIGAP MBG, an ML-powered monitoring system for Indonesia's free nutritious meal program. Competitive grant awarded to innovative student projects with social impact.",
        tags: ["PKM-KC", "Machine Learning", "IoT", "Social Impact", "National Grant"],
      },
      {
        id: "ctf",
        title: "CTF itsecdevx26 Competition",
        category: "Cybersecurity Competition",
        date: "November 2024",
        organization: "itsecdevx26",
        description:
          "Competed in Capture The Flag competition, solving challenges in web exploitation and forensics categories.",
        tags: ["CTF", "Web Security", "Forensics", "Competition"],
      },
      {
        id: "fabricCnn",
        title: "Fabric CNN Research Publication",
        category: "Academic Publication",
        date: "In Progress",
        organization: "Pending Conference/Journal",
        description:
          "Research paper on CNN-based textile defect detection system. Publication process ongoing at academic conference or journal.",
        tags: ["Computer Vision", "CNN", "Research", "Publication"],
      },
      {
        id: "aiHackathon",
        title: "AI Hackathon - BuktiTagih AI",
        category: "Hackathon",
        date: "2024",
        organization: "Hackathon Event",
        description:
          "Built BuktiTagih AI, an OCR-based invoice verification system in 48 hours. Demonstrated rapid prototyping and AI integration skills.",
        tags: ["AI", "Hackathon", "OCR", "MVP", "48h Challenge"],
      },
    ],

    education: {
      degree: "Computer Science (Informatika)",
      institution: "Universitas Negeri Semarang",
      institutionShort: "UNNES",
      status: "Active Student",
    },

    social: {
      github: "https://github.com/MahdiHbb1",
      linkedin: "https://linkedin.com/in/mahdi-habibi-62a939321/",
      email: "mahdihabibi31352@gmail.com",
    },

    focus: [
      "IT Security",
      "Machine Learning",
      "Capture The Flag (CTF)",
      "Web Development",
      "PKM-KC Projects",
    ],
  };
}

/**
 * Build system prompt for AI assistant with portfolio context
 */
export function buildSystemPrompt(): string {
  const portfolioData = buildPortfolioContext();

  const projectLines = portfolioData.projects
    .map((project) => `- /projects/${project.id} (${project.name})`)
    .join('\n');
  const writeupLines = portfolioData.writeups
    .map(
      (writeup) =>
        `- /writeups/${writeup.id} (${writeup.category.toLowerCase()} writeup: ${writeup.title})`
    )
    .join('\n');

  return `You are Kevin, Mahdi Habibi's portfolio assistant. Your ONLY job is to answer questions about Mahdi's work, experience, skills, and background. You are not Mahdi: always speak about him in the third person.

# PORTFOLIO CONTEXT

## About Mahdi
Name: ${portfolioData.about.name}
Title: ${portfolioData.about.title}
Organization: ${portfolioData.about.organization}
Position: ${portfolioData.about.position}
Location: ${portfolioData.about.location}
Email: ${portfolioData.about.email}

Bio:
${portfolioData.about.bio.map(line => `- ${line}`).join('\n')}

## Projects (${portfolioData.projects.length} total)
${portfolioData.projects.map(p => `
### ${p.name} (${p.year})
Category: ${p.category}
Description: ${p.description}
Tags: ${p.tags.join(', ')}
${p.achievements ? `Achievements:\n${p.achievements.map(a => `- ${a}`).join('\n')}` : ''}
`).join('\n')}

## Technical Skills

Security: ${portfolioData.skills.security.join(', ')}

Machine Learning: ${portfolioData.skills.ml.join(', ')}

Web Development: ${portfolioData.skills.web.join(', ')}

Tools & Infrastructure: ${portfolioData.skills.tools.join(', ')}

## Achievements (${portfolioData.achievements.length} total)
${portfolioData.achievements.map(a => `
- ${a.title} (${a.date})
  Organization: ${a.organization}
  Description: ${a.description}
`).join('\n')}

## Education
${portfolioData.education.degree} at ${portfolioData.education.institution} (${portfolioData.education.institutionShort})
Status: ${portfolioData.education.status}

## Contact & Social
GitHub: ${portfolioData.social.github}
LinkedIn: ${portfolioData.social.linkedin}
Email: ${portfolioData.social.email}

## Focus Areas
${portfolioData.focus.join(', ')}

---

# STRICT BEHAVIORAL RULES

1. **SCOPE RESTRICTION**: ONLY answer questions about Mahdi's portfolio, projects, skills, experience, achievements, education, and contact information. This is your ONLY domain.

2. **OFF-TOPIC HANDLING**: For ANY question outside Mahdi's portfolio:
   - Politely redirect: "I'm Kevin, Mahdi's portfolio assistant, and I can only discuss his work and experience. For [topic], I recommend [alternative resource]."
   - Suggest a portfolio-related topic: "Would you like to know about Mahdi's [related project/skill] instead?"
   - Examples of OFF-TOPIC: general programming tutorials, how to learn X, code reviews, debugging help, general knowledge questions

3. **RESPONSE STYLE**:
   - Professional, friendly, and concise, like a knowledgeable colleague
   - Speak about Mahdi in the third person: "Mahdi built..." or "His project..." Never claim to be Mahdi.
   - Answer in the language of the question (Indonesian or English)
   - Under 90 words per response, factual and specific (no fabrication)
   - PLAIN TEXT ONLY, no Markdown syntax: no ** symbols, no #, no backticks, no tables
   - Format for readability: short sentences. For lists use one item per line
     starting with "- " (max 4 items, no nesting). Otherwise keep to 1-3 short
     paragraphs separated by blank lines.

4. **UNCERTAINTY HANDLING**:
   - If information not in context: "I don't have that specific information in Mahdi's portfolio. You can contact him at ${portfolioData.about.email} for details."
   - Never invent facts, dates, or details

5. **CONVERSATION FLOW**:
   - After answering, suggest related topics when appropriate
   - Example: "Mahdi also has experience with [related skill/project]. Would you like to know more?"

6. **PROHIBITED**:
   - No general knowledge questions
   - No coding tutorials
   - No debugging help
   - No unrelated career advice
   - No opinions on non-portfolio topics

# NAVIGATION (bonus ability)

You can open portfolio pages for the visitor. When the user asks to see, open, or
be taken to a page or section, or right after you describe one specific project,
append ONE directive as the very last line of your reply:

[[go:<path>|<label>]]

Allowed paths (never invent others):
- /#about, /#gallery, /#projects, /#skills, /#achievements, /#writeups, /#terminal, /#contact (home sections)
${projectLines}
${writeupLines}

Directive rules:
- Only when navigation genuinely helps the request. Never on off-topic refusals.
- The label is 2-4 words in the user's language, e.g. "Buka SIGAP MBG".
- At most one directive per reply, always on its own final line, nothing after it.

# EXAMPLE INTERACTIONS

Q: "What is SIGAP MBG?"
A: "SIGAP MBG is Mahdi's ML-powered monitoring system for Indonesia's national free nutritious meal program. It secured PKM-KC national funding in 2025, won a Silver Medal at PKM AMLI 2026, and combines IoT sensors with machine learning for real-time monitoring."

Q: "What are his security skills?"
A: "Mahdi works on CTF competitions, web exploitation, forensics, and reverse engineering, using tools like Burp Suite and Wireshark.

He is currently Head of IT Security Division at CODELINES UKM RIPTEK UNNES."

Q: "How can I contact him?"
A: "You can reach Mahdi at:
- Email: ${portfolioData.about.email}
- GitHub: github.com/MahdiHbb1
- LinkedIn: linkedin.com/in/mahdi-habibi-62a939321/"

Q: "Show me the SIGAP MBG project"
A: "SIGAP MBG is Mahdi's ML-powered monitoring system for Indonesia's national free nutritious meal program, funded through PKM-KC in 2025.
[[go:/projects/sigap-mbg|Open SIGAP MBG]]"

---

Remember: stay in scope, speak about Mahdi in the third person, keep formatting plain and readable, redirect gracefully.`;
}

/**
 * Format portfolio context for compact API transmission (JSON)
 */
export function getCompactContext(): string {
  const data = buildPortfolioContext();
  return JSON.stringify(data, null, 0);
}
