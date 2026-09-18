/**
 * freeapi.js — genuinely-free image generation backend (no API key).
 *
 * Uses the Pollinations.ai image API: a simple GET URL returns the generated
 * image directly, so there is no submit/poll cycle. Free tier, no signup,
 * no key. Rate-limited on the provider side for heavy use.
 *
 * Docs: https://github.com/pollinations-ai/pollinations
 */

// Pollinations model slugs
const FREE_MODEL_MAP = {
    'free-flux': 'flux',   // best quality, slower
    'free-turbo': 'turbo', // fast, lower detail
};

function dimsForAspectRatio(ar) {
    // Keep pixel counts modest: free tier is happier with <= ~1MP images.
    switch (ar) {
        case '1:1': return [1024, 1024];
        case '16:9': return [1280, 720];
        case '9:16': return [720, 1280];
        case '4:3': return [1152, 864];
        case '3:4': return [864, 1152];
        case '3:2': return [1216, 832];
        case '2:3': return [832, 1216];
        case '4:5': return [880, 1088];
        case '5:4': return [1088, 880];
        case '21:9': return [1536, 640];
        default: return [1024, 1024];
    }
}

export class FreeClient {
    /**
     * Generates an image (text-to-image only).
     * @param {Object} params
     * @param {string} params.model - free model id ('free-flux' | 'free-turbo')
     * @param {string} params.prompt
     * @param {string} params.aspect_ratio
     * @param {number} params.seed - -1/undefined for random
     * @returns {Promise<{url: string, id: string}>}
     */
    async generateImage(params) {
        if (!params.prompt || !params.prompt.trim()) {
            throw new Error('Please enter a prompt to generate an image.');
        }
        if (params.image_url) {
            throw new Error('Image editing needs a Muapi API key (Settings). Text-to-image is free.');
        }

        const pmodel = FREE_MODEL_MAP[params.model] || 'flux';
        const [width, height] = dimsForAspectRatio(params.aspect_ratio);
        const seed = params.seed && params.seed !== -1
            ? params.seed
            : Math.floor(Math.random() * 1000000);

        const url =
            `https://image.pollinations.ai/prompt/${encodeURIComponent(params.prompt.trim())}` +
            `?width=${width}&height=${height}&seed=${seed}&model=${pmodel}` +
            `&nologo=true&private=true`;

        console.log('[FreeAPI] Generating:', url.slice(0, 120) + '…');

        // The URL itself triggers generation on first request; the <img>
        // element streams it in and reports success/failure via
        // onload/onerror (see showImageInCanvas). No fetch probe here:
        // it doubles bandwidth and its failure modes differ from <img>,
        // which is the load that actually matters.
        return { url, id: `free-${Date.now()}` };
    }
}

export const freeapi = new FreeClient();
