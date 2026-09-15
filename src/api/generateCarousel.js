/**
 * generateCarousel — Client-side API caller for AI carousel generation.
 *
 * Calls the local Vite proxy at /api/generateCarousel which forwards
 * to Token Harbor with the API key stored server-side.
 *
 * In production (Vercel), this would call a serverless function instead.
 */

const FALLBACK_SLIDES = [
    {
        title: 'Welcome to Carousel',
        content: 'AI generation is warming up. Edit this slide or try generating again.',
        layout: 'hook-content-cta',
        bgColor: '#FAFAFA',
        textColor: '#1A1A1A',
        fontFamily: "'Cabin Sketch', cursive",
        fontWeight: 700,
        bullets: [],
    },
];

export async function generateCarousel(prompt, slideCount = 5, retries = 2) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch('/api/generateCarousel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, slideCount }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Network error' }));
                const error = new Error(err.error || `API error ${res.status}`);
                error.status = res.status;
                throw error;
            }

            const data = await res.json();

            if (!data.slides || !Array.isArray(data.slides) || data.slides.length === 0) {
                return FALLBACK_SLIDES;
            }

            // Normalize slides — ensure all required fields exist
            return data.slides.map((slide, i) => ({
                id: Date.now() + i,
                title: slide.title || '',
                content: slide.content || '',
                layout: slide.layout || 'hook-content-cta',
                bgColor: slide.bgColor || '#FAFAFA',
                textColor: slide.textColor || '#1A1A1A',
                fontFamily: slide.fontFamily || "'Cabin Sketch', cursive",
                fontWeight: slide.fontWeight || 700,
                imageUrl: null,
                bullets: Array.isArray(slide.bullets) ? slide.bullets : [],
            }));
        } catch (err) {
            lastError = err;
            // The server already tries each Token Harbor fallback model once. Retrying a 429
            // from the browser immediately only increases pressure on an already busy free tier.
            if (err.status === 429) break;
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            }
        }
    }
    throw lastError;
}
