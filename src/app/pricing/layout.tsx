import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppTheme from "@/components/ui/AppTheme";

/**
 * /pricing stays at this URL (the landing page links to it) and is drawn in the app's design, so it
 * wears the dashboard tokens without the patient shell.
 */

export const metadata: Metadata = {
  title: "Consultation & Diagnostics | Medistry",
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return <AppTheme>{children}</AppTheme>;
}
