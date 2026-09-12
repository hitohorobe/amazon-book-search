import Icon from './Icon.jsx';
import Field from './Field.jsx';
import IconButton from './IconButton.jsx';

function copyToClipboard(value) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(value);
  }
}

export default function ResultPanel({ url }) {
  return (
    <div className="result-panel">
      <Field legend="URL">
        <div className="action-row">
          <div className="action-row-content">
            <input type="text" id="output-url" className="boxed-field-input" readOnly value={url} />
          </div>
          <IconButton icon="content_copy" label="URLをコピー" onClick={() => copyToClipboard(url)} />
          <button type="button" className="search-button" onClick={() => window.open(url, '_blank')}>
            <Icon name="search" size={18} />
            検索する
          </button>
        </div>
      </Field>
    </div>
  );
}
