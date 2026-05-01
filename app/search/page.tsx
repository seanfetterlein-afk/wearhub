"use client";

import { useRouter } from "next/navigation";
import { PageShell } from "@/components/ui/PageShell";

const CATEGORIES = [
  { label: "T-Shirts",  href: "/shop?category=T-Shirts", image: "/cat-tshirt.png" },
  { label: "Hoodies",   href: "/shop?category=Hoodies",  image: "/hoodies.png" },
  { label: "Bukser",    href: "/shop?category=Bukser",   image: "/pants.png" },
  { label: "Sneakers",  href: "/shop?category=Sneakers", image: "/sneakers.jpg" },
  { label: "Tasker",    href: "/shop?category=Tasker",   image: "/bags.png" },
  { label: "Caps",      href: "/shop?category=Caps",     image: "/caps.png" },
];

const COLLECTIONS = [
  { label: "Shop Favorites",  href: "/shop?sort=popular",      image: "/favorites.jpg" },
  { label: "Shop Streetwear", href: "/shop?tag=streetwear",    image: "/streetwear.png" },
  { label: "Shop Supreme",    href: "/shop?brand=Supreme",     image: "/Supreme.jpg" },
  { label: "Shop Sneakers",   href: "/shop?category=Sneakers", image: "/sneakers.jpg" },
];

export default function SearchPage() {
  const router = useRouter();

  return (
    <PageShell noFooter>
      <div className="px-4 pt-4 pb-24 flex flex-col gap-6">
        {/* Categories */}
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(({ label, href, image }) => (
            <button
              key={label}
              onClick={() => router.push(href)}
              className="relative bg-[#F2F2F2] rounded-xl h-28 overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={label} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30" />
              <span className="absolute inset-0 flex items-center justify-center font-body font-medium text-white text-[15px]">{label}</span>
            </button>
          ))}
        </div>

        {/* Graffiti image divider */}
        <div className="mt-10 mb-2">
          <div className="w-full overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/graffiti.png" alt="WearHub graffiti" className="w-full object-cover" />
          </div>
          <p className="mt-2 mb-8 text-[7px] font-mono tracking-wider text-ink-dim" style={{ textAlign: "left", marginLeft: 0, paddingLeft: 0 }}>
            Grafitti af WearHub Logo i Bristol, England.
          </p>
        </div>

        {/* Collections — swipeable panels, same as homepage */}
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4">
          {COLLECTIONS.map(({ label, href, image }) => (
            <div
              key={label}
              onClick={() => router.push(href)}
              className="relative aspect-[3/4] overflow-hidden group cursor-pointer shrink-0 w-[70vw] snap-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={label}
                className="w-full h-full object-cover grayscale transition-all duration-500 ease-out group-hover:grayscale-0 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="border border-white/80 text-white text-[10px] tracking-[0.25em] uppercase px-6 py-3 font-body">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
