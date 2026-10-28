/** /pricing: consultation and diagnostics, linked from the landing page. Sets the title; the screen is PricingView. */

import type { Metadata } from "next";
import PricingView from "./components/PricingView";

export const metadata: Metadata = {
  title: "Consultation & Diagnostics | Medistry",
};

export default function PricingPage() {
  return <PricingView />;
}
