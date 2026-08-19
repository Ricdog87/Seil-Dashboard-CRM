/** Rahmen statt Schatten. Trennung ueber Linien, nicht ueber Kartenstapel. */
export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-seil border border-seil-line bg-seil-card ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  meta,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-seil-line px-4 py-3">
      <h2 className="text-body text-seil-text">{title}</h2>
      {meta ? <span className="text-kicker text-seil-muted">{meta}</span> : null}
    </div>
  );
}

export function CardBody({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`px-4 py-3 ${className}`}>{children}</div>;
}
