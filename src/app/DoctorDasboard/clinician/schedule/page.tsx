"use client";

import ClinicShell from "../../components/clinician/ClinicShell";
import Schedule from "../../components/clinician/Schedule";

export default function SchedulePage() {
  return <ClinicShell section="schedule">{() => <Schedule />}</ClinicShell>;
}
