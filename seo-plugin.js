/**
 * SEO Plugin — Generates JSON-LD, semantic HTML, and llms.txt at build time.
 * Uses hardcoded Anuj Mhatre data (Sanity CMS disabled).
 */

const SITE_URL = 'https://anujmhatre.me';

const ANUJ_DATA = {
    siteTitle: 'Anuj Mhatre | Creative 3D Portfolio',
    siteDescription: 'Interactive 3D developer portfolio by Anuj Mhatre. Explore AI agents, hardware projects, React & GSAP animations in a hand-drawn gallery.',
    aboutMe: 'Anuj Mhatre is a relentless creative engineer and full-stack developer from Navi Mumbai, India. He builds AI agents (JARVIS, MAU, NEXUS, Draco), PCB hardware, trading bots, and immersive web experiences. Currently pursuing BTech CSE (AI & ML) at Chhatrapati Shivaji Maharaj University. His philosophy: I don\'t wait for the right tool — I build it.',
    name: 'Anuj Mhatre',
    alternateNames: ['A18-N03', 'anu__m.1812'],
    jobTitle: 'Creative Engineer & AI Developer',
    url: SITE_URL,
    social: {
        github: 'https://github.com/a18-n03',
        linkedin: 'https://www.linkedin.com/in/anuj-mhatre-031807ma',
        x: 'https://x.com/MhatreAnuj1814',
        instagram: 'https://www.instagram.com/anu__m.1812',
        discord: 'https://discord.com/users/anujmhatre_2007',
    },
    projects: [
        {
            name: '67 GAME',
            description: 'Browser-based game project built with React, JavaScript, HTML, and CSS.',
            url: 'https://github.com/a18-n03',
            tech: ['React', 'JavaScript', 'HTML', 'CSS'],
        },
        {
            name: 'UI COMP',
            description: 'Custom UI component library with interactive elements and animations.',
            url: 'https://github.com/a18-n03',
            tech: ['React', 'JavaScript', 'CSS'],
        },
        {
            name: 'MINI-GPT',
            description: 'Lightweight GPT-powered chat interface with custom prompt engineering.',
            url: 'https://github.com/a18-n03',
            tech: ['Python', 'React', 'OpenAI API'],
        },
        {
            name: 'NAVI MUMBAI PRICE',
            description: 'Real estate price prediction tool for Navi Mumbai using machine learning.',
            url: 'https://github.com/a18-n03',
            tech: ['Python', 'Machine Learning', 'Data Science'],
        },
    ],
    skills: ['React', 'Three.js', 'Python', 'AI/ML', 'Node.js', 'TypeScript', 'GSAP', 'PCB Design', 'Git', 'Docker'],
};

function buildJsonLd() {
    const d = ANUJ_DATA;
    const graph = [];

    // Person
    graph.push({
        '@type': 'Person',
        '@id': `${SITE_URL}/#person`,
        name: d.name,
        alternateName: d.alternateNames,
        url: SITE_URL,
        jobTitle: d.jobTitle,
        description: d.aboutMe,
        knowsAbout: d.skills,
        sameAs: Object.values(d.social),
    });

    // WebSite
    graph.push({
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: d.siteTitle,
        description: d.siteDescription,
        publisher: { '@id': `${SITE_URL}/#person` },
    });

    // ProfilePage
    graph.push({
        '@type': 'ProfilePage',
        '@id': `${SITE_URL}/#profilepage`,
        url: SITE_URL,
        mainEntity: { '@id': `${SITE_URL}/#person` },
        about: { '@id': `${SITE_URL}/#person` },
    });

    // Projects as ItemList
    graph.push({
        '@type': 'ItemList',
        '@id': `${SITE_URL}/#projectslist`,
        name: `Portfolio Projects by ${d.name}`,
        description: 'Selected projects showcasing React, Python, AI/ML, and creative engineering.',
        numberOfItems: d.projects.length,
        itemListElement: d.projects.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
                '@type': 'CreativeWork',
                name: p.name,
                description: p.description,
                url: p.url,
                creator: { '@id': `${SITE_URL}/#person` },
                keywords: p.tech.join(', '),
            },
        })),
    });

    // Individual projects
    d.projects.forEach(p => {
        const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        graph.push({
            '@type': 'CreativeWork',
            '@id': `${SITE_URL}/#project-${slug}`,
            name: p.name,
            description: p.description,
            url: p.url,
            creator: { '@id': `${SITE_URL}/#person` },
            keywords: p.tech.join(', '),
        });
    });

    return {
        '@context': 'https://schema.org',
        '@graph': graph,
    };
}

