// GET /api/passport/<account>: the Arcade Passport for one NEAR testnet account, as JSON.
// Read-only: contract views over public RPC plus the NearBlocks testnet API; no keys needed
// (set NEARBLOCKS_API_KEY in the Vercel project for a higher NearBlocks rate limit).
// Each account's answer is cached for 60 s in this instance and at the edge.
import { buildPassport, isAccountId, type Passport } from '../../src/passport/core.js';

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const TTL = 60_000;
const cache = new Map<string, { at: number; body: Passport }>();
const inflight = new Map<string, Promise<Passport>>();

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS' };

function json(status: number, body: unknown, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...CORS, ...extra } });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get('account') ?? decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? '');
  const account = raw.trim().toLowerCase();
  if (!isAccountId(account)) return json(400, { error: 'not a NEAR account id' });

  const hit = cache.get(account);
  if (hit && Date.now() - hit.at < TTL) return json(200, hit.body, { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=120', 'x-passport-cache': 'hit' });

  try {
    let job = inflight.get(account);
    if (!job) {
      job = buildPassport(account, { nearblocksKey: env.NEARBLOCKS_API_KEY });
      inflight.set(account, job);
      job.finally(() => inflight.delete(account)).catch(() => {});
    }
    const body = await job;
    cache.set(account, { at: Date.now(), body });
    if (cache.size > 1000) cache.delete(cache.keys().next().value!);
    return json(200, body, { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=120' });
  } catch (e) {
    // a stale answer beats none
    if (hit) return json(200, hit.body, { 'cache-control': 'no-store', 'x-passport-cache': 'stale' });
    return json(502, { error: String((e as Error)?.message ?? e).slice(0, 200) }, { 'cache-control': 'no-store' });
  }
}
