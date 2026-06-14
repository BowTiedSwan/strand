export default function Summary({ text }: { text: string }) {
  return (
    <aside className="summary">
      <span className="summary__label">Summary</span>
      <p className="post-summary">{text}</p>
    </aside>
  );
}
