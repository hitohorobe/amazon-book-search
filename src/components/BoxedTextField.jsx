// マテリアルデザインの「アウトラインテキストフィールド」に相当する見た目の入力欄本体。
// クリアボタンはこの中には置かず、呼び出し側でActionRowを使って右となりに配置する。
export default function BoxedTextField({ id, listId, value, onChange, placeholder }) {
  return (
    <input
      type="text"
      id={id}
      className="boxed-field-input"
      list={listId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}
