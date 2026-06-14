export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  if (!items.length) return null;
  return (
    <section className="apparatus faq" aria-labelledby="faq-label">
      <p className="apparatus__label" id="faq-label">Questions</p>
      <dl>
        {items.map((f, i) => (
          <div key={i}>
            <dt>{f.q}</dt>
            <dd>{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
