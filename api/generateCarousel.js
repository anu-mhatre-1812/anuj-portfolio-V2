export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { prompt, slideCount: reqCount = 5, mode = 'generate', answers } = req.body || {};
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Missing prompt' });

    const slideCount = Math.min(50, Math.max(2, parseInt(reqCount, 10) || 5));
    const maxTokens = mode === 'questions' ? 2000 : Math.min(32768, Math.max(8192, slideCount * 1000));

    const questionsMessage = `You are a carousel content strategist. The user wants to create a carousel about: "${prompt}"

Based on this topic, generate 3-5 questions to help create better content. Each question should have 3-4 multiple choice options.

Return ONLY a valid JSON object — no markdown, no code fences. Just raw JSON.

JSON structure:
{"questions":[{"id":1,"question":"string","options":["option A","option B","option C","option D"],"category":"tone|audience|goal|style|depth"}]}

Question categories:
- "tone": Professional, Casual, Humorous, Inspirational, Educational
- "audience": Who is this for? (Beginners, Experts, General, Students, etc.)
- "goal": What's the main goal? (Educate, Sell, Inspire, Entertain, Build brand)
- "style": Visual style preference (Minimal, Bold, Corporate, Creative, Data-heavy)
- "depth": How detailed? (Quick overview, Deep dive, Step-by-step, Case study)

Make questions specific to the topic. Options should be concrete, not vague.`;

    const userMessage = `Return ONLY a valid JSON object — no markdown, no code fences, no explanation. Just raw JSON.

JSON structure:
{"slides":[{"title":"string (catchy, under 10 words)","content":"string (2-4 detailed sentences, compelling copy, 40-80 words)","layout":"hook-content-cta"|"bullet-list"|"big-text"|"split"|"quote"|"numbered-list"|"two-column"|"stats"|"checklist"|"timeline"|"testimonial"|"image-overlay","bullets":["string (detailed point, 10-20 words each)"],"bgColor":"#FAFAFA"|"#F5F5F5"|"#F5F0E6"|"#E8E2D5"|"#0A0A0A"|"#1A1A1A"|"#222222"|"#FDF6E3","textColor":"#1A1A1A"|"#FAFAFA"|"#222222","fontFamily":"Cabin Sketch, cursive"|"Inter, sans-serif"|"Caveat, cursive"|"Rubik Scribble, cursive"|"Gloria Hallelujah, cursive"}]}

Create exactly ${slideCount} slides about: ${prompt}

CONTENT RULES:
- Slide 1 (hook): Grab attention with a bold question, shocking stat, or provocative statement. Make people stop scrolling.
- Middle slides: Deep dive into the topic. Use data, storytelling, examples, and actionable insights. Each slide should standalone but flow as a narrative.
- Last slide (CTA): Strong call to action with clear next step.
- Use REAL statistics, specific numbers, concrete examples — not generic fluff.
- Write like a human, not a robot. Use conversational tone, power words, emotional triggers.
- Bullets should be detailed insights, not vague statements.

LAYOUT MIX (use ALL of these across slides):
- "hook-content-cta": Bold headline + supporting paragraph + arrow prompt
- "bullet-list": Headline + 4-6 detailed bullet points
- "big-text": One powerful statement that fills the slide
- "split": Left headline / right content side-by-side
- "quote": Large quotation + author attribution
- "numbered-list": Step-by-step with numbers 01, 02, 03...
- "two-column": Left and right content columns
- "stats": 2-3 big numbers with labels (use REAL data)
- "checklist": Actionable checklist items with checkmarks
- "timeline": Chronological steps or milestones
- "testimonial": Quote + author name + role
- "image-overlay": Title over placeholder image area

VARY the layouts — don't repeat the same one. Each slide should feel different.
VARY bg colors between light (#FAFAFA, #F5F5F5, #F5F0E6) and dark (#0A0A0A, #1A1A1A).
VARY fonts between heading fonts (Cabin Sketch, Rubik Scribble) and body fonts (Inter).`;

    // Provider chain: Groq (fast, generous free tier) → Gemini (backup)
    const activeMessage = mode === 'questions' ? questionsMessage : (answers ? `${userMessage}\n\nUser's answers to your questions:\n${JSON.stringify(answers, null, 2)}\n\nUse these answers to tailor the content. Write in the chosen tone, for the chosen audience, with the chosen goal and style.` : userMessage);

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
                messages: [
                    { role: 'system', content: 'You are a world-class content strategist and copywriter. You create viral carousel content that educates, entertains, and converts. Write with authority, use specific data and examples, and make every word count. Never be generic — be specific, bold, and memorable. IMPORTANT: Output ONLY valid JSON, no markdown fences, no explanation.' },
                    { role: 'user', content: msg }
                ],
                temperature: 0.75,
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
                contents: [{ role: 'user', parts: [{ text: msg }] }],
                systemInstruction: { parts: [{ text: 'You are a world-class content strategist and copywriter. You create viral carousel content that educates, entertains, and converts. Write with authority, use specific data and examples, and make every word count. Never be generic — be specific, bold, and memorable.' }] },
                generationConfig: { temperature: 0.75, maxOutputTokens: tokens },
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
                    body: provider.buildBody(activeMessage, maxTokens),
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
