import Field from './Field.jsx';
import ActionRow from './ActionRow.jsx';
import BoxedTextField from './BoxedTextField.jsx';

// テキスト入力 + <datalist> によるオートコンプリート付き入力(ボックス内右端にクリアアイコン付き)。
// 出版社・セール特集(bbn)など、候補一覧から選ぶが自由入力も許す項目で使い回す。
export default function DatalistField({ legend, id, options, value, onChange }) {
  const listId = `${id}-list`;
  return (
    <Field legend={legend}>
      <ActionRow icon="close" label="クリア" onClick={() => onChange('')} disabled={!value}>
        <BoxedTextField id={id} listId={listId} value={value} onChange={onChange} />
      </ActionRow>
      <datalist id={listId}>
        {options.map((label) => (
          <option key={label} value={label} />
        ))}
      </datalist>
    </Field>
  );
}
