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
  return (
    <section className="w-full bg-white px-6 pt-4 pb-6">
      {/* 3-column panel grid — swipeable on mobile */}
      <div className="flex sm:grid sm:grid-cols-4 gap-2 max-w-6xl mx-auto overflow-x-auto snap-x snap-mandatory sm:overflow-x-visible pb-2 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {PANELS.map(({ image, label, href }) => (
          <Link
            key={label}
            href={href}
            className="relative aspect-[3/4] overflow-hidden group shrink-0 w-[80vw] sm:w-auto snap-center block select-none active:opacity-80 transition-opacity duration-[80ms]"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={label}
              className="w-full h-full object-cover grayscale transition-all duration-150 ease-out group-hover:grayscale-0 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors duration-150" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="shop-button border border-white/80 text-white text-[10px] tracking-[0.25em] uppercase px-6 py-3 font-body">
                {label}
              </span>
            </div>
          </Link>
        ))}
      </div>

    </section>
  );
}
