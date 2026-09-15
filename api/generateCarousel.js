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

    // --- Token Harbor (primary) ---
    const TH_KEY = process.env.TOKENHARBOR_KEY;
    const TH_URL = 'https://tokenharbor.ai/v1/chat/completions';
    const thModels = [
        'deepseek-v4.1-flash:free',
        'deepseek-v4-flash:free',
        'mimo-v2.5:free',
    ];

    // --- OpenCode Zen (fallback) ---
    const ZEN_KEY = process.env.ZEN_API_KEY;
    const ZEN_URL = 'https://opencode.ai/zen/v1/chat/completions';
    const zenModels = ['mimo-v2.5-free'];

    let apiRes;
    let lastError = '';

    // Try Token Harbor models first
    if (TH_KEY) {
        for (const model of thModels) {
            let response;
            try {
                response = await fetch(TH_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${TH_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: buildBody(model),
                    signal: AbortSignal.timeout(8000),
                });
            } catch (error) {
                lastError = error.name === 'TimeoutError' ? `${model} timed out` : error.message;
                console.warn(`Token Harbor ${model} failed:`, lastError);
                continue;
            }

            if (response.ok) {
                apiRes = response;
                break;
            }

            lastError = await response.text();
            console.warn(`Token Harbor ${model} returned ${response.status}:`, lastError);

            if (response.status !== 429 && response.status !== 503) {
                return res.status(response.status).json({ error: `AI API error: ${response.status}` });
            }
        }
    }

    // Fallback to OpenCode Zen
    if (!apiRes && ZEN_KEY) {
        console.warn('Token Harbor exhausted, trying OpenCode Zen');
        for (const model of zenModels) {
            let response;
            try {
                response = await fetch(ZEN_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${ZEN_KEY}`,
                        'Content-Type': 'application/json',
                        'x-opencode-session': `carousel-${Date.now()}`,
                    },
                    body: buildBody(model),
                    signal: AbortSignal.timeout(12000),
                });
            } catch (error) {
                lastError = error.name === 'TimeoutError' ? `OpenCode ${model} timed out` : error.message;
                console.warn(`OpenCode ${model} failed:`, lastError);
                continue;
            }

            if (response.ok) {
                apiRes = response;
                break;
            }

            lastError = await response.text();
            console.warn(`OpenCode ${model} returned ${response.status}:`, lastError);

            if (response.status !== 429 && response.status !== 503) {
                return res.status(response.status).json({ error: `AI API error: ${response.status}` });
            }
        }
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
        let clean = content.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();
        try {
            parsed = JSON.parse(clean);
        } catch (e) {
            const jsonMatch = clean.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON object found in AI response');
            }
        }
    } catch (e) {
        console.error('Failed to parse AI JSON:', content.slice(0, 500));
        return res.status(500).json({ error: 'AI returned invalid JSON. Try again.' });
    }

    if (!parsed.slides || !Array.isArray(parsed.slides)) {
        return res.status(500).json({ error: 'AI response missing slides array' });
    }

    return res.status(200).json(parsed);
}
