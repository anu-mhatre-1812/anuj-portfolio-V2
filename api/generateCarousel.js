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

    const userMessage = `You are a carousel content creator. Return ONLY a valid JSON object — no markdown, no code fences, no explanation. Just raw JSON.

JSON structure:
{"slides":[{"title":"string","content":"string","layout":"hook-content-cta"|"bullet-list"|"numbered-list"|"big-text"|"split"|"quote","bullets":["string"],"bgColor":"#FAFAFA"|"#F5F5F5"|"#F5F0E6"|"#E8E2D5"|"#FFF8E8"|"#0A0A0A"|"#1A1A1A","textColor":"#1A1A1A"|"#FAFAFA","fontFamily":"'Rubik Scribble', cursive"|"Cabin Sketch', cursive"}]}

Create exactly ${slideCount} slides about: ${prompt}. First slide = hook, last = CTA. Titles under 8 words, content under 30 words. Alternate layouts. Mostly light backgrounds.`;

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GEMINI_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gemini-3.6-flash',
                    messages: [{ role: 'user', content: userMessage }],
                    temperature: 0.7,
                    max_tokens: maxTokens,
                }),
                signal: controller.signal,
            }
        );

        clearTimeout(timeout);

        if (!response.ok) {
            const errText = await response.text();
            console.error('Gemini API error:', response.status, errText.slice(0, 300));
            return res.status(502).json({ error: `Gemini API error: ${response.status}` });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

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
                return res.status(500).json({ error: 'AI returned invalid JSON. Try again.', raw: clean.slice(0, 200) });
            }
            let depth = 0, end = -1;
            for (let i = start; i < clean.length; i++) {
                if (clean[i] === '{') depth++;
                else if (clean[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
            }
            if (end === -1) {
                console.error('Unmatched braces:', clean.slice(0, 300));
                return res.status(500).json({ error: 'AI returned invalid JSON. Try again.', raw: clean.slice(0, 200) });
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
        console.error('Carousel API error:', err.message);
        if (err.name === 'AbortError') {
            return res.status(504).json({ error: 'AI request timed out. Try again.' });
        }
        return res.status(500).json({ error: 'Server error: ' + err.message });
    }
}
