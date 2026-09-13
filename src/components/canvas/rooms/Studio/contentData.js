/**
 * Studio Content Data
 * 
 * Platforms: 'github', 'linkedin', 'x', 'discord', 'instagram', 'mail'
 */

export const PLATFORM_CONFIG = {
    github: {
        color: '#ffffff',
        accentColor: '#333333',
        icon: '⌨',
        label: 'GitHub',
        shape: 'monitor',
    },
    linkedin: {
        color: '#0077B5',
        accentColor: '#005E93',
        icon: 'in',
        label: 'LinkedIn',
        shape: 'monitor',
    },
    x: {
        color: '#000000',
        accentColor: '#14171A',
        icon: '𝕏',
        label: 'X',
        shape: 'monitor',
    },
    discord: {
        color: '#5865F2',
        accentColor: '#4752C4',
        icon: '🎮',
        label: 'Discord',
        shape: 'monitor',
    },
    instagram: {
        color: '#E1306C',
        accentColor: '#C13584',
        icon: '📷',
        label: 'Instagram',
        shape: 'phone',
    },
    mail: {
        color: '#EA4335',
        accentColor: '#D93025',
        icon: '✉',
        label: 'Email',
        shape: 'monitor',
    },
};

// Per-device, per-face color configuration
// Order: [right, left, top, bottom, front, back] — matches faceConfig index in StudioRoom
export const DEVICE_COLORS = {
    monitor: {
        right:  '#343941', // Slate
        left:   '#343941', // Slate
        top:    '#77736C', // Metallic Taupe
        bottom: '#77736C', // Metallic Taupe
        front:  '#20242A', // Dark Slate
        back:   '#343941', // Slate
    },
    tv: {
        right:  '#292B2F', // Warm Charcoal
        left:   '#292B2F', // Warm Charcoal
        top:    '#5A5C60', // Soft Metallic
        bottom: '#5A5C60', // Soft Metallic
        front:  '#17191C', // Deep Graphite
        back:   '#292B2F', // Warm Charcoal
    },
    phone: {
        right:  '#4A4037', // Muted Bronze
        left:   '#4A4037', // Muted Bronze
        top:    '#4A4037', // Muted Bronze
        bottom: '#4A4037', // Muted Bronze
        front:  '#111318', // Near Black
        back:   '#4A4037', // Muted Bronze
    },
};

