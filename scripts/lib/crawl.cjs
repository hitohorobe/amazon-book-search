'use strict';

// Amazon Creators API (GetBrowseNodes) を使って、指定したルートnode id配下の
// カテゴリー/ノードツリーを再帰的にすべて取得する共通ロジック。
// scripts/crawl-nodes.cjs(CLI)と scripts/refresh-sale-nodes.cjs の両方から使う。

const BATCH_SIZE = 10;
const DELAY_MS = 800;
const MAX_RETRIES = 8;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBatch(client, ids) {
  let attempt = 0;
  for (;;) {
    const res = await client.getBrowseNodes({
      browseNodeIds: ids,
      resources: ['browseNodes.children'],
    });
    if (res.statusCode === 429 || (res.body && res.body.type === 'ThrottleException')) {
      attempt += 1;
      if (attempt > MAX_RETRIES) {
        throw new Error(`getBrowseNodes: throttled after ${MAX_RETRIES} retries`);
      }
      const backoff = Math.min(1000 * 2 ** attempt, 20000);
      console.error(`[throttle] retry ${attempt}/${MAX_RETRIES} after ${backoff}ms`);
      await sleep(backoff);
      continue;
    }
    if (res.statusCode !== 200) {
      throw new Error(`getBrowseNodes failed (HTTP ${res.statusCode}): ${JSON.stringify(res.body)}`);
    }
    if (res.body.errors && res.body.errors.length) {
      for (const e of res.body.errors) {
        console.error(`[warn] ${e.code}: ${e.message}`);
      }
    }
    return res.body.browseNodesResult.browseNodes || [];
  }
}

// rootIds配下を再帰的に全クロールし、
// { id, displayName, contextFreeName, path: [displayName,...], hasChildren } の配列を返す。
async function crawlNodes(client, rootIds, { onProgress } = {}) {
  const visited = new Set();
  const results = [];
  let queue = rootIds.map((id) => ({ id, path: [] }));

  let processed = 0;
  while (queue.length > 0) {
    const batch = queue.slice(0, BATCH_SIZE);
    queue = queue.slice(BATCH_SIZE);

    const idsToFetch = batch.map((b) => b.id).filter((id) => !visited.has(id));
    for (const id of batch.map((b) => b.id)) visited.add(id);
    if (idsToFetch.length === 0) continue;

    const nodes = await fetchBatch(client, idsToFetch);
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

    for (const item of batch) {
      const node = byId[item.id];
      if (!node) continue;
      const path = [...item.path, node.displayName];
      const children = node.children || [];
      results.push({
        id: node.id,
        displayName: node.displayName,
        contextFreeName: node.contextFreeName,
        path,
        hasChildren: children.length > 0,
      });
      for (const child of children) {
        if (!visited.has(child.id)) {
          queue.push({ id: child.id, path });
        }
      }
    }

    processed += idsToFetch.length;
    if (onProgress) onProgress({ processed, queued: queue.length, collected: results.length });
    if (queue.length > 0) await sleep(DELAY_MS);
  }

  return results;
}

// idの配列のうち、実際にAmazon側にまだ存在するものの集合(Set)を返す。
async function checkExistence(client, ids) {
  const alive = new Set();
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const nodes = await fetchBatch(client, batch);
    for (const n of nodes) alive.add(n.id);
    if (i + BATCH_SIZE < ids.length) await sleep(DELAY_MS);
  }
  return alive;
}

module.exports = { crawlNodes, checkExistence, sleep };
