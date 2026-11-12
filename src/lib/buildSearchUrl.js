// フォームの状態(DOMに依存しないプレーンオブジェクト)からAmazon検索URLを組み立てる。
// UIから独立しているため、Reactなしでも(テストからも)呼び出せる。

const convPrice = (p) => (p === '' || p == null ? '' : (Number(p) === 0 ? '0' : String(Number(p) * 100)));
const convDate = (d) => (d || '').replace(/[.\/_-]/g, '');

// hidden-keywordsは検索ボックスに表示されない補助クエリで、用途の異なる2つの入力を合成する。
// ・まとめリンク作成: ASINを空白/カンマ/改行/|区切りで複数入力 -> |区切りの1トークンにする
// ・マイナス検索: 語を空白/カンマ区切りで複数入力 -> 各語の先頭に-を付けて空白区切りで並べる
function buildHiddenKeywords(form) {
  const parts = [];

  const asins = (form.bundleAsins || '').trim().split(/[\s,|]+/).filter(Boolean);
  if (asins.length) parts.push(asins.join('|'));

  const minusWords = (form.minusKeywords || '')
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((w) => (w.startsWith('-') ? w : `-${w}`));
  if (minusWords.length) parts.push(minusWords.join(' '));

  return parts.join(' ');
}

// 複数選択可能なチェックボックス群(nodeIdの配列)を、|区切りの1つのrhエントリにする。
function pushMultiSelect(rhParts, key, ids) {
  if (ids && ids.length) rhParts.push(`${key}:${ids.join('|')}`);
}

export function buildSearchUrl(form, config) {
  const params = new URLSearchParams();

  // Kindle本はiを付けない(rhのn:からAmazonが部門を自動で決める)。configKindle.jsonのrootNodeIdNote参照。
  if (config.searchIndex) params.set('i', config.searchIndex);

  if (form.k) {
    params.set('k', form.k.trim());
  }

  const hiddenKeywords = buildHiddenKeywords(form);
  if (hiddenKeywords) params.set('hidden-keywords', hiddenKeywords);

  const rhParts = [];

  // カテゴリー: rootNodeIdがある(Kindle本)場合は、ルートを先頭に選択ノードまでの祖先パス(nodePath)を
  // 個別のn:エントリで並べる(参考ツールkinsakuと同じ方式)。rootNodeIdが無い(紙の本)場合は最も深いnodeIdのみ。
  const leafIds = form.nodeId ? [form.nodeId] : [];
  const categoryIds = config.rootNodeId
    ? [config.rootNodeId, ...(form.nodePath || leafIds)]
    : leafIds;
  [...new Set(categoryIds)].forEach((id) => rhParts.push(`${config.rhKeys.category}:${id}`));

  if (form.publisher) rhParts.push(`${config.rhKeys.publisher}:${form.publisher.trim()}`);

  if (form.author) rhParts.push(`${config.rhKeys.author}:${form.author.trim()}`);

  pushMultiSelect(rhParts, config.rhKeys.pricePreset, form.checkedPriceRangeIds);

  const priceLow = convPrice(form.priceLow);
  const priceHigh = convPrice(form.priceHigh);
  if (priceLow !== '' || priceHigh !== '') {
    rhParts.push(`${config.rhKeys.priceDetail}:${priceLow}-${priceHigh}`);
  }

  pushMultiSelect(rhParts, config.rhKeys.releaseDate, form.checkedReleasePresetIds);

  const dateFrom = convDate(form.dateFrom);
  const dateTo = convDate(form.dateTo);
  if (dateFrom !== '' || dateTo !== '') {
    rhParts.push(`${config.rhKeys.releaseDate}:${dateFrom}-${dateTo}`);
  }

  pushMultiSelect(rhParts, config.rhKeys.pointsRatio, form.checkedPointsRatioIds);
  pushMultiSelect(rhParts, config.rhKeys.pointsEligible, form.checkedPointsEligibleIds);
  pushMultiSelect(rhParts, config.rhKeys.dealType, form.checkedDealTypeIds);

  // 読み放題(Kindle Unlimited / Prime Reading)は項目ごとにrhキー自体が異なるため、
  // 選択済みの完全な「キー:値」文字列をそのまま個別のrhエントリとして追加する(|区切りにはしない)。
  if (form.checkedReadingProgramIds) {
    form.checkedReadingProgramIds.forEach((part) => rhParts.push(part));
  }

  if (rhParts.length) params.set('rh', rhParts.join(','));

  if (form.bbnId) params.set('bbn', form.bbnId);

  if (form.sort) params.set('s', form.sort);

  if (form.aid) params.set('tag', form.aid.trim());

  return `${config.baseUrl}?${params.toString()}`;
}
