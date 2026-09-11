#!/usr/bin/env node
'use strict';

// scripts/crawl-nodes.cjs の出力から、セール・キャンペーンらしいnode idを
// 「新しく作成されたと推測される順」に絞り込んで一覧表示する。
//
// Amazonのnode idには公開された作成日時は含まれないが、経験的にidの数値が
// 大きいほど後から作成されたノードである傾向があるため、それを新しさの目安にする
// (保証はない、あくまでヒューリスティック)。ラベルに日付表記があれば併せて抽出する。
//
// 使い方:
//   node scripts/crawl-nodes.cjs <セール一覧のハブnode id> > /tmp/sales-raw.json
//   node scripts/find-recent-sales.cjs /tmp/sales-raw.json [表示件数(既定30)]

const fs = require('fs');

const KEYWORD_RE = /セール|キャンペーン|還元|クーポン|無料|まとめ買い|フェア|ポイント|OFF|割引|特集|プライムデー|周年|フィナーレ/;
const JUNK_RE = /^[A-Za-z0-9_.\-]+$/; // 記号・英数字だけの内部コード名っぽいものを除外
const DATE_RE = /(\d{4}年)?(\d{1,2})\s*\/\s*(\d{1,2})|\d{4}年\d{1,2}月|\d{1,2}月/;

function main() {
  const inputFile = process.argv[2];
  const limit = Number(process.argv[3]) || 30;
  if (!inputFile) {
    console.error('使い方: node scripts/find-recent-sales.cjs <crawl-nodes.cjsの出力ファイル> [表示件数]');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const leaves = raw.filter((n) => !n.hasChildren);
  const candidates = leaves.filter((n) => KEYWORD_RE.test(n.displayName) && !JUNK_RE.test(n.displayName));

  candidates.sort((a, b) => Number(b.id) - Number(a.id));

  console.error(`全ノード: ${raw.length}件 / 末端ノード: ${leaves.length}件 / キーワード一致: ${candidates.length}件`);
  console.error(`node idが大きい(=新しいと推測される)順に上位${limit}件を表示します。`);
  console.error('');

  for (const c of candidates.slice(0, limit)) {
    const label = c.displayName.trim();
    const m = label.match(DATE_RE);
    console.log(`${c.id}\t${label}${m ? `\t[日付表記: ${m[0]}]` : ''}`);
  }
}

main();
