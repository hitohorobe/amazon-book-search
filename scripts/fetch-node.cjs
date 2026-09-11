#!/usr/bin/env node
'use strict';

// Amazon Creators API (GetBrowseNodes) を使って、指定したnode idの名前と
// 直下の子カテゴリー一覧を表示するツール。data/nodes.json を手動更新する際の
// 探索補助として使う。認証情報は .env から読み込む(.env.example参照)。
//
// 使い方: node scripts/fetch-node.js <nodeId> [nodeId2 ...]

const { createClientFromEnv } = require('./lib/creators-api.cjs');

async function main() {
  const ids = process.argv.slice(2);
  if (ids.length === 0) {
    console.error('使い方: node scripts/fetch-node.js <nodeId> [nodeId2 ...]');
    console.error('例:     node scripts/fetch-node.js 465392');
    process.exit(1);
  }

  const client = createClientFromEnv();

  for (const id of ids) {
    const res = await client.getBrowseNodes({
      browseNodeIds: [id],
      resources: ['browseNodes.children', 'browseNodes.ancestor'],
    });

    if (res.statusCode !== 200) {
      console.error(`[${id}] エラー (HTTP ${res.statusCode}):`, JSON.stringify(res.body));
      continue;
    }

    const node = (res.body.browseNodesResult && res.body.browseNodesResult.browseNodes || [])[0];
    if (!node) {
      console.error(`[${id}] browse node が見つかりません:`, JSON.stringify(res.body));
      continue;
    }

    console.log(`\n=== ${node.displayName} (id: ${node.id}) ===`);
    if (node.children && node.children.length) {
      for (const child of node.children) {
        console.log(`  - ${child.id}\t${child.displayName}`);
      }
    } else {
      console.log('  (子カテゴリーなし)');
    }
  }
}

main().catch(err => {
  console.error('エラー:', err.message);
  process.exit(1);
});
