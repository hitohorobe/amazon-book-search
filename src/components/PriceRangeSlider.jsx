// 2本のtype=range inputを重ねて1本に見せる、左=下限/右=上限のスライダー。
// 特定のフィールドに依存しない汎用コンポーネント(min/max/step/値/onChangeを渡すだけ)。
export default function PriceRangeSlider({ min, max, step, low, high, onChange }) {
  const toPercent = (v) => ((Number(v) - min) / (max - min)) * 100;
  const lowPercent = toPercent(low);
  const highPercent = toPercent(high);

  const handleLowChange = (e) => {
    const next = Number(e.target.value);
    onChange({ low: next, high: next > Number(high) ? next : Number(high) });
  };

  const handleHighChange = (e) => {
    const next = Number(e.target.value);
    onChange({ low: next < Number(low) ? next : Number(low), high: next });
  };

  return (
    <div className="dual-slider">
      <div className="dual-slider-track">
        <div
          className="dual-slider-fill"
          style={{ left: `${lowPercent}%`, width: `${highPercent - lowPercent}%` }}
        />
      </div>
      <input type="range" min={min} max={max} step={step} value={low} onChange={handleLowChange} />
      <input type="range" min={min} max={max} step={step} value={high} onChange={handleHighChange} />
    </div>
  );
}
