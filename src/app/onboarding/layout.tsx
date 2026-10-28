/** Onboarding has no shell of its own; it only needs the dashboards' design tokens. */

import type { ReactNode } from "react";
import AppTheme from "@/components/ui/AppTheme";

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppTheme>{children}</AppTheme>;
}
