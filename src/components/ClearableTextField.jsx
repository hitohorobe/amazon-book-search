import Field from './Field.jsx';
import ActionRow from './ActionRow.jsx';
import BoxedTextField from './BoxedTextField.jsx';

// テキスト入力1つ + そのすぐ右となりのクリアボタン、という
// 検索クエリ・非表示キーワード・著者・アソシエイトIDなど複数箇所で繰り返し出てくる形をまとめたもの。
// childrenを渡すと、入力欄の下に補助コントロール(完全一致チェックボックスなど)を追加できる。
export default function ClearableTextField({ legend, id, value, onChange, placeholder, children }) {
  return (
    <Field legend={legend}>
      <ActionRow icon="close" label="クリア" onClick={() => onChange('')} disabled={!value}>
        <BoxedTextField id={id} value={value} onChange={onChange} placeholder={placeholder} />
      </ActionRow>
      {children}
    </Field>
  );
}
