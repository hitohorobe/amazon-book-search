import Field from './Field.jsx';
import ActionRow from './ActionRow.jsx';
import PriceRangeSlider from './PriceRangeSlider.jsx';

const SLIDER_MIN = 0;
const SLIDER_MAX = 10000;
const SLIDER_STEP = 100;

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

// 価格(詳細指定): テキスト入力(円、上限を超える金額もそのまま入力可能)が正、
// スライダーはSLIDER_MIN〜SLIDER_MAXの範囲を操作するための補助UI。
export default function PriceDetailField({ low, high, onChange }) {
  const sliderLow = low === '' ? SLIDER_MIN : clamp(Number(low), SLIDER_MIN, SLIDER_MAX);
  const sliderHigh = high === '' ? SLIDER_MAX : clamp(Number(high), SLIDER_MIN, SLIDER_MAX);

  return (
    <Field legend="価格">
      <ActionRow
        icon="close"
        label="クリア"
        onClick={() => onChange({ low: '', high: '' })}
        disabled={low === '' && high === ''}
      >
        <div className="price-range-inputs">
          <input
            type="text"
            id="input-price_low"
            value={low}
            onChange={(e) => onChange({ low: e.target.value, high })}
          />
          円 〜{' '}
          <input
            type="text"
            id="input-price_high"
            value={high}
            onChange={(e) => onChange({ low, high: e.target.value })}
          />
          円
        </div>
      </ActionRow>
      <PriceRangeSlider
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={SLIDER_STEP}
        low={sliderLow}
        high={sliderHigh}
        onChange={({ low: newLow, high: newHigh }) => onChange({ low: String(newLow), high: String(newHigh) })}
      />
    </Field>
  );
}
