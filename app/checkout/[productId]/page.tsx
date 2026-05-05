import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Marquee } from "@/components/layout/Marquee";
import { Navbar } from "@/components/layout/Navbar";
import { createClient, getUser } from "@/lib/supabase/server";
import { isSupabaseConfigured, storageUrl } from "@/lib/supabase/helpers";
import { formatPrice } from "@/lib/utils";
import { CheckoutForm } from "./CheckoutForm";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const { productId } = await params;

  if (!isSupabaseConfigured()) redirect(`/item/${productId}`);

  const user = await getUser();
  if (!user) redirect(`/login?redirect=/checkout/${productId}`);

  const supabase = await createClient();

  const { data: product } = await (supabase.from("products") as any)
    .select("id, title, brand, price, size, condition, seller_id, status, product_images(storage_path, position)")
    .eq("id", productId)
    .single();

  if (!product || product.status !== "active") notFound();
  if (product.seller_id === user.id) redirect(`/item/${productId}`);

  const images = (product.product_images ?? []).sort(
    (a: any, b: any) => a.position - b.position,
  );
  const imageUrl = storageUrl(images[0]?.storage_path ?? null);

  // Pre-fill name from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, city")
    .eq("id", user.id)
    .single();

  return (
    <div className="bg-paper min-h-screen flex flex-col font-body">
      <Marquee />
      <Navbar />

      <div className="flex-1 max-w-[640px] w-full mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/item/${productId}`} className="text-ink-dim hover:text-ink transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-dim">
            CHECKOUT
          </p>
        </div>

        {/* Product summary */}
        <div className="flex gap-4 p-4 border border-brown/15 bg-cream/50 mb-6">
          <div className="w-16 h-20 bg-cream-deep border border-brown/10 shrink-0 overflow-hidden">
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={product.title} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">{product.brand}</p>
            <p className="font-body text-sm font-medium text-ink mt-0.5 truncate">{product.title}</p>
            <p className="font-mono text-[10px] text-ink-dim mt-1">{product.size} · {product.condition}</p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className="font-display font-semibold text-brown"
              style={{ fontSize: 18, letterSpacing: "-0.01em" }}
            >
              {formatPrice(product.price)}
            </p>
          </div>
        </div>

        <CheckoutForm
          product={{ id: productId, price: product.price, brand: product.brand, title: product.title }}
          defaultName={(profile as any)?.display_name ?? ""}
          defaultCity={(profile as any)?.city ?? ""}
        />
      </div>
    </div>
  );
}
