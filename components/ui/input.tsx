export function Input({
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-control rounded-seil border border-seil-line bg-seil-card-alt px-2.5 text-body text-seil-text placeholder:text-seil-muted ${className}`}
      {...rest}
    />
  );
}

export function Checkbox({
  label,
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`inline-flex items-center gap-2 text-body text-seil-body ${className}`}>
      <input
        type="checkbox"
        className="h-3.5 w-3.5 rounded-seil border border-seil-line bg-seil-card-alt accent-seil-accent"
        {...rest}
      />
      {label}
    </label>
  );
}
