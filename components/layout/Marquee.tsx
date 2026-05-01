const TICKERS = [
  "NEW DROPS DAILY",
  "SHIPPED FROM DK",
  "VERIFIED SELLERS",
  "AUTH BY WEARHUB",
  "PEER-TO-PEER",
  "NEW DROPS DAILY",
  "SHIPPED FROM DK",
  "VERIFIED SELLERS",
  "AUTH BY WEARHUB",
  "PEER-TO-PEER",
];

export function Marquee() {
  return (
    <div className="bg-brown text-cream border-b border-brown-deep py-2 overflow-hidden">
      <div className="marquee-track flex gap-10 whitespace-nowrap w-max">
        {TICKERS.map((text, i) => (
          <span
            key={i}
            className="font-mono text-[11px] tracking-widest font-medium"
          >
            ▲ {text}
          </span>
        ))}
      </div>
    </div>
  );
}
