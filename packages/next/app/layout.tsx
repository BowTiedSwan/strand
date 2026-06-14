import type { Metadata } from "next";
import { Fraunces, Newsreader, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { site } from "@/lib/wisp";
import Analytics from "@/components/Analytics";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces",
});
const body = Newsreader({ subsets: ["latin"], variable: "--font-newsreader" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.locale} className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <div className="shell">
          <header className="masthead">
            <Link href="/" className="masthead__brand" aria-label={`${site.name} home`}>
              <span className="masthead__mark" aria-hidden />
              {site.name}
            </Link>
            <nav className="masthead__nav" aria-label="Sections">
              <Link href="/">Latest</Link>
              <a href="/feed.xml">RSS</a>
              <a href="/llms.txt">llms.txt</a>
            </nav>
          </header>

          {children}

          <footer className="footer">
            <span>{site.name} — published with Wisp</span>
            <span>MDX in Git · SEO + AI-search built in</span>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
