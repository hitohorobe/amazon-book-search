import Icon from './Icon.jsx';

// 多数のフィルター項目をテーマ別にグルーピングして折りたたむための、単一カラムのアコーディオン。
// 複数セクションを同時に開いたままにできる(相互排他にしない)。開閉状態は呼び出し側(App.jsx)が
// 持つ(「すべて展開/折りたたむ」ボタンから全セクションをまとめて操作できるようにするため)。
export default function AccordionSection({ title, open, onToggle, children }) {
  return (
    <section className="accordion-section">
      <button type="button" className="accordion-header" onClick={onToggle} aria-expanded={open}>
        <span className="accordion-title">{title}</span>
        <span className={`accordion-chevron${open ? ' accordion-chevron-open' : ''}`}>
          <Icon name="expand_more" />
        </span>
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </section>
  );
}
