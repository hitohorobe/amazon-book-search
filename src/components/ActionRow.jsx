import IconButton from './IconButton.jsx';

// 入力欄(や選択欄・チェックボックス群)と、その「すぐ右となり」に置く
// アイコンボタン(クリア/コピーなど)を横並びにする共通レイアウト。
// ボックスの中に重ねない(datalistの矢印等と衝突しない)・カードの角に置かない
// (カードごと消えると誤解されない)ようにするための配置。
export default function ActionRow({ icon, label, onClick, disabled, children }) {
  return (
    <div className="action-row">
      <div className="action-row-content">{children}</div>
      <IconButton icon={icon} label={label} onClick={onClick} disabled={disabled} />
    </div>
  );
}
