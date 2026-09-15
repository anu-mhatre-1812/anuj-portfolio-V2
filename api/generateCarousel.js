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

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });

    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 45000);

            // Use native Gemini API (better rate limits than OpenAI-compat endpoint)
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: userMessage }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: maxTokens,
                        },
                    }),
                    signal: controller.signal,
                }
            );

            clearTimeout(timeout);

            if (response.status === 429 || response.status === 503) {
                const waitMs = (attempt + 1) * 5000;
                console.warn(`Attempt ${attempt + 1}: ${response.status} — retrying in ${waitMs}ms`);
                await new Promise(r => setTimeout(r, waitMs));
                continue;
            }

            if (!response.ok) {
                const errText = await response.text();
                console.error('Gemini API error:', response.status, errText.slice(0, 300));
                return res.status(502).json({ error: `Gemini API error: ${response.status}` });
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!content) {
                console.error('Gemini empty response:', JSON.stringify(data).slice(0, 300));
                return res.status(500).json({ error: 'Empty AI response' });
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
                if (start === -1) {
                    console.error('No JSON in response:', clean.slice(0, 300));
                    return res.status(500).json({ error: 'AI returned invalid JSON. Try again.' });
                }
                let depth = 0, end = -1;
                for (let i = start; i < clean.length; i++) {
                    if (clean[i] === '{') depth++;
                    else if (clean[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
                }
                if (end === -1) {
                    console.error('Unmatched braces:', clean.slice(0, 300));
                    return res.status(500).json({ error: 'AI returned invalid JSON. Try again.' });
                }
                parsed = JSON.parse(clean.substring(start, end + 1));
            }

            if (parsed && !Array.isArray(parsed.slides) && typeof parsed.slides === 'object') {
                parsed.slides = [parsed.slides];
            }

            if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
                return res.status(500).json({ error: 'AI response missing slides array' });
            }

            return res.status(200).json(parsed);

        } catch (err) {
            console.error(`Attempt ${attempt + 1} error:`, err.message);
            if (err.name === 'AbortError' && attempt < MAX_RETRIES - 1) {
                await new Promise(r => setTimeout(r, 3000));
                continue;
            }
            if (attempt === MAX_RETRIES - 1) {
                return res.status(500).json({ error: 'AI service unavailable. Please try again in a moment.' });
            }
        }
    }

    return res.status(429).json({ error: 'AI is busy. Please wait a moment and try again.' });
}
