import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Libre_Baskerville, Nunito, Nunito_Sans } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site";
import "./globals.css";

// The three faces nirva.life uses (measured), all OFL on Google Fonts.
const serif = Libre_Baskerville({ variable: "--font-serif-face", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const sans = Nunito_Sans({ variable: "--font-sans-face", subsets: ["latin"], weight: ["400", "600", "700"] });
const label = Nunito({ variable: "--font-label-face", subsets: ["latin"], weight: ["700"] });

export const metadata: Metadata = {
  title: { default: "Tonight, Rendered: a generative UI concept", template: "%s · Tonight, Rendered" },
  description:
    "An unofficial concept by Hafsa Usmani: an evening reflection for an AI wearable, built as generative UI, with every card also rendered in SwiftUI. Fictional person, mock data. Not affiliated with Nirva Labs.",
  // A concept for a few readers, about someone else's product. Keep it out of search.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#D4E2E8", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${label.variable} antialiased`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-surface focus:px-3 focus:py-2">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
