import type { ReactNode } from "react";
import "./styles/appTheme.css";

/**
 * Applies the dashboards' design tokens and base styles to everything inside it. Wrap every
 * signed-in area's layout in this (the landing page does not use it).
 */
export default function AppTheme({ children }: { children: ReactNode }) {
  return <div className="app-theme">{children}</div>;
}
