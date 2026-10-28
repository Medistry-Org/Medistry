/*
  The patient dashboard layout: every /dashboard page renders inside PatientShell, which checks the
  session, applies the design tokens and draws the bar, the sections and the toast. Pages set their
  own titles; this one keeps the whole dashboard out of search engines.
*/

import type { Metadata } from "next";
import type { ReactNode } from "react";
import PatientShell from "./components/PatientShell";

export const metadata: Metadata = {
  title: "Your account | Medistry",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <PatientShell>{children}</PatientShell>;
}
