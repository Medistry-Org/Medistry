/**
 * Applies the dashboards' design tokens and base styles (styles/appTheme.css) to everything inside
 * it. Every signed-in area's layout wraps its content in this; the landing page does not.
 */

import type { ReactNode } from "react";
import "./styles/appTheme.css";

export default function AppTheme({ children }: { children: ReactNode }) {
  return <div className="app-theme">{children}</div>;
}
