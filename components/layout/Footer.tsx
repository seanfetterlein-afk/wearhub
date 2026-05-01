import Link from "next/link";

const FOOTER_COLS = [
  {
    heading: "SHOP",
    links: [
      { label: "Drops",      href: "/shop?filter=drop" },
      { label: "Sneakers",   href: "/shop?category=sneakers" },
      { label: "Outerwear",  href: "/shop?category=outerwear" },
      { label: "Alle items", href: "/shop" },
    ],
  },
  {
    heading: "SÆLGERE",
    links: [
      { label: "List item",        href: "/sell" },
      { label: "Autentificering",  href: "/sell#authentication" },
      { label: "Forsendelse",      href: "/sell#shipping" },
      { label: "Support",          href: "/support" },
    ],
  },
  {
    heading: "JURA",
    links: [
      { label: "Vilkår",      href: "/terms" },
      { label: "Privatliv",   href: "/privacy" },
      { label: "Returpolitik", href: "/returns" },
      { label: "Kontakt",     href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-brown text-cream mt-0">
      <div className="max-w-[1400px] mx-auto px-6 pt-16 pb-6">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-12">
          {/* Brand blurb */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="WearHub" className="h-32 w-auto" />
            <p className="text-[13px] opacity-70 mt-4 max-w-xs leading-relaxed">
              Danmarks C2C marketplace for streetwear.
              <br />
              Køb. Sælg. Flex.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map(({ heading, links }) => (
            <div key={heading}>
              <h4 className="font-mono text-2xs tracking-widest opacity-50 mb-4 font-semibold uppercase">
                {heading}
              </h4>
              <ul className="flex flex-col gap-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[13px] opacity-80 hover:opacity-100 transition-opacity"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-cream/10 flex flex-col sm:flex-row justify-between gap-2 font-mono text-2xs tracking-widest opacity-50">
          <span>© 2026 WEARHUB · KØBENHAVN</span>
          <span>VOL.001 · VINTER</span>
        </div>
      </div>
    </footer>
  );
}
