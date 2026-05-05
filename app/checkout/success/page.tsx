import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = { title: "Betaling gennemført" };

export default function CheckoutSuccessPage() {
  return (
    <PageShell>
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-6" strokeWidth={1.5} />

        <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase mb-2">
          BETALING GENNEMFØRT
        </p>
        <h1
          className="font-display font-semibold text-brown leading-none mb-4"
          style={{ fontSize: "clamp(32px, 5vw, 48px)", letterSpacing: "-0.03em" }}
        >
          TAK FOR DIT KØB
        </h1>
        <p className="text-ink-mid text-sm leading-relaxed mb-8">
          Sælgeren er notificeret og vil sende varen snarest.
          Pengene frigives til sælger, når du bekræfter at have modtaget varen.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full h-12 bg-black text-white font-mono text-[11px] tracking-widest uppercase flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            SE MINE ORDRER
          </Link>
          <Link
            href="/"
            className="w-full h-12 border border-brown/20 font-mono text-[11px] tracking-widest text-ink-mid uppercase flex items-center justify-center hover:border-brown hover:text-brown transition-colors"
          >
            FORTSÆT SHOPPING
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
