#!/usr/bin/env node
// Re-runs the numbers behind https://arcade.lopeselio.online/thesis from NEAR testnet (public RPC, no keys)
// and writes data/thesis.json plus data/thesis-{stats,agents,contracts}.csv.
// Needs Node 22.18+ or 23.6+ (it imports the TypeScript collector the page uses, with Node's type stripping).
//   node scripts/thesis-data.mjs            # write the files and print a summary
//   node scripts/thesis-data.mjs --stdout   # print the JSON instead of writing files
//   node scripts/thesis-data.mjs --rpc URL  # try this RPC first (also NEAR_RPC_URL=URL)
// Reads rotate across the public testnet RPCs in src/chain.ts and back off when one rate-limits.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rpcFlag = process.argv.indexOf('--rpc');
if (rpcFlag >= 0 && process.argv[rpcFlag + 1]) process.env.NEAR_RPC_URL = process.argv[rpcFlag + 1];
// imported after the flag is read: chain.ts picks up NEAR_RPC_URL when it loads
const { collectThesis, summarize, toCsv } = await import('../src/thesis.ts');
const { RPCS } = await import('../src/chain.ts');

const data = await collectThesis();
if (process.argv.includes('--stdout')) {
  console.log(JSON.stringify(data, null, 2));
} else {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
  await mkdir(dir, { recursive: true });
  const csv = toCsv(data);
  await writeFile(join(dir, 'thesis.json'), JSON.stringify(data, null, 2) + '\n');
  for (const [name, text] of Object.entries(csv)) await writeFile(join(dir, `thesis-${name}.csv`), text);
  const s = summarize(data);
  console.log(`read at ${data.at} from ${RPCS.length} public RPCs (${RPCS.map((u) => new URL(u).host).join(', ')})`);
  console.log(`agent accounts: ${s.agents} in ${s.gamesWithAgents} games; function-call keys only: ${s.fcOnly}; with a full-access key: ${s.withFull}`);
  console.log(`play recorded onchain: ${s.played}; NFTs: ${s.nfts}`);
  console.log(`contracts: ${s.contracts}; NEAR held: ${s.contractNear.toFixed(2)}; storage: ${(s.storageBytes / 1e6).toFixed(2)} MB (${s.storageNear.toFixed(2)} NEAR locked)`);
  for (const st of data.stats) console.log(`  ${st.game}: ${st.value} ${st.label}  [${st.source}]`);
  if (data.failed.length) console.log(`failed reads (left out): ${data.failed.join(', ')}`);
  console.log(`wrote ${dir}/thesis.json and thesis-{stats,agents,contracts}.csv`);
}
