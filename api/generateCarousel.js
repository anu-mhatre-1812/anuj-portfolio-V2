export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.ZEN_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Missing ZEN_API_KEY' });
    }

    const { prompt, slideCount = 5 } = req.body;
    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Missing prompt' });
    }

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

    try {
        // Free Zen models can have independent capacity limits. Try multiple models
        // with failover rather than returning a transient 429 to users.
        const models = [
            'mimo-v2.5-free',
            'nemotron-3.5-lightning-free',
            'nemotron-3-ultra-free',
        ];
        let apiRes;
        let lastError = '';

        for (const model of models) {
            let response;
            try {
                response = await fetch('https://opencode.ai/zen/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'x-opencode-session': `portfolio-${Date.now()}`,
                    },
                    body: JSON.stringify({
                        model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: `Create a ${slideCount}-slide Instagram carousel about: ${prompt}` },
                        ],
                        temperature: 0.7,
                        max_tokens: 16000,
                    }),
                    // A free model can occasionally accept but never finish a request.
                    // Move to the next provider quickly instead of leaving the editor stuck.
                    signal: AbortSignal.timeout(8000),
                });
            } catch (error) {
                lastError = error.name === 'TimeoutError'
                    ? `${model} timed out`
                    : error.message;
                console.warn(`Zen model ${model} request failed:`, lastError);
                continue;
            }

            if (response.ok) {
                apiRes = response;
                break;
            }

            lastError = await response.text();
            console.warn(`Zen model ${model} returned ${response.status}:`, lastError);

            // Non-capacity errors (invalid key, bad request, etc.) cannot be solved by
            // switching models, so return them immediately.
            if (response.status !== 429 && response.status !== 503) {
                return res.status(response.status).json({ error: `AI API error: ${response.status}` });
            }
        }

        if (!apiRes) {
            console.error('All free Zen models are temporarily unavailable:', lastError);
            return res.status(429).json({ error: 'Free AI models are busy. Please wait a minute and try again.' });
        }

        const data = await apiRes.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return res.status(500).json({ error: 'Empty AI response' });
        }

        // Parse JSON from AI response (handle markdown code fences)
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
    } catch (err) {
        console.error('Carousel API error:', err);
        return res.status(500).json({ error: 'Server error: ' + err.message });
    }
}
