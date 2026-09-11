#!/usr/bin/env node
'use strict';

// scripts/crawl-nodes.cjs の出力(フラットなnode配列。各要素は
// { id, displayName, contextFreeName, path: [表示名,...], hasChildren })を
// 親子関係を持つツリー構造に組み立て、data/<出力ファイル名>(既定はnodes.json)を上書きする。
//
// 使い方:
//   node scripts/crawl-nodes.cjs 465610 > /tmp/nodes-raw.json
//   node scripts/build-nodes-tree.cjs /tmp/nodes-raw.json [出力ファイル名]
//
// クロールのルートに指定したnode自体(例: 465610「ジャンル別」)は単なる
// グルーピングラベルとして扱い、その直下の子を「大分類」のトップレベルとする。

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../data');

function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('使い方: node scripts/build-nodes-tree.js <crawl-nodes.jsの出力ファイル>');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  raw.sort((a, b) => a.path.length - b.path.length);

  const byPathKey = new Map();
  const roots = [];

  for (const item of raw) {
    const node = { id: item.id, label: item.displayName, children: [] };
    const key = item.path.join('>>');
    byPathKey.set(key, node);

    if (item.path.length === 1) {
      roots.push(node);
    } else {
      const parentKey = item.path.slice(0, -1).join('>>');
      const parent = byPathKey.get(parentKey);
      if (parent) {
        parent.children.push(node);
      } else {
        console.error('[warn] parent not found for', key, '- treating as root');
        roots.push(node);
      }
    }
  }

  if (roots.length !== 1) {
    console.error(`[warn] クロールのルートが${roots.length}件あります。通常は1件(指定したrootNodeId)のはずです。`);
  }

  const topLevel = roots.length === 1 ? roots[0].children : roots;

  function countNodes(nodes) {
    let n = 0;
    for (const node of nodes) n += 1 + countNodes(node.children);
    return n;
  }

  const outFileName = process.argv[3] || 'nodes.json';
  const nodesJsonPath = path.join(DATA_DIR, outFileName);
  const existing = fs.existsSync(nodesJsonPath) ? JSON.parse(fs.readFileSync(nodesJsonPath, 'utf8')) : {};

  const out = {
    verified: true,
    notice: existing.notice || 'Amazon Creators API (GetBrowseNodes) から取得した実在のnode id・カテゴリー名の階層構造です。scripts/crawl-nodes.cjs + scripts/build-nodes-tree.cjs で生成しました。',
    tree: topLevel,
  };

  fs.writeFileSync(nodesJsonPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`data/${outFileName} を更新しました: 大分類 ${topLevel.length}件、合計 ${countNodes(topLevel)}件`);
}

main();
