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

    const systemPrompt = `You are a carousel content creator. Return ONLY a valid JSON object with a "slides" array. No markdown, no code fences, no explanations — just raw JSON.

Each slide object must have: title (string), content (string), layout (one of: "hook-content-cta", "bullet-list", "numbered-list", "big-text", "split", "quote"), bullets (array of strings, empty if not bullet/numbered), bgColor (one of: "#FAFAFA", "#F5F5F5", "#F5F0E6", "#E8E2D5", "#FFF8E8", "#0A0A0A", "#1A1A1A"), textColor (one of: "#1A1A1A", "#FAFAFA"), fontFamily (one of: "'Rubik Scribble', cursive", "'Cabin Sketch', cursive").

Create exactly ${slideCount} slides about: ${prompt}. First slide = hook, middle = value, last = CTA. Titles under 8 words, content under 30 words. Alternate layouts. Mostly light backgrounds.`;

    const buildBody = (model) => {
        const body = {
            model,
            messages: [
                { role: 'user', content: systemPrompt },
            ],
            temperature: 0.7,
            max_tokens: maxTokens,
        };
        // Force JSON output for models that support it
        if (!model.includes('mimo')) {
            body.response_format = { type: 'json_object' };
        }
        return JSON.stringify(body);
    };

    const providers = [
        // 1. Google Gemini (most reliable, tested working)
        {
            name: 'Gemini',
            url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
            key: process.env.GEMINI_API_KEY,
            models: ['gemini-3.6-flash'],
            timeout: 15000,
            headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
        },
        // 2. OpenRouter free models
        {
            name: 'OpenRouter',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            key: process.env.OPENROUTER_API_KEY,
            models: ['nvidia/nemotron-3.5-lightning:free', 'nvidia/nemotron-3-ultra-550b-a55b:free', 'inclusionai/ling-3.0-flash-sante:free'],
            timeout: 15000,
            headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://anujmhatre.me', 'X-Title': 'Anuj Portfolio' }),
        },
        // 3. Token Harbor
        {
            name: 'Token Harbor',
            url: 'https://tokenharbor.ai/v1/chat/completions',
            key: process.env.TOKENHARBOR_KEY,
            models: ['deepseek-v4.1-flash:free', 'deepseek-v4-flash:free', 'mimo-v2.5:free'],
            timeout: 8000,
            headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
        },
        // 4. OpenCode Zen (last resort)
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
        // Strip markdown fences and thinking tags
        let clean = content
            .replace(/```(?:json)?\s*/gi, '')
            .replace(/```\s*/g, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .trim();

        // Try direct parse
        try {
            parsed = JSON.parse(clean);
        } catch (e) {
            // Find outermost { ... } with bracket counting
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

            if (end === -1) throw new Error('Unmatched braces');
            parsed = JSON.parse(clean.substring(start, end + 1));
        }

        // Fix common mistakes
        if (parsed && !Array.isArray(parsed.slides) && typeof parsed.slides === 'object') {
            parsed.slides = [parsed.slides];
        }
    } catch (e) {
        console.error('Parse error, raw content:', content.slice(0, 300));
        return res.status(500).json({ error: 'AI returned invalid JSON. Try again.' });
    }

    if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        return res.status(500).json({ error: 'AI response missing slides array' });
    }

    return res.status(200).json(parsed);
}
