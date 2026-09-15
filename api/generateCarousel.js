export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { prompt, slideCount: reqCount = 5 } = req.body || {};
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Missing prompt' });

    const slideCount = Math.min(50, Math.max(2, parseInt(reqCount, 10) || 5));
    const maxTokens = Math.min(16000, Math.max(4096, slideCount * 500));

    const userMessage = `Return ONLY a valid JSON object — no markdown, no code fences, no explanation. Just raw JSON.

JSON structure:
{"slides":[{"title":"string","content":"string","layout":"hook-content-cta"|"bullet-list"|"big-text"|"split"|"quote","bullets":["string"],"bgColor":"#FAFAFA"|"#F5F5F5"|"#F5F0E6"|"#E8E2D5"|"#0A0A0A"|"#1A1A1A","textColor":"#1A1A1A"|"#FAFAFA","fontFamily":"Cabin Sketch, cursive"}]}

Create exactly ${slideCount} slides about: ${prompt}. First slide = hook, last = CTA. Titles under 8 words, content under 30 words.`;

    // Provider chain: Groq (fast, generous free tier) → Gemini (backup)
    const providers = [
        {
            name: 'Groq',
            url: 'https://api.groq.com/openai/v1/chat/completions',
            model: 'openai/gpt-oss-120b',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            buildBody: (msg, tokens) => JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [{ role: 'user', content: msg }],
                temperature: 0.7,
                max_tokens: tokens,
            }),
            extractContent: (data) => data.choices?.[0]?.message?.content,
        },
        ...[
            { key: process.env.GEMINI_API_KEY, name: 'Gemini Key 1' },
            { key: process.env.GEMINI_API_KEY_2, name: 'Gemini Key 2' },
        ].filter(k => k.key).map(({ key, name }) => ({
            name,
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`,
            model: 'gemini-3.6-flash',
            headers: { 'Content-Type': 'application/json' },
            buildBody: (msg, tokens) => JSON.stringify({
                contents: [{ parts: [{ text: msg }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: tokens },
            }),
            extractContent: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text,
        })),
    ];

    const MAX_RETRIES = 2;

    for (const provider of providers) {
        if (!provider.headers['Authorization'] && !provider.url.includes('key=')) continue;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 30000);

                const response = await fetch(provider.url, {
                    method: 'POST',
                    headers: provider.headers,
                    body: provider.buildBody(userMessage, maxTokens),
                    signal: controller.signal,
                });

                clearTimeout(timeout);

                if (response.status === 429 || response.status === 503) {
                    const waitMs = (attempt + 1) * 3000;
                    console.warn(`${provider.name} ${response.status} — waiting ${waitMs}ms`);
                    await new Promise(r => setTimeout(r, waitMs));
                    continue;
                }

                if (!response.ok) {
                    console.error(`${provider.name} error: ${response.status}`);
                    break; // skip to next provider
                }

                const data = await response.json();
                const content = provider.extractContent(data);

                if (!content) {
                    console.error(`${provider.name}: empty response`);
                    break;
                }

                // Parse JSON
                let clean = content
                    .replace(/```(?:json)?\s*/gi, '')
                    .replace(/```\s*/g, '')
                    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
                    .replace(/<think>[\s\S]*?<\/think>/gi, '')
                    .trim();

                let parsed;
                try {
                    parsed = JSON.parse(clean);
                } catch (e) {
                    const start = clean.indexOf('{');
                    if (start === -1) break;
                    let depth = 0, end = -1;
                    for (let i = start; i < clean.length; i++) {
                        if (clean[i] === '{') depth++;
                        else if (clean[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
                    }
                    if (end === -1) break;
                    parsed = JSON.parse(clean.substring(start, end + 1));
                }

                if (parsed && !Array.isArray(parsed.slides) && typeof parsed.slides === 'object') {
                    parsed.slides = [parsed.slides];
                }

                if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) break;

                console.log(`${provider.name}: SUCCESS — ${parsed.slides.length} slides`);
                return res.status(200).json(parsed);

            } catch (err) {
                console.error(`${provider.name} attempt ${attempt + 1}: ${err.message}`);
                if (err.name !== 'AbortError') break;
            }
        }
    }

    return res.status(429).json({ error: 'AI is busy. Please wait a moment and try again.' });
}
