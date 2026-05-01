import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="bg-paper text-ink min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center font-body">
      <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase">404</p>
      <h1
        className="font-display font-semibold text-brown"
        style={{ fontSize: "clamp(60px, 10vw, 120px)", letterSpacing: "-0.04em", lineHeight: 0.9 }}
      >
        IKKE<br />FUNDET.
      </h1>
      <p className="text-ink-mid max-w-sm">
        Siden eller produktet du leder efter eksisterer ikke.
      </p>
      <Button size="lg" asChild>
        <Link href="/">GÅ TIL FORSIDEN</Link>
      </Button>
    </div>
  );
}
