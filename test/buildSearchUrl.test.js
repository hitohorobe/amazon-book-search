import { test } from 'vitest';
import assert from 'node:assert/strict';
import { buildSearchUrl } from '../src/lib/buildSearchUrl.js';

const config = {
  baseUrl: 'https://www.amazon.co.jp/s',
  searchIndex: 'stripbooks',
  rhKeys: {
    category: 'n',
    publisher: 'p_lbr_publishers_browse-bin',
    author: 'p_27',
    priceDetail: 'p_36',
    pricePreset: 'p_n_price_fma',
    releaseDate: 'p_n_publication_date',
    pointsRatio: 'p_n_amazon_points_ratio',
    pointsEligible: 'p_n_amazon_points',
    dealType: 'p_n_deal_type',
  },
};

test('空フォームではi以外のパラメータを付けない', () => {
  const url = buildSearchUrl({}, config);
  assert.equal(url, 'https://www.amazon.co.jp/s?i=stripbooks');
});

test('検索クエリとマイナス検索を両方付与できる', () => {
  const url = buildSearchUrl({ k: '小説', minusKeywords: '除外語' }, config);
  const params = new URL(url).searchParams;
  assert.equal(params.get('k'), '小説');
  assert.equal(params.get('hidden-keywords'), '-除外語');
});

test('まとめリンク作成はASINを|区切りでhidden-keywordsにする', () => {
  const url = buildSearchUrl({ bundleAsins: 'B00A2MD724 B009KWU90U' }, config);
  const params = new URL(url).searchParams;
  assert.equal(params.get('hidden-keywords'), 'B00A2MD724|B009KWU90U');
});

test('まとめリンク作成とマイナス検索を両方入力すると空白区切りで併記される', () => {
  const url = buildSearchUrl({ bundleAsins: 'B00A2MD724', minusKeywords: '除外語' }, config);
  const params = new URL(url).searchParams;
  assert.equal(params.get('hidden-keywords'), 'B00A2MD724 -除外語');
});

test('並び順を指定するとsパラメータになる', () => {
  const url = buildSearchUrl({ sort: 'price-asc-rank' }, config);
  assert.equal(new URL(url).searchParams.get('s'), 'price-asc-rank');
});

test('並び順が空(関連度順)ならsパラメータは付かない', () => {
  const url = buildSearchUrl({ sort: '' }, config);
  assert.equal(new URL(url).searchParams.has('s'), false);
});

test('カテゴリーは最も深いnode idのみをrhに含める', () => {
  const url = buildSearchUrl({ nodeId: '466284' }, config);
  const rh = new URL(url).searchParams.get('rh');
  assert.equal(rh, 'n:466284');
});

test('価格の詳細指定は円をpn_36用の銭(x100)に変換する', () => {
  const url = buildSearchUrl({ priceLow: '0', priceHigh: '2000' }, config);
  const rh = new URL(url).searchParams.get('rh');
  assert.equal(rh, 'p_36:0-200000');
});

test('価格帯プリセットは|区切りで結合する', () => {
  const url = buildSearchUrl({ checkedPriceRangeIds: ['401005011', '401006011'] }, config);
  const rh = new URL(url).searchParams.get('rh');
  assert.equal(rh, 'p_n_price_fma:401005011|401006011');
});

test('発売日プリセットと詳細指定は両方とも同じrhキーで別エントリになる', () => {
  const url = buildSearchUrl(
    { checkedReleasePresetIds: ['2285987011'], dateFrom: '2026-01-01', dateTo: '2026-01-31' },
    config
  );
  const rh = new URL(url).searchParams.get('rh');
  assert.equal(rh, 'p_n_publication_date:2285987011,p_n_publication_date:20260101-20260131');
});

test('bbnはrhとは独立したトップレベルパラメータになる', () => {
  const url = buildSearchUrl({ bbnId: '221656495051' }, config);
  const params = new URL(url).searchParams;
  assert.equal(params.get('bbn'), '221656495051');
  assert.equal(params.has('rh'), false);
});

test('出版社・アソシエイトIDも含めた総合ケース', () => {
  const url = buildSearchUrl(
    {
      k: '異世界',
      nodeId: '466284',
      publisher: '講談社',
      priceLow: '0',
      priceHigh: '2000',
      aid: 'your-tag-22',
    },
    config
  );
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get('k'), '異世界');
  assert.equal(parsed.searchParams.get('tag'), 'your-tag-22');
  assert.equal(
    parsed.searchParams.get('rh'),
    'n:466284,p_lbr_publishers_browse-bin:講談社,p_36:0-200000'
  );
});

test('著者名はp_27としてrhに含まれる', () => {
  const url = buildSearchUrl({ author: '村上春樹' }, config);
  const rh = new URL(url).searchParams.get('rh');
  assert.equal(rh, 'p_27:村上春樹');
});

test('著者名と出版社を同時に指定できる', () => {
  const url = buildSearchUrl({ publisher: '講談社', author: '東野圭吾' }, config);
  const rh = new URL(url).searchParams.get('rh');
  assert.equal(rh, 'p_lbr_publishers_browse-bin:講談社,p_27:東野圭吾');
});

test('ポイント還元率は複数選択で|区切りになる', () => {
  const url = buildSearchUrl({ checkedPointsRatioIds: ['10476509051', '10476507051'] }, config);
  const rh = new URL(url).searchParams.get('rh');
  assert.equal(rh, 'p_n_amazon_points_ratio:10476509051|10476507051');
});

test('ポイント対象のみのチェックはp_n_amazon_pointsになる', () => {
  const url = buildSearchUrl({ checkedPointsEligibleIds: ['3346050051'] }, config);
  const rh = new URL(url).searchParams.get('rh');
  assert.equal(rh, 'p_n_amazon_points:3346050051');
});

test('値引き・セールの種類はp_n_deal_typeになる', () => {
  const url = buildSearchUrl({ checkedDealTypeIds: ['10343616051'] }, config);
  const rh = new URL(url).searchParams.get('rh');
  assert.equal(rh, 'p_n_deal_type:10343616051');
});

test('完全一致チェックがオフならkはそのまま', () => {
  const url = buildSearchUrl({ k: '異世界', exactMatch: false }, config);
  assert.equal(new URL(url).searchParams.get('k'), '異世界');
});

test('完全一致チェックがオンならkを""で囲む', () => {
  const url = buildSearchUrl({ k: '異世界 転生', exactMatch: true }, config);
  assert.equal(new URL(url).searchParams.get('k'), '"異世界 転生"');
});

test('読み放題は完全なキー:値をそのまま個別のrhエントリとして追加する(|区切りにしない)', () => {
  const url = buildSearchUrl(
    {
      checkedReadingProgramIds: [
        'p_n_feature_nineteen_browse-bin:3169286051',
        'p_n_special_merchandising_browse-bin:5304495051',
      ],
    },
    config
  );
  const rh = new URL(url).searchParams.get('rh');
  assert.equal(
    rh,
    'p_n_feature_nineteen_browse-bin:3169286051,p_n_special_merchandising_browse-bin:5304495051'
  );
});
