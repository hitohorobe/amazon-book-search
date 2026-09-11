import Icon from './Icon.jsx';
import Field from './Field.jsx';
import ActionRow from './ActionRow.jsx';

function copyToClipboard(value) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(value);
  }
}

export default function ResultPanel({ url, allOpen, onToggleAll }) {
  return (
    <div className="result-panel">
      <div className="result-panel-top">
        <button type="button" className="search-button" onClick={() => window.open(url, '_blank')}>
          <Icon name="search" size={22} />
          検索する
        </button>

        <button type="button" className="text-button" onClick={onToggleAll}>
          <Icon name={allOpen ? 'unfold_less' : 'unfold_more'} size={18} />
          {allOpen ? 'すべて折りたたむ' : 'すべて展開'}
        </button>
      </div>

      <Field legend="URL">
        <ActionRow icon="content_copy" label="URLをコピー" onClick={() => copyToClipboard(url)}>
          <input type="text" id="output-url" className="boxed-field-input" readOnly value={url} />
        </ActionRow>
      </Field>
    </div>
  );
}
