import { useMemo, useState } from 'react';

import paperConfig from '../data/config.json';
import paperNodesData from '../data/nodes.json';
import paperPriceRangesData from '../data/priceRanges.json';
import paperReleasePresetsData from '../data/releasePresets.json';
import paperPointsRatioData from '../data/pointsRatio.json';
import pointsEligibleData from '../data/pointsEligible.json';
import dealTypesData from '../data/dealTypes.json';
import bbnData from '../data/bbn.json';
import publishersData from '../data/publishers.json';
import sortOptionsData from '../data/sortOptions.json';

import kindleConfig from '../data/configKindle.json';
import kindleNodesData from '../data/nodesKindle.json';
import kindlePriceRangesData from '../data/priceRangesKindle.json';
import kindleReleasePresetsData from '../data/releasePresetsKindle.json';
import kindlePointsRatioData from '../data/pointsRatioKindle.json';
import bbnKindleData from '../data/bbnKindle.json';
import readingProgramsData from '../data/readingPrograms.json';

import { buildSearchUrl } from './lib/buildSearchUrl.js';
import Icon from './components/Icon.jsx';
import AccordionSection from './components/AccordionSection.jsx';
import FormatField from './components/FormatField.jsx';
import ClearableTextField from './components/ClearableTextField.jsx';
import CategorySelector from './components/CategorySelector.jsx';
import DatalistField from './components/DatalistField.jsx';
import CheckboxGroup from './components/CheckboxGroup.jsx';
import RadioGroup from './components/RadioGroup.jsx';
import PriceDetailField from './components/PriceDetailField.jsx';
import DateRangeField from './components/DateRangeField.jsx';
import ResultPanel from './components/ResultPanel.jsx';

const DATA_BY_FORMAT = {
  paper: {
    config: paperConfig,
    nodes: paperNodesData,
    priceRanges: paperPriceRangesData,
    releasePresets: paperReleasePresetsData,
    pointsRatio: paperPointsRatioData,
    bbn: bbnData,
  },
  kindle: {
    config: kindleConfig,
    nodes: kindleNodesData,
    priceRanges: kindlePriceRangesData,
    releasePresets: kindleReleasePresetsData,
    pointsRatio: kindlePointsRatioData,
    bbn: bbnKindleData,
  },
};

function bbnMapFor(bbnItems) {
  return Object.fromEntries(bbnItems.map((i) => [i.label, i.nodeId]));
}

const ACCORDION_TITLES = ['検索・絞り込み', '価格', '発売日', 'ポイント・セール', '並び順', 'アソシエイトID'];

const initialOpenSections = Object.fromEntries(
  ACCORDION_TITLES.map((title) => [title, title === '検索・絞り込み'])
);

const initialForm = {
  format: 'paper',
  k: '',
  minusKeywords: '',
  bundleAsins: '',
  nodeId: null,
  publisher: '',
  author: '',
  checkedPriceRangeIds: [],
  priceLow: '',
  priceHigh: '',
  checkedReleasePresetIds: [],
  dateFrom: '',
  dateTo: '',
  checkedPointsRatioIds: [],
  checkedPointsEligibleIds: [],
  checkedDealTypeIds: [],
  checkedReadingProgramIds: [],
  bbnLabel: '',
  sort: '',
  aid: 'hito-horobe-22',
};

