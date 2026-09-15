import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression';
import { generateSeoHtml } from './seo-plugin.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const START_PAGE_PATHS = new Set(['/start', '/start/']);

function rewriteStartPage(req, _res, next) {
  const [pathname, query = ''] = req.url.split('?');

  if (START_PAGE_PATHS.has(pathname)) {
    req.url = `/start/index.html${query ? `?${query}` : ''}`;
  }

  next();
}

function serveStaticStartPage() {
  return {
    name: 'serve-static-start-page',
    configureServer(server) {
      server.middlewares.use(rewriteStartPage);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteStartPage);
    }
  };
}

// Local API proxy for AI carousel generation (hides API key from frontend)
function apiProxy() {
  return {
    name: 'api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/generateCarousel', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        // Read the server-only Token Harbor key from .env.
        let apiKey;
        try {
          const envPath = resolve(process.cwd(), '.env');
          const envContent = readFileSync(envPath, 'utf-8');
          const match = envContent.match(/^TOKENHARBOR_KEY=(.+)$/m);
          apiKey = match ? match[1].trim() : null;
        } catch (e) {
          apiKey = null;
        }

        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing TOKENHARBOR_KEY in .env' }));
          return;
        }

        // Read request body
        let body = '';
        for await (const chunk of req) {
          body += chunk;
        }

        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
          return;
        }

        const { prompt, slideCount: requestedSlideCount = 5 } = parsed;
        const slideCount = Math.min(50, Math.max(2, Number.parseInt(requestedSlideCount, 10) || 5));

        if (!prompt || typeof prompt !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing prompt' }));
          return;
        }

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

        try {
          // Token Harbor free models use independent allocations. Prefer the most capable
          // DeepSeek route and fall back to the other free models when capacity is exhausted.
          const tokenHarborModels = [
            'deepseek-v4.1-flash:free',
            'deepseek-v4-flash:free',
            'mimo-v2.5:free',
          ];

          // OpenCode Zen fallback — used when all Token Harbor free models are busy.
          const OPENCODE_ZEN_KEY = 'sk-PUqnTbNf6AqJ7JJAoSh84ma8e4epTiafsNAkz6RdnjJhynv6byQ76juzRFkXrAIS';
          const OPENCODE_ZEN_URL = 'https://opencode-zen-api.humperfy.workers.dev/v1/chat/completions';
          const openCodeModels = ['mimo-v2.5-free'];

          const buildBody = (model) => JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Create a ${slideCount}-slide Instagram carousel about: ${prompt}` },
            ],
            temperature: 0.7,
            max_tokens: maxTokens,
          });

          let apiRes;
          let lastError = '';

          // --- Try Token Harbor free models first ---
          for (const model of tokenHarborModels) {
            let response;
            try {
              response = await fetch('https://tokenharbor.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
                body: buildBody(model),
                signal: AbortSignal.timeout(8000),
              });
            } catch (error) {
              lastError = error.name === 'TimeoutError'
                ? `${model} timed out`
                : error.message;
              console.warn(`Token Harbor model ${model} request failed:`, lastError);
              continue;
            }

            if (response.ok) {
              apiRes = response;
              break;
            }

            lastError = await response.text();
            console.warn(`Token Harbor model ${model} returned ${response.status}:`, lastError);

            if (response.status !== 429 && response.status !== 503) {
              res.writeHead(response.status, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `AI API error: ${response.status}` }));
              return;
            }
          }

          // --- Fallback: OpenCode Zen free models ---
          if (!apiRes) {
            console.warn('Token Harbor exhausted, falling back to OpenCode Zen');
            for (const model of openCodeModels) {
              let response;
              try {
                response = await fetch(OPENCODE_ZEN_URL, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${OPENCODE_ZEN_KEY}`,
                    'Content-Type': 'application/json',
                    'x-opencode-session': `carousel-${Date.now()}`,
                  },
                  body: buildBody(model),
                  signal: AbortSignal.timeout(12000),
                });
              } catch (error) {
                lastError = error.name === 'TimeoutError'
                  ? `OpenCode ${model} timed out`
                  : error.message;
                console.warn(`OpenCode model ${model} request failed:`, lastError);
                continue;
              }

              if (response.ok) {
                apiRes = response;
                break;
              }

              lastError = await response.text();
              console.warn(`OpenCode model ${model} returned ${response.status}:`, lastError);

              if (response.status !== 429 && response.status !== 503) {
                res.writeHead(response.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `AI API error: ${response.status}` }));
                return;
              }
            }
          }

          if (!apiRes) {
            console.error('All AI models temporarily unavailable:', lastError);
            res.writeHead(429, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Free AI models are busy. Please wait a minute and try again.' }));
            return;
          }

          const data = await apiRes.json();
          const content = data.choices?.[0]?.message?.content;

          if (!content) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Empty AI response' }));
            return;
          }

          // Parse JSON from AI response (handle markdown code blocks)
          let parsed;
          try {
            // Strip markdown code fences first
            let clean = content.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();
            // Try parsing the cleaned content directly
            try {
              parsed = JSON.parse(clean);
            } catch (e) {
              // If direct parse fails, try to extract JSON object
              const jsonMatch = clean.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
              } else {
                throw new Error('No JSON object found in AI response');
              }
            }
          } catch (e) {
            console.error('Failed to parse AI JSON:', content.slice(0, 500));
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'AI returned invalid JSON. Try again.' }));
            return;
          }

          // Validate structure
          if (!parsed.slides || !Array.isArray(parsed.slides)) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'AI response missing slides array' }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(parsed));
        } catch (err) {
          console.error('API proxy error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Server error: ' + err.message }));
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [serveStaticStartPage(), apiProxy(), react(), viteCompression(), generateSeoHtml()],
  server: {
    proxy: {
      '/sanity-cdn': {
        target: 'https://cdn.sanity.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sanity-cdn/, '')
      }
    }
  }
})
