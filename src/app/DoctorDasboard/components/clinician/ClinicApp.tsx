"use client";

import Link from "next/link";
import ClinicShell, { type Section } from "./ClinicShell";
import Today from "./Today";
import Schedule from "./Schedule";
import Patients from "./Patients";
import PatientRecord from "./PatientRecord";
import Messages from "./Messages";
import { NoteReview, NotesList } from "./Notes";
import { diary, findPatient } from "./data";
import c from "./Clinic.module.css";

export default function ClinicApp({
  section,
  id,
  noteId,
}: {
  section: Section;
  id?: string;
  noteId?: string;
}) {
  return (
    <ClinicShell section={section} bare={!!noteId}>
      {(patients) => {
        if (id) {
          const p = findPatient(patients, id);
          return p ? (
            <PatientRecord
              p={p}
              next={
                [...diary(patients), ...diary(patients, 1)].find(
                  (a) =>
                    a.patient_id === p.id &&
                    (a.status === "BOOKED" || a.status === "IN_PROGRESS"),
                )?.at ?? null
              }
            />
          ) : (
            <main className={c.page}>
              <h1 className={c.h1}>Patient not found</h1>
              <p className={c.sub}>
                The record may belong to another doctor.{" "}
                <Link href="DoctorDasboard/clinician/patients">
                  Back to your patients
                </Link>
              </p>
            </main>
          );
        }
        if (section === "schedule") return <Schedule patients={patients} />;
        if (section === "patients") return <Patients patients={patients} />;
        if (section === "messages") return <Messages patients={patients} />;
        if (section === "notes")
          return noteId ? (
            <NoteReview key={noteId} id={noteId} patients={patients} />
          ) : (
            <NotesList patients={patients} />
          );
        return <Today patients={patients} />;
      }}
    </ClinicShell>
  );
}
