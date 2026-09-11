import Field from './Field.jsx';

// { label, value } の配列をラジオボタン群として表示する共通コンポーネント(単一選択)。
// 並び順のように「どれか1つだけを選ぶ」項目で使う。既定値(通常は関連度順など)を選ぶことが
// 実質的なクリアになるため、チェックボックス群と違い専用のクリアボタンは持たない。
export default function RadioGroup({ legend, name, items, value, onChange }) {
  return (
    <Field legend={legend}>
      <div className="radio-list">
        {items.map((item) => (
          <label key={item.value}>
            <input type="radio" name={name} checked={value === item.value} onChange={() => onChange(item.value)} />
            {item.label}
          </label>
        ))}
      </div>
    </Field>
  );
}
