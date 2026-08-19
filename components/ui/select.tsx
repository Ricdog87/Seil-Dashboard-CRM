export function Select({
  label,
  className = "",
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const feld = (
    <select
      className={`h-control rounded-seil border border-seil-line bg-seil-card-alt px-2 text-body text-seil-text ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
  if (!label) return feld;
  return (
    <label className="inline-flex items-center gap-2 text-kicker tracking-kicker text-seil-muted uppercase">
      {label}
      {feld}
    </label>
  );
}
