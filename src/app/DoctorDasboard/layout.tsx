import type { Metadata, Viewport } from "next";
import { Jost, Wix_Madefor_Text } from "next/font/google";
import "./globals.css";

/* Jost is the brand face: the wordmark is outlined from Jost Medium (brand kit). */
const display = Jost({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
});

const text = Wix_Madefor_Text({
  variable: "--font-text",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
});

export const metadata: Metadata = {
  title: "Medistry clinician portal (prototype)",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#0B1F22",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
