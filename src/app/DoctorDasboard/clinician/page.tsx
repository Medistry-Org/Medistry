import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClinicApp from "../components/clinician/ClinicApp";
import { ACCOUNT_PREVIEW } from "../components/account/config";

export const metadata: Metadata = {
  title: "Today | Medistry clinician",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function Page() {
  if (!ACCOUNT_PREVIEW) notFound();
  return <ClinicApp section="today" />;
}
