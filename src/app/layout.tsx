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
  metadataBase: new URL("https://medistry.in"),
  alternates: { canonical: "/" },
  title: "Medistry | Doctor-led care for weight and blood sugar",
  description:
    "A doctor-led programme for obesity and type 2 diabetes in India. A free check, a free first consultation, blood tests at home, nutrition built on Indian food, and a care team that follows your progress every week.",
  openGraph: {
    title: "Medistry | Doctor-led care for weight and blood sugar",
    description:
      "A doctor-led programme for obesity and type 2 diabetes. Consultation, tests, nutrition and follow-up in one plan.",
    locale: "en_IN",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  // iOS Safari draws edge to edge; opting in makes env(safe-area-inset-*) real,
  // so the floating nav and action dock can keep clear of the system UI
  viewportFit: "cover",
  themeColor: "#0B1F22",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head>
        {/* Reveal states must exist before first paint, or content flashes and then hides. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
