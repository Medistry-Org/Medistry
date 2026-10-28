/** "Dr. Menon": a doctor's short name for buttons and sheet titles, held together on one line. */
export default function formalDoctorName(fullName: string) {
  return `Dr. ${fullName.split(" ").at(-1)}`;
}
