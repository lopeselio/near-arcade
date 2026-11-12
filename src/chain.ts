// NEAR testnet reads: public RPC, no keys; the first endpoint that answers wins.

const RPCS = ['https://rpc.testnet.fastnear.com', 'https://test.rpc.fastnear.com', 'https://near-testnet.drpc.org', 'https://rpc.testnet.near.org'];

type QueryParams = Record<string, unknown> & { request_type: string };

/** An answer from the chain itself (unknown account, a view that panicked): retrying elsewhere won't change it. */
class ChainError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Tries each endpoint in turn; if all of them are busy (rate limits, timeouts), waits and goes round again, up to 4 times. */
async function rpc<T>(params: QueryParams): Promise<T> {
  let last: unknown;
  for (let round = 0; round < 4; round++) {
    if (round) await sleep(600 * 2 ** round);
    for (const url of RPCS) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 'arcade', method: 'query', params: { finality: 'final', ...params } }),
          signal: AbortSignal.timeout(8000),
        });
        const b = await r.json();
        if (b.result?.error) throw new ChainError(JSON.stringify(b.result.error));
        if (b.error) {
          const msg = JSON.stringify(b.error);
          if (/UNKNOWN_ACCOUNT|NO_CONTRACT_CODE|CONTRACT_EXECUTION_ERROR|MethodNotFound/.test(msg)) throw new ChainError(msg);
          throw new Error(msg);
        }
        return b.result as T;
      } catch (e) {
        if (e instanceof ChainError) throw e;
        last = e;
      }
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

/** One access key: full access, or a function-call key limited to one receiver, some methods and a gas allowance. */
export interface KeyInfo {
  full: boolean;
  receiver?: string;
  /** Empty means any method on the receiver. */
  methods?: string[];
  /** NEAR left to spend on gas; null means no allowance limit. */
  allowance?: number | null;
}

type Permission = 'FullAccess' | { FunctionCall: { receiver_id: string; method_names: string[]; allowance: string | null } };

/** Every access key on an account (view_access_key_list). */
export async function accessKeys(id: string): Promise<KeyInfo[]> {
  const r = await rpc<{ keys: { access_key: { permission: Permission } }[] }>({ request_type: 'view_access_key_list', account_id: id });
  return r.keys.map(({ access_key: { permission: p } }): KeyInfo => {
    if (p === 'FullAccess') return { full: true };
    const fc = p.FunctionCall;
    return { full: false, receiver: fc.receiver_id, methods: fc.method_names, allowance: fc.allowance == null ? null : Number(BigInt(fc.allowance) / 10n ** 18n) / 1e6 };
  });
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
