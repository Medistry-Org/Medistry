/**
 * /pricing stays at this URL (the landing page links to it) and is drawn in the app's design, so it
 * wears the dashboard tokens without the patient shell. The title is set by page.tsx.
 */

import type { ReactNode } from "react";
import AppTheme from "@/components/ui/AppTheme";

export default function PricingLayout({ children }: { children: ReactNode }) {
  return <AppTheme>{children}</AppTheme>;
}
