/** A doctor's one-line summary under the name: "Endocrinology, 12 years, ₹500 consultation". */

import { formatRupees } from "@/lib/format/money";
import type { DoctorSummary } from "@/types/doctor";

export default function doctorLine(doctor: DoctorSummary) {
  return [doctor.specialization, doctor.experience, doctor.consultationFee ? `${formatRupees(doctor.consultationFee)} consultation` : ""].filter(Boolean).join(", ");
}
