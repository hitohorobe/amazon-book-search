#!/usr/bin/env node
'use strict';

// 「セール・特集ハブのnode idをクロールして、bbn系データファイル(例: data/bbnKindle.json)を
// 更新する」という一連の作業を1コマンドにまとめたもの(scripts/crawl-nodes.cjs +
// scripts/find-recent-sales.cjs + 手作業でのデータ反映、を毎回繰り返さずに済むようにする)。
//
// やること:
//   1. 対象データファイルの既存items全件をGetBrowseNodesで存在確認し、
//      失効した(もう存在しない)ものを自動的に取り除く。
//   2. 指定したハブnode id配下を再帰クロールする。
//   3. セール関連キーワードに一致し、まだ一覧にない末端ノードを、
//      node idが大きい(=新しく作成されたと推測される)順に指定件数だけ新規候補として追加する。
//      新規候補のラベル末尾には「(要期間確認)」を付け、無期限/期間限定の別や具体的な時期は
//      目視で確認・編集することを促す(Creators APIにはnodeの期限情報がないため自動判定できない)。
//   4. 結果をファイルに書き戻す。
//
// 使い方:
//   node scripts/refresh-sale-nodes.cjs <セールハブのnode id> <対象ファイル名> [新規追加件数(既定5)]
//
// 例(Kindle本のセール・特集ハブ):
//   node scripts/refresh-sale-nodes.cjs 23297805051 bbnKindle.json 5

const fs = require('fs');
const path = require('path');
const { createClientFromEnv } = require('./lib/creators-api.cjs');
const { crawlNodes, checkExistence } = require('./lib/crawl.cjs');

const DATA_DIR = path.resolve(__dirname, '../data');
const KEYWORD_RE = /セール|キャンペーン|還元|クーポン|無料|まとめ買い|フェア|ポイント|OFF|割引|特集|プライムデー|周年|フィナーレ/;
const JUNK_RE = /^[A-Za-z0-9_.\-]+$/;

async function main() {
  const [hubId, fileName, limitArg] = process.argv.slice(2);
  if (!hubId || !fileName) {
    console.error('使い方: node scripts/refresh-sale-nodes.cjs <セールハブのnode id> <対象ファイル名> [新規追加件数(既定5)]');
    console.error('例:     node scripts/refresh-sale-nodes.cjs 23297805051 bbnKindle.json 5');
    process.exit(1);
  }
  const limit = Number(limitArg) || 5;
  const filePath = path.join(DATA_DIR, fileName);
  const dataFile = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const client = createClientFromEnv();

  console.error(`既存 ${dataFile.items.length} 件の存在確認中...`);
  const existingIds = dataFile.items.map((i) => i.nodeId);
  const aliveIds = await checkExistence(client, existingIds);
  const kept = dataFile.items.filter((i) => aliveIds.has(i.nodeId));
  const removed = dataFile.items.filter((i) => !aliveIds.has(i.nodeId));
  if (removed.length) {
    console.error(`失効により削除: ${removed.map((i) => `${i.nodeId}(${i.label})`).join(', ')}`);
  } else {
    console.error('失効したものはありませんでした。');
  }

  console.error(`node ${hubId} 配下をクロール中...`);
  const crawled = await crawlNodes(client, [hubId], {
    onProgress: ({ processed, queued, collected }) =>
      process.stderr.write(`\r[progress] processed=${processed} queued=${queued} collected=${collected}   `),
  });
  console.error(`\nクロール完了: ${crawled.length}件`);

  const existingIdSet = new Set(kept.map((i) => i.nodeId));
  const candidates = crawled
    .filter((n) => !n.hasChildren && KEYWORD_RE.test(n.displayName) && !JUNK_RE.test(n.displayName))
    .filter((n) => !existingIdSet.has(n.id))
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, limit)
    .map((n) => ({ label: `${n.displayName.trim()} (要期間確認)`, nodeId: n.id, verified: false }));

  console.error(`新規候補 ${candidates.length}件:`);
  for (const c of candidates) console.error(`  ${c.nodeId}\t${c.label}`);

  dataFile.items = [...kept, ...candidates];
  fs.writeFileSync(filePath, JSON.stringify(dataFile, null, 2) + '\n', 'utf8');

  console.error(
    `\ndata/${fileName} を更新しました(既存${kept.length}件 + 新規${candidates.length}件 = 合計${dataFile.items.length}件)。`
  );
  if (candidates.length) {
    console.error('新規追加分の「(要期間確認)」は、無期限/期間限定の別や具体的な時期を目視で確認して書き換えてください。');
  }
}

main().catch((err) => {
  console.error('エラー:', err.message);
  process.exit(1);
});
