import { FreigabenEingang } from "@/components/freigaben-eingang";

export default function FreigabenSeite() {
  return (
    <>
      <div className="mb-5">
        <h1 className="text-title text-seil-text">Freigaben</h1>
        <p className="mt-1 text-body text-seil-body">
          Hier liegen die Anschreiben, die die Automatik entworfen hat. Keines davon geht raus,
          bevor es hier freigegeben ist.
        </p>
      </div>
      <FreigabenEingang />
    </>
  );
}
