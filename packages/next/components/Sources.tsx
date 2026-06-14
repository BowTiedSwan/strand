export default function Sources({ items }: { items: { title: string; url: string; publisher?: string }[] }) {
  if (!items.length) return null;
  return (
    <section className="sources apparatus" aria-labelledby="sources-label">
      <p className="apparatus__label" id="sources-label">Sources</p>
      <ol>
        {items.map((s, i) => (
          <li key={i}>
            <a href={s.url} rel="nofollow noopener">{s.title}</a>
            {s.publisher ? ` — ${s.publisher}` : ""}
          </li>
        ))}
      </ol>
    </section>
  );
}
