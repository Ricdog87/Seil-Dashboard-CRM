/**
 * Dichte Tabelle - die Grundwaehrung des Cockpits.
 * Zeilenhoehe ueber --seil-row-h (38px), Zahlen immer tabular.
 */
export function Table({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-body ${className}`}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  // Die letzte Zeile schliesst mit der Karte ab - ohne doppelte Linie.
  return <tbody className="[&>tr:last-child>td]:border-b-0">{children}</tbody>;
}

export function TH({
  numeric = false,
  className = "",
  children,
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      className={`border-b border-seil-line px-3 py-2 text-kicker font-normal tracking-kicker whitespace-nowrap text-seil-muted uppercase ${
        numeric ? "text-right" : "text-left"
      } ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TR({
  interactive = false,
  highlight = false,
  className = "",
  children,
  ...rest
}: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean; highlight?: boolean }) {
  return (
    <tr
      className={`${highlight ? "bg-seil-accent-bg" : ""} ${
        interactive ? "cursor-pointer transition-colors hover:bg-seil-card-alt" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TD({
  numeric = false,
  className = "",
  children,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={`h-row border-b border-seil-line px-3 py-2 align-middle ${
        numeric ? "text-right whitespace-nowrap" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </td>
  );
}
