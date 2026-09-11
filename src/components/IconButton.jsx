import Icon from './Icon.jsx';

// マテリアルデザインのicon buttonに相当する共通コンポーネント。
export default function IconButton({ icon, label, onClick, disabled = false, className = '' }) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Icon name={icon} />
    </button>
  );
}
