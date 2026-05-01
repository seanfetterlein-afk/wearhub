"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, X, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { createListing, uploadProductImage } from "@/lib/actions/products";
import type { Category, Condition } from "@/types";

const CATEGORIES: Category[] = [
  "Sneakers", "Outerwear", "Hoodies", "T-Shirts", "Bukser", "Accessories", "Caps", "Tasker",
];

const CONDITIONS: { value: Condition; label: string; desc: string }[] = [
  { value: "NY",     label: "NY",     desc: "Med tags, aldrig brugt" },
  { value: "SOM NY", label: "SOM NY", desc: "Brugt 1–2 gange, ingen fejl" },
  { value: "GOD",    label: "GOD",    desc: "Normale brugsscatter" },
  { value: "BRUGT",  label: "BRUGT",  desc: "Synlige tegn på brug" },
];

const BRANDS = [
  "Nike", "Adidas", "Jordan", "Supreme", "Stone Island", "Carhartt", "Stüssy",
  "New Balance", "ASICS", "Converse", "Vans", "Puma", "Reebok", "Off-White",
  "Balenciaga", "Palace", "The North Face", "Arc'teryx", "Levi's",
  "Ralph Lauren", "Tommy Hilfiger", "Calvin Klein", "Represent",
  "Essentials", "Fear of God", "BAPE", "Kith", "A-COLD-WALL*",
];

async function compressImage(blob: Blob, maxPx = 1500): Promise<File> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) =>
    canvas.toBlob(
      (b) => resolve(new File([b!], "product.webp", { type: "image/webp" })),
      "image/webp",
      0.88,
    ),
  );
}

const inputCls =
  "w-full h-11 px-3.5 border border-black/20 bg-transparent font-body text-sm text-black placeholder:text-[#AAAAAA] outline-none focus:border-black/50 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] tracking-widest text-[#AAAAAA] uppercase">{label}</label>
      {children}
    </div>
  );
}

