import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const STEPS = [
  { num: "01", title: "List den",     desc: "Upload fotos, sæt pris" },
  { num: "02", title: "Send den",     desc: "Vi sender labels" },
  { num: "03", title: "Få pengene",   desc: "Direkte til din konto" },
  { num: "04", title: "Gentag",       desc: "Drop igen" },
];

export function Editorial() {
  return (
    <section className="bg-brown text-cream py-20">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div>
            <p className="font-mono text-[10px] tracking-editorial opacity-60 mb-4 uppercase">
              EDITORIAL / 02
            </p>
            <h2
              className="font-display font-medium leading-[0.95]"
              style={{
                fontSize: "clamp(40px, 6vw, 80px)",
                letterSpacing: "-0.03em",
              }}
            >
              Dit skab.<br />
              <em className="not-italic font-normal italic opacity-70">
                Deres næste fit.
              </em>
            </h2>
            <p className="mt-6 opacity-75 text-[15px] leading-relaxed max-w-[440px]">
              Ingen shipping-scam. Ingen fake. WearHub verificerer hver seller
              og hver transaktion.
            </p>
            <div className="mt-8">
              <Button variant="inverse" size="lg" asChild>
                <Link href="/sell">
                  BEGYND AT SÆLGE <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right — how-it-works grid */}
          <div className="grid grid-cols-2 gap-3">
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} className="border border-cream/20 p-6">
                <p className="font-mono text-[11px] opacity-50 tracking-widest">
                  {num}
                </p>
                <p
                  className="font-display font-semibold mt-1.5"
                  style={{ fontSize: 22, letterSpacing: "-0.02em" }}
                >
                  {title}
                </p>
                <p className="text-[12px] opacity-60 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
