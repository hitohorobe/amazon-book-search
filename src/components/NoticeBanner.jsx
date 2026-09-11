export default function NoticeBanner({ notices }) {
  const visible = notices.filter(Boolean);
  if (visible.length === 0) return null;
  return (
    <div className="notice">
      {visible.map((n, i) => (
        <div key={i}>&#9888; {n}</div>
      ))}
    </div>
  );
}
