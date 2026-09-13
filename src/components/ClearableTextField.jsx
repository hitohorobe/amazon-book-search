import Field from './Field.jsx';
import ActionRow from './ActionRow.jsx';
import BoxedTextField from './BoxedTextField.jsx';

// テキスト入力1つ + そのすぐ右となりのクリアボタン、という
// 検索クエリ・非表示キーワード・著者・アソシエイトIDなど複数箇所で繰り返し出てくる形をまとめたもの。
export default function ClearableTextField({ legend, id, value, onChange, placeholder }) {
  return (
    <Field legend={legend}>
      <ActionRow icon="close" label="クリア" onClick={() => onChange('')} disabled={!value}>
        <BoxedTextField id={id} value={value} onChange={onChange} placeholder={placeholder} />
      </ActionRow>
    </Field>
  );
}
