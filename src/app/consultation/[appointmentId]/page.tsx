/** The video consultation for one appointment. The room is a client component; this page reads the id. */

import ConsultationRoom from "./components/ConsultationRoom";

export default async function ConsultationPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  return <ConsultationRoom appointmentId={appointmentId} />;
}
