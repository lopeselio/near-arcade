// NEAR testnet reads: public RPC, no keys; the first endpoint that answers wins.

const RPCS = ['https://rpc.testnet.fastnear.com', 'https://test.rpc.fastnear.com', 'https://near-testnet.drpc.org'];

type QueryParams = Record<string, unknown> & { request_type: string };

async function rpc<T>(params: QueryParams): Promise<T> {
  let last: unknown;
  for (const url of RPCS) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 'arcade', method: 'query', params: { finality: 'final', ...params } }),
        signal: AbortSignal.timeout(8000),
      });
      const b = await r.json();
      if (b.error || b.result?.error) throw new Error(JSON.stringify(b.error ?? b.result.error));
      return b.result as T;
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

/** Calls a contract view method and parses its JSON result. */
export async function view<T = any>(accountId: string, method: string, args: Record<string, unknown> = {}): Promise<T> {
  const r = await rpc<{ result: number[] }>({
    request_type: 'call_function',
    account_id: accountId,
    method_name: method,
    args_base64: btoa(JSON.stringify(args)),
  });
  return JSON.parse(new TextDecoder().decode(new Uint8Array(r.result)));
}

export interface AccountState {
  /** NEAR, to 6 decimals. */
  balance: number;
  /** Bytes of storage used. */
  storage: number;
  /** Balance minus what the storage costs (1e-5 NEAR per byte). */
  free: number;
}

export async function readAccount(id: string): Promise<AccountState> {
  const a = await rpc<{ amount: string; storage_usage: number }>({ request_type: 'view_account', account_id: id });
  const balance = Number(BigInt(a.amount) / 10n ** 18n) / 1e6;
  return { balance, storage: a.storage_usage, free: balance - a.storage_usage * 1e-5 };
}

export const fmt = (n: number | string, d = 0) =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });

export const explorer = (id: string) => `https://testnet.nearblocks.io/address/${id}`;

/** Readable player names: agents by name, guests and implicit accounts shortened. */
export function who(id: string): string {
  const agent = id.match(/^([a-z]+)(?:-\d+)?\.v3\.bazaar-liars\.testnet$/);
  if (agent) return `${agent[1][0].toUpperCase()}${agent[1].slice(1)} (AI)`;
  if (/^guest-/.test(id)) return `Guest ${id.slice(6, 10)}`;
  if (/^[0-9a-f]{64}$/.test(id)) return `${id.slice(0, 5)}…${id.slice(-4)}`;
  return id.replace(/\.testnet$/, '');
}
