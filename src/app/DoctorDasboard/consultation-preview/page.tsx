import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ConsultationDemo from "@/components/consultation/ConsultationDemo";
import { ACCOUNT_PREVIEW } from "@/components/account/config";
import type { ScenarioKey } from "@/components/consultation/data";

export const metadata: Metadata = {
  title: "Consultation prototype | Medistry",
  description: "A fictional, interactive Medistry consultation design prototype.",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

/* the account and clinician prototypes open the call for the right sample patient */
const BY_PATIENT: Record<string, ScenarioKey> = { p_aanya: "weight", p_ritu: "diabetes", p_meera: "first" };

export default async function ConsultationPreviewPage({ searchParams }: { searchParams: Promise<{ patient?: string; as?: string }> }) {
  // The public website is not the authenticated app. It shows wherever the account prototype does,
  // or when a preview deployment opts in; ordinary production builds never expose it.
  if (!ACCOUNT_PREVIEW && process.env.NODE_ENV === "production" && process.env.ENABLE_CONSULTATION_DEMO !== "true") notFound();
  const { patient, as } = await searchParams;
  return <ConsultationDemo key={patient ?? "weight"} initial={BY_PATIENT[patient ?? ""] ?? "weight"} as={as === "doctor" ? "doctor" : "patient"} />;
}
