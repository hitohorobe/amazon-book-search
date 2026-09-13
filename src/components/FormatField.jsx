import Field from './Field.jsx';

// 紙の本 / Kindle本の切り替え。node idの体系が全く異なる(価格帯・発売日プリセット・
// ジャンルツリーなど)ため、常にどちらか一方だけを選べるラジオボタンにする。
export default function FormatField({ value, onChange }) {
  return (
    <Field legend="対象">
      <div className="format-options">
        <label>
          <input type="radio" name="format" checked={value === 'paper'} onChange={() => onChange('paper')} />
          紙の本
        </label>
        <label>
          <input type="radio" name="format" checked={value === 'kindle'} onChange={() => onChange('kindle')} />
          Kindle本
        </label>
      </div>
    </Field>
  );
}
