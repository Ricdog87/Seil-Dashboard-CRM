import { redirect } from "next/navigation";

/** Aus „Investoren“ ist „Kunden“ geworden – alte Verweise sollen trotzdem ankommen. */
export default function InvestorenSeite() {
  redirect("/kunden");
}