export default function SellPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [condition, setCondition] = useState<Condition | "">("");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [description, setDescription] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [removingBg, setRemovingBg] = useState<Set<number>>(new Set());

  const handleRemoveBg = async (i: number) => {
    setRemovingBg((prev) => new Set([...prev, i]));
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(images[i]);
      const file = await compressImage(blob);
      const preview = URL.createObjectURL(file);
      setImages((prev) => prev.map((f, idx) => (idx === i ? file : f)));
      setPreviews((prev) => prev.map((p, idx) => (idx === i ? preview : p)));
    } catch (err) {
      console.error("Baggrundsfejernelse fejlede:", err);
    } finally {
      setRemovingBg((prev) => {
        const next = new Set(prev);
        next.delete(i);
        return next;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    const combined = [...images, ...incoming].slice(0, 4);
    setImages(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
    e.target.value = "";
  };

  const removeImage = (i: number) => {
    const imgs = images.filter((_, idx) => idx !== i);
    const prevs = previews.filter((_, idx) => idx !== i);
    setImages(imgs);
    setPreviews(prevs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Skriv en titel."); return; }
    if (!brand.trim()) { setError("Skriv et mærke."); return; }
    if (!category)     { setError("Vælg en kategori."); return; }
    if (!condition)    { setError("Vælg stand på varen."); return; }
    if (!size.trim())  { setError("Skriv en størrelse."); return; }
    if (!price)        { setError("Skriv en pris."); return; }

    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("brand", brand.trim());
    fd.set("category", category);
    fd.set("condition", condition);
    fd.set("size", size.trim());
    fd.set("price", price);
    if (retailPrice) fd.set("originalRetailPrice", retailPrice);
    if (description.trim()) fd.set("description", description.trim());

    startTransition(async () => {
      const result = await createListing({}, fd);
      if (result.error) { setError(result.error); return; }

      if (images.length > 0 && result.productId) {
        for (let i = 0; i < images.length; i++) {
          const r = await uploadProductImage(result.productId, images[i], i);
          if (r.error) console.error("Image upload:", r.error);
        }
      }

      router.push("/profile");
    });
  };

  const priceNum = parseInt(price) || 0;
  const payout = priceNum > 0 ? Math.round(priceNum * 0.94) : 0;

  return (
    <PageShell noFooter>
      <form onSubmit={handleSubmit}>
        <div className="max-w-[540px] mx-auto px-4 pb-32">

          {/* Header */}
          <div className="flex items-center gap-3 py-5 border-b border-black/10 mb-7">
            <Link href="/" className="text-[#AAAAAA] hover:text-black transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <h1
              className="font-display font-semibold text-black text-xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Opret annonce
            </h1>
          </div>

          <div className="space-y-7">

            {/* Billeder */}
            <div>
              <label className="block font-mono text-[10px] tracking-widest text-[#AAAAAA] uppercase mb-3">
                Billeder{" "}
                <span className="normal-case text-black/30 tracking-normal">(op til 4)</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square border border-black/10 bg-[#F5F5F5]">
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ background: "repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%) 0 0 / 8px 8px" }}
                    />

                    {/* Remove image */}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black flex items-center justify-center z-10"
                    >
                      <X size={9} className="text-white" />
                    </button>

                    {/* AI baggrundsfejernelse */}
                    <button
                      type="button"
                      onClick={() => handleRemoveBg(i)}
                      disabled={removingBg.has(i)}
                      title="Fjern baggrund med AI"
                      className="absolute top-1 left-1 w-5 h-5 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 shadow-sm disabled:opacity-60"
                    >
                      {removingBg.has(i)
                        ? <Loader2 size={9} className="text-black animate-spin" />
                        : <Sparkles size={9} className="text-black" />
                      }
                    </button>

                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white font-mono text-[7px] tracking-wider text-center py-0.5">
                        FORSIDE
                      </div>
                    )}
                  </div>
                ))}
                {images.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border border-dashed border-black/25 flex flex-col items-center justify-center gap-1.5 hover:border-black/50 hover:bg-[#FAFAFA] transition-colors"
                  >
                    <Camera size={18} className="text-[#AAAAAA]" />
                    <span className="font-mono text-[8px] tracking-wider text-[#AAAAAA]">
                      TILFØJ
                    </span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              {previews.length > 0 && (
                <p className="flex items-center gap-1.5 mt-2 font-mono text-[9px] tracking-wider text-[#AAAAAA]">
                  <Sparkles size={9} />
                  Tryk på ✦ på et billede for at fjerne baggrunden med AI (valgfrit)
                </p>
              )}
            </div>

            {/* Titel */}
            <Field label="Titel *">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="f.eks. Nike Air Max 90 OG"
                className={inputCls}
              />
            </Field>

            {/* Mærke */}
            <Field label="Mærke *">
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                placeholder="f.eks. Nike"
                list="brands-list"
                className={inputCls}
              />
              <datalist id="brands-list">
                {BRANDS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </Field>

            {/* Kategori */}
            <div>
              <label className="block font-mono text-[10px] tracking-widest text-[#AAAAAA] uppercase mb-3">
                Kategori *
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2.5 border font-mono text-[9px] tracking-wider uppercase transition-colors ${
                      category === cat
                        ? "bg-black text-white border-black"
                        : "bg-white text-[#AAAAAA] border-black/15 hover:border-black/50 hover:text-black"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Stand */}
            <div>
              <label className="block font-mono text-[10px] tracking-widest text-[#AAAAAA] uppercase mb-3">
                Stand *
              </label>
              <div className="space-y-1.5">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCondition(c.value)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 border transition-colors ${
                      condition === c.value
                        ? "bg-black border-black"
                        : "border-black/15 hover:border-black/40"
                    }`}
                  >
                    <span
                      className={`font-mono text-[11px] tracking-widest ${
                        condition === c.value ? "text-white" : "text-black"
                      }`}
                    >
                      {c.label}
                    </span>
                    <span
                      className={`text-xs font-body ${
                        condition === c.value ? "text-white/65" : "text-[#AAAAAA]"
                      }`}
                    >
                      {c.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Størrelse */}
            <Field label="Størrelse *">
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                required
                placeholder="f.eks. 42 / M / One Size"
                className={inputCls}
              />
            </Field>

            {/* Pris */}
            <div className="space-y-4">
              <Field label="Pris *">
                <div className="relative">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="1"
                    placeholder="0"
                    className={`${inputCls} pr-12`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[11px] text-[#AAAAAA]">
                    KR
                  </span>
                </div>
                {payout > 0 && (
                  <p className="font-mono text-[10px] tracking-wider text-[#AAAAAA] mt-1.5">
                    Du modtager{" "}
                    <span className="text-black">{payout} kr</span> efter 6%
                    WearHub-gebyr
                  </p>
                )}
              </Field>

              <Field label="Vejl. nypris (valgfri)">
                <div className="relative">
                  <input
                    type="number"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    min="1"
                    placeholder="0"
                    className={`${inputCls} pr-12`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[11px] text-[#AAAAAA]">
                    KR
                  </span>
                </div>
              </Field>
            </div>

            {/* Beskrivelse */}
            <Field label="Beskrivelse (valgfri)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fortæl lidt om varen..."
                rows={4}
                className={`${inputCls} h-auto py-3 resize-none`}
              />
            </Field>

            {error && (
              <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Fixed submit bar — sits above the BottomNav (64px) */}
        <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-black/10 z-40">
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-black text-white font-mono text-[11px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-black/80 transition-colors disabled:opacity-40"
          >
            {isPending ? "OPRETTER..." : "OPRET ANNONCE →"}
          </button>
        </div>
      </form>
    </PageShell>
  );
}
