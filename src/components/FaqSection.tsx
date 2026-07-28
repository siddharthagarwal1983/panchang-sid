export type FaqItem = { q: string; a: string };

/** Visible FAQ list that mirrors the FAQPage JSON-LD on the same route. */
export function FaqSection({
  items,
  heading = "Frequently asked questions",
}: {
  items: FaqItem[];
  heading?: string;
}) {
  return (
    <section className="panel px-5 py-5">
      <h2 className="text-sm font-semibold text-foreground">{heading}</h2>
      <dl className="mt-3 space-y-3">
        {items.map((item) => (
          <div key={item.q}>
            <dt className="text-sm font-medium text-foreground">{item.q}</dt>
            <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