const RAW_CONTENT_DATA = [
    // ============ GitHub ============
    {
        id: 'gh-001',
        platform: 'github',
        title: 'agent-conductor',
        description: 'Multi-agent orchestrator — runs Codex CLI and OpenCode CLI simultaneously on isolated git worktrees.',
        thumbnail: null,
        url: 'https://github.com/a18-n03/agent-conductor',
        date: '2026-01-10',
    },
    {
        id: 'gh-002',
        platform: 'github',
        title: 'mini-gpt',
        description: 'GPT-style transformer from scratch in pure PyTorch — char-level, trained on Marathi Wikipedia.',
        thumbnail: null,
        url: 'https://github.com/anu-mhatre-1812/mini-gpt',
        date: '2025-12-15',
    },
    {
        id: 'gh-003',
        platform: 'github',
        title: 'draco-cli',
        description: 'Zero-login, terminal-first AI coding agent for the OpenCode Zen API.',
        thumbnail: null,
        url: 'https://github.com/a18-n03/draco-cli',
        date: '2025-11-20',
    },
    {
        id: 'gh-004',
        platform: 'github',
        title: 'dsa-tutor-rag',
        description: 'Advanced RAG over DSA notes — hybrid search, cross-encoder reranking, citations.',
        thumbnail: null,
        url: 'https://github.com/a18-n03/dsa-tutor-rag',
        date: '2025-10-28',
    },

    // ============ LinkedIn ============
    {
        id: 'li-001',
        platform: 'linkedin',
        title: 'AI Agent Frameworks',
        description: 'Building autonomous systems that think, plan, and execute. My journey into agentic AI.',
        thumbnail: null,
        url: 'https://www.linkedin.com/in/anuj-mhatre-031807ma',
        date: '2026-01-08',
    },
    {
        id: 'li-002',
        platform: 'linkedin',
        title: 'Hardware + Software',
        description: 'Why every engineer should touch a soldering iron at least once.',
        thumbnail: null,
        url: 'https://www.linkedin.com/in/anuj-mhatre-031807ma',
        date: '2025-12-20',
    },
    {
        id: 'li-003',
        platform: 'linkedin',
        title: 'BTech CSE (AI & ML)',
        description: 'Starting my journey at Chhatrapati Shivaji Maharaj University, Navi Mumbai.',
        thumbnail: null,
        url: 'https://www.linkedin.com/in/anuj-mhatre-031807ma',
        date: '2025-11-15',
    },

    // ============ X (Twitter) ============
    {
        id: 'x-001',
        platform: 'x',
        title: 'Late night coding sessions',
        description: '3AM terminal glow hits different when you\'re building your own AI.',
        thumbnail: null,
        url: 'https://x.com/MhatreAnuj1814',
        date: '2026-01-09',
    },
    {
        id: 'x-002',
        platform: 'x',
        title: 'PCB soldering wins',
        description: 'First time hand-soldering a macro-pad. Burns and all.',
        thumbnail: null,
        url: 'https://x.com/MhatreAnuj1814',
        date: '2025-12-25',
    },
    {
        id: 'x-003',
        platform: 'x',
        title: 'Trading bot results',
        description: 'When your bot outperforms your sleep schedule.',
        thumbnail: null,
        url: 'https://x.com/MhatreAnuj1814',
        date: '2025-11-30',
    },

    // ============ Discord ============
    {
        id: 'dc-001',
        platform: 'discord',
        title: 'Community Builder',
        description: 'Active in AI/ML and web dev communities. Let\'s connect and build together.',
        thumbnail: null,
        url: 'https://discord.com/users/anujmhatre_2007',
        date: '2026-01-05',
    },
    {
        id: 'dc-002',
        platform: 'discord',
        title: 'Open Source Collab',
        description: 'Looking for contributors for agent-conductor and draco-cli.',
        thumbnail: null,
        url: 'https://discord.com/users/anujmhatre_2007',
        date: '2025-12-10',
    },

    // ============ Instagram ============
    {
        id: 'ig-001',
        platform: 'instagram',
        title: 'Behind the Scenes',
        description: 'My desk setup — soldering station, multiple monitors, and too many cables.',
        thumbnail: null,
        url: 'https://www.instagram.com/anu__m.1812',
        date: '2026-01-07',
    },
    {
        id: 'ig-002',
        platform: 'instagram',
        title: 'Project Showcases',
        description: 'Visual breakdowns of my hardware and software projects.',
        thumbnail: null,
        url: 'https://www.instagram.com/anu__m.1812',
        date: '2025-12-18',
    },
    {
        id: 'ig-003',
        platform: 'instagram',
        title: 'Daily Dev Life',
        description: 'What it looks like to be a restless builder in 2026.',
        thumbnail: null,
        url: 'https://www.instagram.com/anu__m.1812',
        date: '2025-11-25',
    },

    // ============ Mail ============
    {
        id: 'ml-001',
        platform: 'mail',
        title: 'Let\'s Collaborate',
        description: 'Got a project idea or want to work together? Drop me a line.',
        thumbnail: null,
        url: 'mailto:anujmhatre125@gmail.com',
        date: '2026-01-01',
    },
    {
        id: 'ml-002',
        platform: 'mail',
        title: 'Freelance Inquiries',
        description: 'Available for AI/ML consulting, hardware prototyping, and web dev.',
        thumbnail: null,
        url: 'mailto:anujmhatre125@gmail.com',
        date: '2025-12-01',
    },
];

export const CONTENT_DATA = RAW_CONTENT_DATA;

export const getContentByPlatform = (platform) => {
    if (platform === 'all') return CONTENT_DATA;
    return CONTENT_DATA.filter(item => item.platform === platform);
};

export const getLatestContent = () => {
    return [...CONTENT_DATA].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
};
