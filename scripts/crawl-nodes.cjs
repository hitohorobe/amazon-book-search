#!/usr/bin/env node
'use strict';

// Amazon Creators API (GetBrowseNodes) を使って、指定したルートnode id配下の
// カテゴリーツリーを再帰的にすべて取得し、JSON配列として標準出力に書き出す。
// data/nodes.json の生成元データとして使う(scripts/build-nodes-tree.cjs 参照)。
// クロール本体は scripts/lib/crawl.cjs にあり、scripts/refresh-sale-nodes.cjs とも共用している。
//
// 使い方: node scripts/crawl-nodes.cjs <rootNodeId> [rootNodeId2 ...] > out.json

const { createClientFromEnv } = require('./lib/creators-api.cjs');
const { crawlNodes } = require('./lib/crawl.cjs');

async function main() {
  const rootIds = process.argv.slice(2);
  if (rootIds.length === 0) {
    console.error('使い方: node scripts/crawl-nodes.cjs <rootNodeId> [rootNodeId2 ...] > out.json');
    process.exit(1);
  }

  const client = createClientFromEnv();
  const results = await crawlNodes(client, rootIds, {
    onProgress: ({ processed, queued, collected }) =>
      console.error(`[progress] processed=${processed} queued=${queued} collected=${collected}`),
  });

  console.log(JSON.stringify(results, null, 2));
  console.error(`[done] total nodes collected: ${results.length}`);
}

main().catch((err) => {
  console.error('エラー:', err.message);
  process.exit(1);
});
