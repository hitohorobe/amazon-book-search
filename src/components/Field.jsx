// アコーディオンセクション内に並べる、1項目分の軽量なサブセクション。
// カード(影・角丸)としての見た目はAccordionSection側が持つため、ここでは見出し+本文のみ。
export default function Field({ legend, children }) {
  return (
    <div className="field">
      <div className="field-header">
        <span className="field-legend">{legend}</span>
      </div>
      <div className="field-body">{children}</div>
    </div>
  );
}
