/**
 * Anthropic relay for the AI Coaching demo.
 *
 * Why: the Anthropic org disallows direct browser (CORS) requests, and
 * Amplify's reverse-proxy rewrites can't strip the Origin header CloudFront
 * forwards. This worker relays browser calls to api.anthropic.com with only
 * the headers Anthropic needs, so they look like ordinary server traffic.
 * The API key stays in the caller's browser and passes through per-request;
 * nothing is stored here.
 *
 * Deploy: npx wrangler deploy (from this folder), then point the app at the
 * printed *.workers.dev URL via VITE_ANTHROPIC_BASE_URL.
 */

const FORWARDED_HEADERS = ['content-type', 'x-api-key', 'anthropic-version'];

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': FORWARDED_HEADERS.join(', '),
  'access-control-max-age': '86400',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: CORS_HEADERS,
      });
    }

    const url = new URL(request.url);
    const headers = new Headers();
    for (const name of FORWARDED_HEADERS) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    const upstream = await fetch(
      `https://api.anthropic.com${url.pathname}${url.search}`,
      { method: 'POST', headers, body: request.body }
    );

    const responseHeaders = new Headers(upstream.headers);
    for (const [name, value] of Object.entries(CORS_HEADERS)) {
      responseHeaders.set(name, value);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  },
};
