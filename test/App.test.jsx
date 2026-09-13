// App全体をjsdom上に実際にマウントし、カスケード選択・価格スライダー・
// チェックボックス・出版社・bbnなどの実際のユーザー操作をシミュレートして
// 出力URLが期待通りになるかを検証する。ブラウザを起動できない実行環境でも
// 実際のReactレンダリング・イベント処理を通して検証できる。
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';

let container;
let root;

function outputUrl() {
  return container.querySelector('#output-url').value;
}

function setNativeValue(el, value) {
  const proto = Object.getPrototypeOf(el);
  const desc = Object.getOwnPropertyDescriptor(proto, 'value');
  desc.set.call(el, value);
}

function fireInput(el, value) {
  setNativeValue(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function fireChange(el, value) {
  setNativeValue(el, value);
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

// 多くのフィールドはテーマ別にグルーピングされたアコーディオン(AccordionSection)の中にあり、
// 「基本」以外はデフォルトで折りたたまれている。操作対象のセクションを開いてから検証する。
function openAccordion(titleSubstring) {
  const header = [...container.querySelectorAll('.accordion-header')].find((h) =>
    h.textContent.includes(titleSubstring)
  );
  header.click();
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(<App />);
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('初期状態ではi=stripbooksのみのURL', () => {
  expect(outputUrl()).toBe('https://www.amazon.co.jp/s?i=stripbooks&tag=hito-horobe-22');
});

test('検索クエリを入力するとkが付与される', () => {
  const kInput = container.querySelector('#input-k');
  act(() => fireInput(kInput, '異世界'));
  expect(outputUrl()).toContain('k=%E7%95%B0%E4%B8%96%E7%95%8C');
});

test('検索クエリのプレースホルダーで完全一致検索(""で囲む)の入力方法を案内している', () => {
  const kInput = container.querySelector('#input-k');
  expect(kInput.placeholder).toContain('"..."');

  act(() => fireInput(kInput, '"異世界"'));
  const k = decodeURIComponent(new URL(outputUrl()).searchParams.get('k'));
  expect(k).toBe('"異世界"');
});

test('マイナス検索に語を入力すると先頭に-が付いてhidden-keywordsになる', () => {
  const input = container.querySelector('#input-minus_keywords');
  act(() => fireInput(input, '除外語1 除外語2'));
  const hk = decodeURIComponent(new URL(outputUrl()).searchParams.get('hidden-keywords'));
  expect(hk).toBe('-除外語1 -除外語2');
});

test('まとめリンク作成にASINを複数入力すると|区切りでhidden-keywordsになる', () => {
  const input = container.querySelector('#input-bundle_asins');
  act(() => fireInput(input, 'B00A2MD724|B009KWU90U'));
  const hk = decodeURIComponent(new URL(outputUrl()).searchParams.get('hidden-keywords'));
  expect(hk).toBe('B00A2MD724|B009KWU90U');
});

test('まとめリンク作成のプレースホルダは紙の本ではISBN例、Kindle本ではASIN例になる', () => {
  const paperInput = container.querySelector('#input-bundle_asins');
  expect(paperInput.getAttribute('placeholder')).toBe('9784041031004|9784041031011');

  const kindleRadio = [...container.querySelectorAll('.field label')]
    .find((l) => l.textContent.includes('Kindle本'))
    .querySelector('input[type=radio]');
  act(() => kindleRadio.click());

  const kindleInput = container.querySelector('#input-bundle_asins');
  expect(kindleInput.getAttribute('placeholder')).toBe('B00A2MD724|B009KWU90U');
});

test('紙の本/Kindle本はアコーディオンではなく常に一番上に表示され、ラジオボタンで選ぶ', () => {
  const formatField = [...container.querySelectorAll('.field-legend')].find((el) =>
    el.textContent.includes('対象')
  ).closest('.field');
  expect(formatField.closest('.accordion-section')).toBeNull();
  expect(formatField.closest('#params-area')).toBeNull();
  expect(formatField.querySelectorAll('input[type=radio]')).toHaveLength(2);
});

test('カテゴリーをカスケードで選択し、最も深いnode idだけがrhに入る', () => {
  const topSelect = container.querySelectorAll('#node-selects select')[0];
  const litOption = [...topSelect.options].find((o) => o.textContent === '文学・評論');
  act(() => fireChange(topSelect, litOption.value));

  expect(outputUrl()).toContain('rh=n%3A466284');
  expect(container.querySelectorAll('#node-selects select')).toHaveLength(2);

  const level1 = container.querySelectorAll('#node-selects select')[1];
  const bungeiOption = [...level1.options].find((o) => o.textContent === '文芸作品');
  act(() => fireChange(level1, bungeiOption.value));

  // 親(466284)ではなく、より深い選択(548206)だけが使われる
  expect(outputUrl()).toContain('rh=n%3A548206');
  expect(outputUrl()).not.toContain('466284');
});

test('カテゴリーのCLEARで選択状態と<select>の数が初期化される', () => {
  const topSelect = container.querySelectorAll('#node-selects select')[0];
  const litOption = [...topSelect.options].find((o) => o.textContent === '文学・評論');
  act(() => fireChange(topSelect, litOption.value));
  expect(container.querySelectorAll('#node-selects select')).toHaveLength(2);

  const clearButton = container.querySelector('#node-selects').closest('.field').querySelector('.icon-button');
  act(() => clearButton.click());

  expect(container.querySelectorAll('#node-selects select')).toHaveLength(1);
  expect(outputUrl()).toBe('https://www.amazon.co.jp/s?i=stripbooks&tag=hito-horobe-22');
});

test('価格スライダーの左つまみを動かすとテキストとURLが連動する', () => {
  act(() => openAccordion('価格'));
  const [lowSlider] = container.querySelectorAll('.dual-slider input[type=range]');
  act(() => fireInput(lowSlider, '1500'));

  expect(container.querySelector('#input-price_low').value).toBe('1500');
  expect(outputUrl()).toContain('p_36%3A150000-1000000');
});

test('価格テキストにスライダー上限(10,000円)を超える値を直接入力できる', () => {
  act(() => openAccordion('価格'));
  const highInput = container.querySelector('#input-price_high');
  act(() => fireInput(highInput, '250000'));

  // スライダー側は表示上10,000円に張り付くが、実際の値はテキストの入力がそのまま使われる
  // (下限は未入力のため空、上限だけが250000円->25000000銭になる)
  expect(outputUrl()).toContain('p_36%3A-25000000');
});

test('アソシエイトIDには既定値hito-horobe-22が入っており、クリアすると消える', () => {
  act(() => openAccordion('アソシエイトID'));
  const aidInput = container.querySelector('#input-aid');
  expect(aidInput.value).toBe('hito-horobe-22');
  expect(new URL(outputUrl()).searchParams.get('tag')).toBe('hito-horobe-22');

  const clearIcon = aidInput.closest('.action-row').querySelector('.icon-button');
  act(() => clearIcon.click());
  expect(aidInput.value).toBe('');
  expect(new URL(outputUrl()).searchParams.has('tag')).toBe(false);
});

test('出版社を入力するとrhに反映される', () => {
  const publisherInput = container.querySelector('#input-publisher');
  act(() => fireInput(publisherInput, '講談社'));
  expect(outputUrl()).toContain('p_lbr_publishers_browse-bin');
  expect(outputUrl()).toContain(encodeURIComponent('講談社'));
});

test('著者名を入力するとp_27としてrhに反映される', () => {
  const authorInput = container.querySelector('#input-author');
  act(() => fireInput(authorInput, '村上春樹'));
  const rh = decodeURIComponent(new URL(outputUrl()).searchParams.get('rh'));
  expect(rh).toBe('p_27:村上春樹');
});

test('ポイント還元率・ポイント対象・値引き/セールのチェックボックスがrhに反映される', () => {
  act(() => openAccordion('ポイント・セール'));
  act(() => container.querySelector('input[name=input-points_ratio]').click());
  act(() => container.querySelector('input[name=input-points_eligible]').click());
  act(() => container.querySelector('input[name=input-deal_type]').click());

  const rh = decodeURIComponent(new URL(outputUrl()).searchParams.get('rh'));
  expect(rh).toContain('p_n_amazon_points_ratio:');
  expect(rh).toContain('p_n_amazon_points:');
  expect(rh).toContain('p_n_deal_type:');
});

test('検索クエリ欄: クリアボタンは入力欄のすぐ右となりにあり、空のときは無効・入力すると有効になる', () => {
  const kInput = container.querySelector('#input-k');
  const row = kInput.closest('.action-row');
  const clearIcon = row.querySelector('[aria-label="クリア"]');

  // ボックス内(input自体の子孫)ではなく、ボックスの外(すぐ右となり)にある
  expect(kInput.contains(clearIcon)).toBe(false);
  expect(clearIcon.disabled).toBe(true);

  act(() => fireInput(kInput, '異世界'));
  expect(clearIcon.disabled).toBe(false);

  act(() => clearIcon.click());
  expect(kInput.value).toBe('');
  expect(outputUrl()).toBe('https://www.amazon.co.jp/s?i=stripbooks&tag=hito-horobe-22');
});

test('URL欄のコピーボタンはボックスのすぐ右となりにある(常に有効)', () => {
  const urlInput = container.querySelector('#output-url');
  const urlIcon = urlInput.closest('.action-row').querySelector('.icon-button');

  expect(urlInput.contains(urlIcon)).toBe(false);
  expect(urlIcon.disabled).toBe(false);
});

test('価格・発売日・ジャンル・プリセット群にもクリアボタンがある', () => {
  act(() => openAccordion('価格'));
  act(() => openAccordion('発売日'));
  const legends = [...container.querySelectorAll('.field-legend')].map((el) => el.textContent);
  for (const legend of ['ジャンル', '価格', '発売日']) {
    expect(legends).toContain(legend);
  }
  // フィールドの数だけクリア用アイコンボタン(検索する/コピー用を除く)が存在する
  const clearButtons = [...container.querySelectorAll('.icon-button')].filter((b) => b.getAttribute('aria-label') === 'クリア');
  expect(clearButtons.length).toBeGreaterThanOrEqual(9);
});

test('発売日プリセットのチェックボックスをクリックするとrhに追加される', () => {
  act(() => openAccordion('発売日'));
  const checkbox = container.querySelector('input[name=input-release_preset]');
  act(() => checkbox.click());
  expect(outputUrl()).toContain('p_n_publication_date%3A');
});

test('価格帯プリセットは複数選択で|区切りになる', () => {
  act(() => openAccordion('価格'));
  const checkboxes = container.querySelectorAll('input[name=input-price_range]');
  act(() => checkboxes[0].click());
  act(() => checkboxes[1].click());
  const rh = decodeURIComponent(new URL(outputUrl()).searchParams.get('rh'));
  expect(rh).toMatch(/p_n_price_fma:\S+\|\S+/);
});

test('セール・特集(bbn)はrhと独立したトップレベルパラメータになる', () => {
  act(() => openAccordion('ポイント・セール'));
  const bbnInput = container.querySelector('#input-bbn');
  const firstOptionLabel = container.querySelector('#input-bbn-list option').value;
  act(() => fireInput(bbnInput, firstOptionLabel));

  const parsed = new URL(outputUrl());
  expect(parsed.searchParams.get('bbn')).toBeTruthy();
  expect(parsed.searchParams.has('rh')).toBe(false);
});

test('並び順をラジオボタンで選ぶとsパラメータが付き、関連度順(既定値)を選ぶとsが消える', () => {
  act(() => openAccordion('並び順'));
  const priceAscRadio = [...container.querySelectorAll('input[name=input-sort]')].find(
    (r) => r.closest('label').textContent === '価格の安い順'
  );
  act(() => priceAscRadio.click());
  expect(new URL(outputUrl()).searchParams.get('s')).toBe('price-asc-rank');

  const defaultRadio = [...container.querySelectorAll('input[name=input-sort]')].find(
    (r) => r.closest('label').textContent.includes('関連度順')
  );
  act(() => defaultRadio.click());
  expect(new URL(outputUrl()).searchParams.has('s')).toBe(false);
});

test('「すべて展開」ボタンで全アコーディオンが開き、再度押すと全て閉じる(初期状態は検索・絞り込みのみ開いている)', () => {
  function toggleAllButton() {
    return container.querySelector('.float-toggle-button');
  }

  expect(container.querySelectorAll('.accordion-body')).toHaveLength(1);
  expect(toggleAllButton().textContent).toContain('すべて展開');

  act(() => toggleAllButton().click());
  expect(container.querySelectorAll('.accordion-body')).toHaveLength(6);
  expect(toggleAllButton().textContent).toContain('すべて折りたたむ');

  act(() => toggleAllButton().click());
  expect(container.querySelectorAll('.accordion-body')).toHaveLength(0);
  expect(toggleAllButton().textContent).toContain('すべて展開');
});

test('「トップへ戻る」ボタンがすべて展開/折りたたむボタンと同じフローティング領域にある', () => {
  const scrollTopButton = container.querySelector('.float-icon-button');
  const toggleAllButton = container.querySelector('.float-toggle-button');
  expect(scrollTopButton.closest('.float-button-group')).toBe(toggleAllButton.closest('.float-button-group'));

  const originalScrollTo = window.scrollTo;
  window.scrollTo = () => {};
  act(() => scrollTopButton.click());
  window.scrollTo = originalScrollTo;
});

describe('紙の本 / Kindle本の切り替え', () => {
  function checkboxFor(label) {
    return [...container.querySelectorAll('.field label')].find((l) => l.textContent.includes(label)).querySelector(
      'input[type=radio]'
    );
  }

  test('初期状態は「紙の本」で、i=stripbooksになる', () => {
    expect(outputUrl()).toBe('https://www.amazon.co.jp/s?i=stripbooks&tag=hito-horobe-22');
  });

  test('Kindle本に切り替えるとi=digital-textになり、ジャンルツリーが差し替わる', () => {
    act(() => checkboxFor('Kindle本').click());
    expect(outputUrl()).toBe('https://www.amazon.co.jp/s?i=digital-text&tag=hito-horobe-22');

    const topSelect = container.querySelectorAll('#node-selects select')[0];
    const labels = [...topSelect.options].map((o) => o.textContent);
    expect(labels).toContain('マンガ');
  });

  test('Kindle > マンガ を選ぶと少年マンガ等の下位ジャンルが選べる', () => {
    act(() => checkboxFor('Kindle本').click());

    const topSelect = container.querySelectorAll('#node-selects select')[0];
    const mangaOption = [...topSelect.options].find((o) => o.textContent === 'マンガ');
    act(() => fireChange(topSelect, mangaOption.value));

    const level1 = container.querySelectorAll('#node-selects select')[1];
    const labels = [...level1.options].map((o) => o.textContent);
    expect(labels).toContain('少年マンガ');

    const shonenOption = [...level1.options].find((o) => o.textContent === '少年マンガ');
    act(() => fireChange(level1, shonenOption.value));
    expect(outputUrl()).toContain(`rh=n%3A${shonenOption.value}`);
  });

  test('ジャンル等を選んだ状態でKindleへ切り替えると選択がリセットされる', () => {
    const topSelect = container.querySelectorAll('#node-selects select')[0];
    const litOption = [...topSelect.options].find((o) => o.textContent === '文学・評論');
    act(() => fireChange(topSelect, litOption.value));
    expect(outputUrl()).toContain('rh=n%3A466284');

    act(() => checkboxFor('Kindle本').click());
    expect(outputUrl()).toBe('https://www.amazon.co.jp/s?i=digital-text&tag=hito-horobe-22');
  });

  test('Kindle選択時は「ポイント対象」「値引き・セール」が非表示になり、「読み放題」が表示される', () => {
    act(() => openAccordion('ポイント・セール'));
    act(() => checkboxFor('Kindle本').click());
    expect(container.querySelector('input[name=input-points_eligible]')).toBeNull();
    expect(container.querySelector('input[name=input-deal_type]')).toBeNull();
    expect(container.querySelector('input[name=input-reading_program]')).not.toBeNull();
  });

  test('Kindle選択時はbbnの候補一覧が紙とは別のもの(Kindle本向け)に差し替わる', () => {
    act(() => openAccordion('ポイント・セール'));
    const bbnInputBefore = container.querySelector('#input-bbn');
    expect(bbnInputBefore).not.toBeNull();
    const paperOptions = [...container.querySelectorAll('#input-bbn-list option')].map((o) => o.value);

    act(() => checkboxFor('Kindle本').click());
    const kindleOptions = [...container.querySelectorAll('#input-bbn-list option')].map((o) => o.value);

    expect(kindleOptions).not.toEqual(paperOptions);
    expect(kindleOptions).toContain('Kindle本 セール&キャンペーン (無期限)');
  });

  test('読み放題(Kindle Unlimited)はrhの独立したエントリとして追加される', () => {
    act(() => checkboxFor('Kindle本').click());
    act(() => openAccordion('ポイント・セール'));
    const checkbox = container.querySelector('input[name=input-reading_program]');
    act(() => checkbox.click());
    const rh = decodeURIComponent(new URL(outputUrl()).searchParams.get('rh'));
    expect(rh).toBe('p_n_feature_nineteen_browse-bin:3169286051');
  });

  test('Kindleのポイント還元率プリセット(紙とは別体系)が使える', () => {
    act(() => checkboxFor('Kindle本').click());
    act(() => openAccordion('ポイント・セール'));
    const checkbox = container.querySelector('input[name=input-points_ratio]');
    act(() => checkbox.click());
    const rh = decodeURIComponent(new URL(outputUrl()).searchParams.get('rh'));
    expect(rh).toBe('p_n_amazon_points_ratio:10476514051');
  });

  test('紙に戻すとi=stripbooksに戻る', () => {
    act(() => checkboxFor('Kindle本').click());
    act(() => checkboxFor('紙の本').click());
    expect(outputUrl()).toBe('https://www.amazon.co.jp/s?i=stripbooks&tag=hito-horobe-22');
  });
});
