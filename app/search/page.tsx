import Link from "next/link";
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
  return (
    <PageShell noFooter>
      <div className="px-4 pt-4 pb-24 flex flex-col gap-6">
        {/* Categories */}
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(({ label, href, image }) => (
            <Link
              key={label}
              href={href}
              className="relative bg-[#F2F2F2] rounded-xl h-28 overflow-hidden block select-none active:scale-[0.97] active:opacity-80 transition-[transform,opacity] duration-[80ms]"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={label} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30" />
              <span className="absolute inset-0 flex items-center justify-center font-body font-medium text-white text-[15px]">{label}</span>
            </Link>
          ))}
        </div>


        {/* Collections — swipeable panels, same as homepage */}
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4">
          {COLLECTIONS.map(({ label, href, image }) => (
            <Link
              key={label}
              href={href}
              className="relative aspect-[3/4] overflow-hidden group shrink-0 w-[70vw] snap-center block select-none"
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
                <span className="border border-white/80 text-white text-[10px] tracking-[0.25em] uppercase px-6 py-3 font-body">
                  {label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
