#!/usr/bin/env node
'use strict';

// 候補の出版社名について、Amazon Creators API の SearchItems で
// 実際にヒットするか・Amazon側の表記(manufacturer.displayValue)と
// 完全一致するかを確認するツール。
//
// 使い方: node scripts/verify-publishers.js "早川書房" "国書刊行会" ...
//        または --file candidates.json (文字列配列のJSON)

const fs = require('fs');
const { createClientFromEnv } = require('./lib/creators-api.cjs');

const BATCH_DELAY_MS = 600;
const MAX_RETRIES = 6;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchWithRetry(client, name) {
  let attempt = 0;
  for (;;) {
    const res = await client.searchItems({
      keywords: name,
      search_index: 'Books',
      resources: ['itemInfo.byLineInfo'],
      item_count: 10,
    });
    if (res.statusCode === 429 || (res.body && res.body.type === 'ThrottleException')) {
      attempt += 1;
      if (attempt > MAX_RETRIES) throw new Error('throttled too many times');
      const backoff = Math.min(1000 * 2 ** attempt, 15000);
      console.error(`[throttle] "${name}" retry ${attempt}/${MAX_RETRIES} after ${backoff}ms`);
      await sleep(backoff);
      continue;
    }
    return res;
  }
}

async function main() {
  let names = process.argv.slice(2);
  const fileIdx = names.indexOf('--file');
  if (fileIdx !== -1) {
    const filePath = names[fileIdx + 1];
    names = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  if (names.length === 0) {
    console.error('使い方: node scripts/verify-publishers.js "出版社名1" "出版社名2" ... [--file candidates.json]');
    process.exit(1);
  }

  const client = createClientFromEnv();
  const results = [];

  for (const name of names) {
    const res = await searchWithRetry(client, name);
    if (res.statusCode !== 200) {
      results.push({ name, ok: false, error: `HTTP ${res.statusCode}: ${JSON.stringify(res.body)}` });
      console.error(`[error] ${name}: HTTP ${res.statusCode}`);
      await sleep(BATCH_DELAY_MS);
      continue;
    }
    const items = (res.body.searchResult && res.body.searchResult.items) || [];
    const total = (res.body.searchResult && res.body.searchResult.totalResultCount) || 0;
    const manufacturers = [
      ...new Set(
        items
          .map(it => it.itemInfo && it.itemInfo.byLineInfo && it.itemInfo.byLineInfo.manufacturer && it.itemInfo.byLineInfo.manufacturer.displayValue)
          .filter(Boolean)
      ),
    ];
    const exactMatchCount = items.filter(
      it => it.itemInfo && it.itemInfo.byLineInfo && it.itemInfo.byLineInfo.manufacturer && it.itemInfo.byLineInfo.manufacturer.displayValue === name
    ).length;

    const result = { name, total, sampleCount: items.length, manufacturers, exactMatchCount };
    results.push(result);
    console.error(
      `[${total >= 1 ? 'OK' : 'NG'}] "${name}" total=${total} exactMatch=${exactMatchCount}/${items.length} manufacturers=${JSON.stringify(manufacturers)}`
    );
    await sleep(BATCH_DELAY_MS);
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error('エラー:', err.message);
  process.exit(1);
});