function buildSemanticHtml() {
    const d = ANUJ_DATA;
    let html = `\n<div id="seo-content" class="sr-only-seo">\n`;

    html += `  <header>\n`;
    html += `    <h1>${d.siteTitle}</h1>\n`;
    html += `    <p>${d.siteDescription}</p>\n`;
    html += `  </header>\n`;

    html += `  <section id="about">\n`;
    html += `    <h2>About ${d.name}</h2>\n`;
    html += `    <p>${d.aboutMe}</p>\n`;
    html += `    <a href="${d.social.github}">GitHub</a>\n`;
    html += `    <a href="${d.social.linkedin}">LinkedIn</a>\n`;
    html += `  </section>\n`;

    html += `  <section id="projects">\n`;
    html += `    <h2>Projects</h2>\n`;
    html += `    <ul>\n`;
    d.projects.forEach(p => {
        html += `      <li>\n`;
        html += `        <h3>${p.name}</h3>\n`;
        html += `        <p>${p.description}</p>\n`;
        html += `        <a href="${p.url}">View on GitHub</a>\n`;
        html += `      </li>\n`;
    });
    html += `    </ul>\n`;
    html += `  </section>\n`;

    html += `  <section id="contact">\n`;
    html += `    <h2>Contact ${d.name}</h2>\n`;
    html += `    <p>Email: anujmhatre125@gmail.com | Phone: +91 84509 85594</p>\n`;
    html += `    <a href="${d.social.instagram}">Instagram</a>\n`;
    html += `    <a href="${d.social.x}">X (Twitter)</a>\n`;
    html += `  </section>\n`;

    html += `</div>\n`;
    return html;
}

function buildLlmsTxt() {
    const d = ANUJ_DATA;
    let content = `# ${d.siteTitle}\n`;
    content += `> ${d.siteDescription}\n\n`;

    content += `## About Me\n`;
    content += `${d.aboutMe}\n\n`;

    content += `## Core Technologies & Skills\n`;
    content += `- ${d.skills.join(', ')}\n\n`;

    content += `## Selected Projects\n`;
    d.projects.forEach(p => {
        content += `- [${p.name}](${p.url}): ${p.description} (Tech: ${p.tech.join(', ')})\n`;
    });
    content += `\n`;

    content += `## Contact\n`;
    content += `- GitHub: ${d.social.github}\n`;
    content += `- LinkedIn: ${d.social.linkedin}\n`;
    content += `- X: ${d.social.x}\n`;
    content += `- Instagram: ${d.social.instagram}\n`;
    content += `- Email: anujmhatre125@gmail.com\n`;

    return content;
}

export function generateSeoHtml() {
    const jsonLd = buildJsonLd();
    const seoHtml = buildSemanticHtml();
    const llmsTxt = buildLlmsTxt();

    return {
        name: 'sanity-seo-plugin',

        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (req.url === '/llms.txt') {
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.end(llmsTxt);
                } else {
                    next();
                }
            });
        },

        async transformIndexHtml(html) {
            const d = ANUJ_DATA;

            // Inject JSON-LD before </head>
            const jsonLdScript = `\n  <!-- Dynamic Structured Data (JSON-LD) -->\n  <script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n  </script>\n`;
            let transformed = html.replace('</head>', `${jsonLdScript}</head>`);

            // Update <title>
            transformed = transformed.replace(/<title>(.*?)<\/title>/, `<title>${d.siteTitle}</title>`);

            // Update meta description
            transformed = transformed.replace(
                /<meta name="description" content="(.*?)"\s*\/?>/,
                `<meta name="description" content="${d.siteDescription}" />`
            );

            // Update OG tags
            transformed = transformed
                .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${d.siteTitle}" />`)
                .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${d.siteDescription}" />`);

            // Update Twitter tags
            transformed = transformed
                .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${d.siteTitle}" />`)
                .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${d.siteDescription}" />`);

            // Replace static SEO div with dynamic one
            transformed = transformed.replace(
                /<div id="seo-content" class="sr-only-seo">[\s\S]*?<\/div>/,
                seoHtml
            );

            return transformed;
        },

        async generateBundle() {
            this.emitFile({
                type: 'asset',
                fileName: 'llms.txt',
                source: llmsTxt,
            });
        },
    };
}