export default function App() {
  const [form, setForm] = useState(initialForm);
  const patch = (partial) => setForm((prev) => ({ ...prev, ...partial }));

  const [openSections, setOpenSections] = useState(initialOpenSections);
  const toggleSection = (title) => setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  const allOpen = ACCORDION_TITLES.every((title) => openSections[title]);
  const toggleAllSections = () => {
    const next = !allOpen;
    setOpenSections(Object.fromEntries(ACCORDION_TITLES.map((title) => [title, next])));
  };

  const isPaper = form.format === 'paper';
  const active = DATA_BY_FORMAT[form.format];

  const handleFormatChange = (format) => {
    if (format === form.format) return;
    setForm((prev) => ({
      ...prev,
      format,
      nodeId: null,
      checkedPriceRangeIds: [],
      checkedReleasePresetIds: [],
      checkedPointsRatioIds: [],
      checkedPointsEligibleIds: [],
      checkedDealTypeIds: [],
      checkedReadingProgramIds: [],
      bbnLabel: '',
    }));
  };

  const bbnMap = useMemo(() => bbnMapFor(active.bbn.items), [active.bbn]);

  const url = useMemo(
    () => buildSearchUrl({ ...form, bbnId: bbnMap[form.bbnLabel] || null }, active.config),
    [form, active.config, bbnMap]
  );


  return (
    <>
      <header>
        <h1>アマゾン書籍検索サポートツール</h1>
      </header>

      <main>
        <div className="sticky-result">
          <ResultPanel url={url} />
        </div>

        <div className="format-bar">
          <FormatField value={form.format} onChange={handleFormatChange} />
        </div>

        <div id="params-area">
          <AccordionSection title="検索・絞り込み" open={openSections['検索・絞り込み']} onToggle={() => toggleSection('検索・絞り込み')}>
            <div className="two-col-group">
              <div className="two-col">
                <ClearableTextField
                  legend="検索クエリ"
                  id="input-k"
                  value={form.k}
                  onChange={(k) => patch({ k })}
                  placeholder='完全一致で検索する場合は "..." のように囲む'
                />

                <ClearableTextField
                  legend="マイナス検索"
                  id="input-minus_keywords"
                  value={form.minusKeywords}
                  onChange={(minusKeywords) => patch({ minusKeywords })}
                />

                <ClearableTextField
                  legend="まとめリンク作成"
                  id="input-bundle_asins"
                  value={form.bundleAsins}
                  onChange={(bundleAsins) => patch({ bundleAsins })}
                  placeholder={isPaper ? '9784041031004|9784041031011' : 'B00A2MD724|B009KWU90U'}
                />
              </div>

              <div className="two-col">
                <CategorySelector
                  key={form.format}
                  tree={active.nodes.tree}
                  value={form.nodeId}
                  onChange={(nodeId) => patch({ nodeId })}
                />

                <DatalistField
                  legend="出版社"
                  id="input-publisher"
                  options={publishersData.items}
                  value={form.publisher}
                  onChange={(publisher) => patch({ publisher })}
                />

                <ClearableTextField
                  legend="著者"
                  id="input-author"
                  value={form.author}
                  onChange={(author) => patch({ author })}
                />
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="価格" open={openSections['価格']} onToggle={() => toggleSection('価格')}>
            <CheckboxGroup
              legend="価格"
              name="input-price_range"
              items={active.priceRanges.items}
              checkedIds={form.checkedPriceRangeIds}
              onChange={(checkedPriceRangeIds) => patch({ checkedPriceRangeIds })}
            />

            <PriceDetailField
              low={form.priceLow}
              high={form.priceHigh}
              onChange={({ low, high }) => patch({ priceLow: low, priceHigh: high })}
            />
          </AccordionSection>

          <AccordionSection title="発売日" open={openSections['発売日']} onToggle={() => toggleSection('発売日')}>
            <CheckboxGroup
              legend="発売日"
              name="input-release_preset"
              items={active.releasePresets.items}
              checkedIds={form.checkedReleasePresetIds}
              onChange={(checkedReleasePresetIds) => patch({ checkedReleasePresetIds })}
            />

            <DateRangeField
              legend="発売日"
              from={form.dateFrom}
              to={form.dateTo}
              onChange={({ from, to }) => patch({ dateFrom: from, dateTo: to })}
            />
          </AccordionSection>

          <AccordionSection title="ポイント・セール" open={openSections['ポイント・セール']} onToggle={() => toggleSection('ポイント・セール')}>
            <CheckboxGroup
              legend="ポイント還元率"
              name="input-points_ratio"
              items={active.pointsRatio.items}
              checkedIds={form.checkedPointsRatioIds}
              onChange={(checkedPointsRatioIds) => patch({ checkedPointsRatioIds })}
            />

            {isPaper && (
              <CheckboxGroup
                legend="ポイント対象"
                name="input-points_eligible"
                items={pointsEligibleData.items}
                checkedIds={form.checkedPointsEligibleIds}
                onChange={(checkedPointsEligibleIds) => patch({ checkedPointsEligibleIds })}
              />
            )}

            {isPaper && (
              <CheckboxGroup
                legend="値引き・セール"
                name="input-deal_type"
                items={dealTypesData.items}
                checkedIds={form.checkedDealTypeIds}
                onChange={(checkedDealTypeIds) => patch({ checkedDealTypeIds })}
              />
            )}

            {!isPaper && (
              <CheckboxGroup
                legend="読み放題"
                name="input-reading_program"
                items={readingProgramsData.items}
                checkedIds={form.checkedReadingProgramIds}
                onChange={(checkedReadingProgramIds) => patch({ checkedReadingProgramIds })}
              />
            )}

            <DatalistField
              legend="セール・特集 (bbn)"
              id="input-bbn"
              options={active.bbn.items.map((i) => i.label)}
              value={form.bbnLabel}
              onChange={(bbnLabel) => patch({ bbnLabel })}
            />
          </AccordionSection>

          <AccordionSection title="並び順" open={openSections['並び順']} onToggle={() => toggleSection('並び順')}>
            <RadioGroup
              legend="並び順"
              name="input-sort"
              items={sortOptionsData.items}
              value={form.sort}
              onChange={(sort) => patch({ sort })}
            />
          </AccordionSection>

          <AccordionSection title="アソシエイトID" open={openSections['アソシエイトID']} onToggle={() => toggleSection('アソシエイトID')}>
            <ClearableTextField
              legend="アソシエイトID"
              id="input-aid"
              value={form.aid}
              onChange={(aid) => patch({ aid })}
            />
          </AccordionSection>
        </div>
      </main>

      <div className="float-button-group">
        <button
          type="button"
          className="float-icon-button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="トップへ戻る"
          title="トップへ戻る"
        >
          <Icon name="arrow_upward" size={18} />
        </button>
        <button type="button" className="float-toggle-button" onClick={toggleAllSections}>
          <Icon name={allOpen ? 'unfold_less' : 'unfold_more'} size={18} />
          {allOpen ? 'すべて折りたたむ' : 'すべて展開'}
        </button>
      </div>

      <footer>
        <div style={{ fontSize: 'x-small', textAlign: 'right' }}>generated by amazon-book-search</div>
      </footer>
    </>
  );
}
