import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  noFooter?: boolean;
  className?: string;
}

export function PageShell({ children, noFooter = false, className }: PageShellProps) {
  return (
    <div className={cn("bg-paper text-ink min-h-screen font-body flex flex-col", className)}>
      <Navbar />
      <main className="flex-1 pb-20">{children}</main>
      {!noFooter && <Footer />}
      <BottomNav />
    </div>
  );
}
