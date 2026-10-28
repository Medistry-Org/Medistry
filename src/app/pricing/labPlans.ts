/**
 * The two plans for people without a recent report, exactly as the founders wrote them (names,
 * badges, prices in rupees, features). The checkout takes the plan id; the backend prices it
 * (docs/backend/lab-tests-redcliffe.md, "Lab plans from /pricing").
 */

export type LabPlan = {
  id: string;
  name: string;
  type: "lab_only" | "combo";
  badge: string;
  price: number;
  features: string[];
  recommended: boolean;
};

export const NO_REPORT_PLANS: LabPlan[] = [
  {
    id: "plan-lab-basic",
    name: "Essential Diagnostic Lab Test",
    type: "lab_only",
    badge: "Lab Test Only",
    price: 999,
    features: [
      "Home Sample Collection Phlebotomist",
      "CBC, Blood Sugar & Lipid Profile",
      "Smart WhatsApp Report in 5 Hours",
      "NABL Certified Quality Check",
    ],
    recommended: false,
  },
  {
    id: "plan-lab-doctor-combo",
    name: "Full Body Checkup + Doctor Combo",
    type: "combo",
    badge: "Best Value",
    price: 1799,
    features: [
      "Free Home Sample Collection",
      "Full Body Screening (60+ Parameters)",
      "WhatsApp Delivery in 5 Hours",
      "Senior MD Doctor Consultation Included",
      "Digital Prescription & Diet Chart",
    ],
    recommended: true,
  },
];
