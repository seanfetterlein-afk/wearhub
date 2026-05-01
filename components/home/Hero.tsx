"use client";

import { useState } from "react";
import Link from "next/link";

const PANELS = [
  {
    image: "/favorites.jpg",
    label: "Shop Favorites",
    href:  "/shop?sort=popular",
  },
  {
    image: "/streetwear.png",
    label: "Streetwear Favorites",
    href:  "/shop?tag=streetwear",
  },
  {
    image: "/Supreme.jpg",
    label: "Shop Supreme",
    href:  "/shop?brand=Supreme",
  },
  {
    image: "/sneakers.jpg",
    label: "Shop Sneakers",
    href:  "/shop?category=Sneakers",
  },
];

export function Hero() {
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section className="w-full bg-white px-6 pt-4 pb-6">
      {/* 3-column panel grid — swipeable on mobile */}
      <div className="flex sm:grid sm:grid-cols-4 gap-2 max-w-6xl mx-auto overflow-x-auto snap-x snap-mandatory sm:overflow-x-visible pb-2 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {PANELS.map(({ image, label, href }) => (
          <Link
            key={label}
            href={href}
            className="relative aspect-[3/4] overflow-hidden group shrink-0 w-[80vw] sm:w-auto snap-center block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={label}
              className="w-full h-full object-cover grayscale transition-all duration-500 ease-out group-hover:grayscale-0 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors duration-300" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="shop-button border border-white/80 text-white text-[10px] tracking-[0.25em] uppercase px-6 py-3 font-body">
                {label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Editorial headline */}
      <div className="text-center mt-14 max-w-4xl mx-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/headline.png"
          alt="Not New Just Next"
          className="w-full max-w-4xl mx-auto mb-6"
        />
        <p className="text-xs text-black leading-relaxed max-w-md mx-auto" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          WearHub er født i København med en forkærlighed for æstetik, kvalitet og det enkle.
          <br /><br />
          Vi skaber et rum, hvor tøj får nyt liv — og hvor gode pieces ikke går til spilde, men videre til den næste.
          <br /><br />
          Det handler ikke om mængde, men om valg.<br />
          Ikke om trends, men om stil.
          <br /><br />
          Vi bygger ikke bare en platform — vi bygger en relation til dem, der bruger den. Med fokus på oplevelse, tillid og en ny måde at tænke garderobe på.
        </p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/nyhedsbrev.png"
        alt="Nyhedsbrev"
        className="w-full mt-10"
      />

      {/* Newsletter signup */}
      <div className="flex flex-col items-center mt-1 mb-2">
        <button
          onClick={() => setShowNewsletter((v) => !v)}
          className="bg-black text-white font-mono text-[11px] tracking-[0.2em] uppercase px-10 py-4 hover:bg-neutral-800 transition-colors"
        >
          NYHEDSBREV
        </button>

        {showNewsletter && (
          <div className="mt-4 w-full max-w-md">
            {submitted ? (
              <p className="text-center font-mono text-[11px] tracking-widest text-black uppercase py-4">
                ✓ Du er tilmeldt — tak!
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <p className="text-center text-xs text-black/60" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                  Tilmeld dig og få nyheder, drops og eksklusive tilbud direkte i din indbakke.
                </p>
                <div className="flex gap-0">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@email.dk"
                    required
                    className="flex-1 h-11 px-4 border border-black font-mono text-xs text-black bg-white outline-none placeholder:text-black/30"
                  />
                  <button
                    type="submit"
                    className="h-11 px-6 bg-black text-white font-mono text-[10px] tracking-widest uppercase hover:bg-neutral-800 transition-colors shrink-0"
                  >
                    TILMELD
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
