export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, slideCount: requestedSlideCount = 5 } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Missing prompt' });
    }

    const slideCount = Math.min(50, Math.max(2, Number.parseInt(requestedSlideCount, 10) || 5));
    const maxTokens = Math.min(9000, Math.max(1400, slideCount * 175));

    const systemPrompt = `You are a carousel content creator for a creative developer portfolio. You MUST return ONLY valid JSON, no markdown, no explanations.

The portfolio design system:
- Hand-drawn / sketch-inspired aesthetic
- Neo-brutalist, editorial composition
- Strong outlines, intentional spacing
- Warm, tactile, creative personality
- Fonts: Rubik Scribble (headings), Cabin Sketch (labels), Inter (body)

Return a JSON object with this exact structure:
{
  "slides": [
    {
      "title": "string (short, punchy headline)",
      "content": "string (1-2 sentences, concise)",
      "layout": "hook-content-cta" | "bullet-list" | "numbered-list" | "big-text" | "split" | "quote",
      "bullets": ["string"] (only for bullet-list/numbered-list layouts, otherwise empty array),
      "bgColor": "#FAFAFA" | "#F5F5F5" | "#F5F0E6" | "#E8E2D5" | "#FFF8E8" | "#0A0A0A" | "#1A1A1A",
      "textColor": "#1A1A1A" | "#FAFAFA",
      "fontFamily": "'Rubik Scribble', cursive" | "'Cabin Sketch', cursive"
    }
  ]
}

Rules:
- First slide = strong hook (why should someone swipe?)
- Middle slides = valuable content (tips, insights, steps)
- Last slide = clear CTA (follow, save, share)
- Use ${slideCount} slides total
- Keep titles under 8 words
- Keep content under 30 words per slide
- Alternate between layouts for visual variety
- Use bgColor sparingly — mostly light backgrounds with dark text
- Every slide must feel like part of one designed system`;

    const buildBody = (model) => JSON.stringify({
        model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create a ${slideCount}-slide Instagram carousel about: ${prompt}` },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
    });

    const providers = [
        // 1. Token Harbor
        {
            name: 'Token Harbor',
            url: 'https://tokenharbor.ai/v1/chat/completions',
            key: process.env.TOKENHARBOR_KEY,
            models: ['deepseek-v4.1-flash:free', 'deepseek-v4-flash:free', 'mimo-v2.5:free'],
            timeout: 8000,
            headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
        },
        // 2. Groq
        {
            name: 'Groq',
            url: 'https://api.groq.com/openai/v1/chat/completions',
            key: process.env.GROQ_API_KEY,
            models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
            timeout: 10000,
            headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
        },
        // 3. OpenRouter
        {
            name: 'OpenRouter',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            key: process.env.OPENROUTER_API_KEY,
            models: ['meta-llama/llama-3.3-70b-instruct:free', 'google/gemma-2-9b-it:free', 'mistralai/mistral-7b-instruct:free'],
            timeout: 10000,
            headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://anujmhatre.me', 'X-Title': 'Anuj Portfolio' }),
        },
        // 4. Google Gemini
        {
            name: 'Gemini',
            url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
            key: process.env.GEMINI_API_KEY,
            models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
            timeout: 12000,
            headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
        },
        // 5. OpenCode Zen (last resort)
        {
            name: 'OpenCode Zen',
            url: 'https://opencode.ai/zen/v1/chat/completions',
            key: process.env.ZEN_API_KEY,
            models: ['mimo-v2.5-free'],
            timeout: 12000,
            headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'x-opencode-session': `carousel-${Date.now()}` }),
        },
    ];

    let apiRes;
    let lastError = '';

    for (const provider of providers) {
        if (!provider.key) continue;

        for (const model of provider.models) {
            let response;
            try {
                response = await fetch(provider.url, {
                    method: 'POST',
                    headers: provider.headers(provider.key),
                    body: buildBody(model),
                    signal: AbortSignal.timeout(provider.timeout),
                });
            } catch (error) {
                lastError = error.name === 'TimeoutError' ? `${model} timed out` : error.message;
                console.warn(`${provider.name} ${model} failed:`, lastError);
                continue;
            }

            if (response.ok) {
                apiRes = response;
                console.log(`Using ${provider.name} model: ${model}`);
                break;
            }

            lastError = await response.text();
            console.warn(`${provider.name} ${model} returned ${response.status}:`, lastError);

            // Skip to next model/provider on transient errors
            if ([400, 404, 429, 500, 503].includes(response.status)) {
                continue;
            }

            // Fatal error (bad key, etc.) — return immediately
            return res.status(response.status).json({ error: `AI API error: ${response.status}` });
        }

        if (apiRes) break;
    }

    if (!apiRes) {
        console.error('All AI models unavailable:', lastError);
        return res.status(429).json({ error: 'Free AI models are busy. Please wait a minute and try again.' });
    }

    const data = await apiRes.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        return res.status(500).json({ error: 'Empty AI response' });
    }

    let parsed;
    try {
        // Strip markdown fences
        let clean = content.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();

        // Try direct parse
        try {
            parsed = JSON.parse(clean);
        } catch (e) {
            // Find the outermost { ... } block using bracket counting
            const start = clean.indexOf('{');
            if (start === -1) throw new Error('No JSON object found');

            let depth = 0;
            let end = -1;
            for (let i = start; i < clean.length; i++) {
                if (clean[i] === '{') depth++;
                else if (clean[i] === '}') {
                    depth--;
                    if (depth === 0) { end = i; break; }
                }
            }

            if (end === -1) throw new Error('Unmatched braces in AI response');

            parsed = JSON.parse(clean.substring(start, end + 1));
        }

        // Fix common model mistakes: wrap single slide object in array
        if (parsed && !Array.isArray(parsed.slides) && typeof parsed.slides === 'object') {
            parsed.slides = [parsed.slides];
        }
    } catch (e) {
        console.error('Failed to parse AI JSON:', content.slice(0, 500));
        return res.status(500).json({ error: 'AI returned invalid JSON. Try again.' });
    }

    if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        return res.status(500).json({ error: 'AI response missing slides array' });
    }

    return res.status(200).json(parsed);
}
