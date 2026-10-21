import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClinicApp from "../../../components/clinician/ClinicApp";
import { ACCOUNT_PREVIEW } from "../../../components/account/config";

export const metadata: Metadata = {
  title: "Patient record | Medistry clinician",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!ACCOUNT_PREVIEW) notFound();
  const { id } = await params;
  return <ClinicApp section="patients" id={id} />;
}
