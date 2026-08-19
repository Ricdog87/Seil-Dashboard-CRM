"use client";

import { useRouter } from "next/navigation";
import { TR } from "@/components/ui";

/**
 * Tabellenzeile, die als Ganzes navigiert – Klicks auf innere Links
 * bleiben davon unberührt.
 */
export function KlickZeile({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <TR
      interactive
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) return;
        router.push(href);
      }}
    >
      {children}
    </TR>
  );
}
