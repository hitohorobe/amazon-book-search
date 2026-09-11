import { findNodeById, findPathToId } from '../lib/nodeTree.js';
import Field from './Field.jsx';
import ActionRow from './ActionRow.jsx';

// 大分類→中分類→…とカスケードする<select>群。
// 選択済みの最も深いnode id(value)だけを状態として持ち、そこから逆算して
// 各階層の選択肢・選択状態を毎回導出する(完全な制御コンポーネント)。
export default function CategorySelector({ tree, value, onChange }) {
  const path = findPathToId(tree, value) || [];

  const levels = [];
  let list = tree;
  for (let level = 0; list && list.length > 0; level++) {
    levels.push({ level, list, selectedId: path[level] || '' });
    if (!path[level]) break;
    list = findNodeById(list, path[level]).children;
  }

  const handleChange = (level, newId) => {
    onChange(newId || path[level - 1] || null);
  };

  return (
    <Field legend="ジャンル">
      <ActionRow icon="close" label="クリア" onClick={() => onChange(null)} disabled={!value}>
        <div id="node-selects">
          {levels.map(({ level, list: options, selectedId }) => (
            <select key={level} value={selectedId} onChange={(e) => handleChange(level, e.target.value)}>
              <option value="">{level === 0 ? '-- 大分類を選択 --' : '-- 選択しない(ここまでで確定) --'}</option>
              {options.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      </ActionRow>
    </Field>
  );
}
