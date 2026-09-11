import Field from './Field.jsx';
import ActionRow from './ActionRow.jsx';

export default function DateRangeField({ legend, from, to, onChange }) {
  return (
    <Field legend={legend}>
      <ActionRow
        icon="close"
        label="クリア"
        onClick={() => onChange({ from: '', to: '' })}
        disabled={!from && !to}
      >
        <div className="date-range-inputs">
          <input type="date" value={from} onChange={(e) => onChange({ from: e.target.value, to })} />
          {' 〜 '}
          <input type="date" value={to} onChange={(e) => onChange({ from, to: e.target.value })} />
        </div>
      </ActionRow>
    </Field>
  );
}
