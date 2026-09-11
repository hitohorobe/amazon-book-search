import Field from './Field.jsx';
import ActionRow from './ActionRow.jsx';

// { label, nodeId } の配列をチェックボックス群として表示する共通コンポーネント。
// 価格帯プリセット・発売日プリセット・ポイント還元率・ポイント対象・値引き/セール・読み放題で共用。
export default function CheckboxGroup({ legend, name, items, checkedIds, onChange }) {
  const toggle = (nodeId) => {
    if (checkedIds.includes(nodeId)) {
      onChange(checkedIds.filter((id) => id !== nodeId));
    } else {
      onChange([...checkedIds, nodeId]);
    }
  };

  return (
    <Field legend={legend}>
      <ActionRow icon="close" label="クリア" onClick={() => onChange([])} disabled={checkedIds.length === 0}>
        <div className="checkbox-list">
          {items.map((item) => (
            <label key={item.nodeId}>
              <input
                type="checkbox"
                name={name}
                checked={checkedIds.includes(item.nodeId)}
                onChange={() => toggle(item.nodeId)}
              />
              {item.label}
            </label>
          ))}
        </div>
      </ActionRow>
    </Field>
  );
}
