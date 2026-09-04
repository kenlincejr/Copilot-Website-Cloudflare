/**
 * Draftline Claude proxy.
 *
 * The draft board is a static page on GitHub Pages, so it has nowhere to keep an
 * API key. This Worker holds one as a secret and makes the call on the page's
 * behalf, which is the only way to let visitors use Claude features without
 * handing them a key they can read out of View Source.
 *
 * The tradeoff that comes with that: anyone who can open the page can now spend
 * the key owner's money. Everything below exists to bound that.
 *
 *   - Origin allowlist. Requests must come from a known page.
 *   - Model and max_tokens are pinned here, not accepted from the client. A
 *     caller cannot ask for Opus at 64k tokens.
 *   - Per-IP rate limit, short window.
 *   - Hard daily spend ceiling across all callers. When it trips, the Worker
 *     stops calling Anthropic and says so.
 *   - Request body size cap, so nobody can stuff the context window.
 *
 * Deploy:  npx wrangler deploy      (from ff/worker)
 * Secret:  npx wrangler secret put ANTHROPIC_API_KEY
 */

const ALLOWED_ORIGINS = [
  "https://copilotplaybook.com",
  "https://lincezone.com",
  "http://localhost:8123",
];

// Pinned server-side. The client picks nothing that costs money.
//
// Sonnet, not Haiku. The brief asks the model to reason across ~15 players with
// six numbers each and hold a pick schedule in its head; Haiku 4.5 was reliably
// sloppy at it — naming an empty WR slot and then recommending a running back,
// and misreading a 24-pick gap as three. Sonnet 5 is about 3x the price per
// token and still lands around a penny a question. The daily ceiling below is
// unchanged, so the worst case costs the same; it just buys fewer answers.
const MODEL = "claude-sonnet-5";

// Sonnet 5 runs adaptive thinking by default and those tokens count against
// max_tokens, so a budget tight enough to be economical is also tight enough to
// come back as a thinking block with no answer in it. It did, repeatedly, at
// 700. These are set to where they stop mattering: the model is never the thing
// deciding how long an answer gets, the prompt is.
const MAX_TOKENS_DEFAULT = 2000;
const MAX_TOKENS_CAP = 8000;

// Sonnet 5, USD per million tokens.
const PRICE_IN = 2.0;
const PRICE_OUT = 10.0;

/* These are not a usage policy. This is a private board shared with a dozen
   friends, and a limit that a real draft night can reach is a limit that fires
   on the one evening the thing has to work. They are set where nobody using the
   app as intended will ever meet them.

   The daily ceiling stays, and stays deliberately: the key lives in this Worker
   and the origin allowlist below is a browser convention, not a security
   boundary — anything that can make an HTTP request can claim any Origin it
   likes. So the ceiling is not a budget, it is the stop on a runaway. At the
   prices above a question costs about a cent; a whole draft night of briefs for
   twelve people is well under a dollar, and this is fifty times that. If it
   ever trips, something is wrong rather than popular. */
const MAX_BODY_BYTES = 96000;   // the brief carries far more context than it did
const RATE_LIMIT = 90;          // requests per IP...
const RATE_WINDOW = 60;         // ...per this many seconds
const DAILY_BUDGET_USD = 50.0;  // across everyone, resets at UTC midnight

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders(origin) },
  });
}

const today = () => new Date().toISOString().slice(0, 10);

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = ALLOWED_ORIGINS.includes(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(allowed ? origin : "null") });
    }
    if (!allowed) return json({ error: { message: "Origin not allowed." } }, 403, "null");
    if (request.method !== "POST") {
      return json({ error: { message: "POST only." } }, 405, origin);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: { message:
        "The proxy has no API key installed yet. Run: wrangler secret put ANTHROPIC_API_KEY" } }, 503, origin);
    }

    // ---- size cap ---------------------------------------------------------
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json({ error: { message: "Request too large." } }, 413, origin);
    }
    let payload;
    try { payload = JSON.parse(raw); }
    catch { return json({ error: { message: "Malformed JSON." } }, 400, origin); }

    const maxTokens = Math.min(
      MAX_TOKENS_CAP,
      Math.max(200, parseInt(payload.max_tokens, 10) || MAX_TOKENS_DEFAULT)
    );

    const messages = Array.isArray(payload.messages) ? payload.messages : null;
    if (!messages || !messages.length) {
      return json({ error: { message: "No messages." } }, 400, origin);
    }

    // ---- per-IP rate limit ------------------------------------------------
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const rlKey = `rl:${ip}:${Math.floor(Date.now() / 1000 / RATE_WINDOW)}`;
    const used = parseInt((await env.LIMITS.get(rlKey)) || "0", 10);
    if (used >= RATE_LIMIT) {
      return json({ error: { message:
        `That is ${RATE_LIMIT} questions inside a minute from one address — ` +
        `something is looping. Wait a moment and ask again.` } }, 429, origin);
    }
    await env.LIMITS.put(rlKey, String(used + 1), { expirationTtl: RATE_WINDOW * 2 });

    // ---- daily budget -----------------------------------------------------
    const spendKey = `spend:${today()}`;
    const spent = parseFloat((await env.LIMITS.get(spendKey)) || "0");
    if (spent >= DAILY_BUDGET_USD) {
      return json({ error: { message:
        "Claude features are paused for today — the runaway stop tripped, which at " +
        "this ceiling means something is looping rather than that people are asking " +
        "a lot of questions. The draft board itself is unaffected." } }, 429, origin);
    }

    // ---- call Anthropic ---------------------------------------------------
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        // Trimmed only so a bug cannot send an unbounded body, not to ration
        // context. The brief now carries roster points, marginal values and the
        // style's effect on every candidate, and it was brushing the old cap.
        system: typeof payload.system === "string" ? payload.system.slice(0, 12000) : undefined,
        messages: messages.slice(-8).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || "").slice(0, 60000),
        })),
      }),
    });

    const result = await upstream.json();

    if (upstream.ok && result.usage) {
      const cost =
        (result.usage.input_tokens / 1e6) * PRICE_IN +
        (result.usage.output_tokens / 1e6) * PRICE_OUT;
      // Read-modify-write on KV is racy under concurrency; for a handful of
      // drafters that costs a few cents of slippage at the ceiling, which is a
      // fair trade against standing up a Durable Object for a counter.
      await env.LIMITS.put(spendKey, String(spent + cost), { expirationTtl: 172800 });
      result.budget = {
        spentToday: Math.round((spent + cost) * 10000) / 10000,
        dailyBudget: DAILY_BUDGET_USD,
      };
    }

    return json(result, upstream.status, origin);
  },
};
