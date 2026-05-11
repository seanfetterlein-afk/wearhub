import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Cormorant, Bebas_Neue } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const cormorant = Cormorant({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  weight: "400",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: {
    default: "Nord Studios — Danmarks streetwear marketplace",
    template: "%s | Nord Studios",
  },
  description:
    "Danmarks C2C marketplace for streetwear. Køb, sælg og flex hypede drops, arkiv-gems og grails — handlet peer-to-peer.",
  keywords: ["streetwear", "marketplace", "sneakers", "danmark", "resell"],
  openGraph: {
    title: "Nord Studios — Danmarks streetwear marketplace",
    description: "Køb. Sælg. Flex.",
    locale: "da_DK",
    type: "website",
  },
  // Lock iOS status bar to white so it never tries to sync with the black splash layer
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="da"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${cormorant.variable} ${bebasNeue.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
