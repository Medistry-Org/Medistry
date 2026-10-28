/*
  The record's overview (Arhaan's Overview panel): the patient's own words from their last
  check-in, then weight, change since the last visit, BMI, waist and HbA1c, and the weight readings.
*/

import { shortDate } from "@/lib/format/dateTime";
import type { PatientRecord } from "@/types/patientRecord";
import WeightChart from "./WeightChart";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import recordStyles from "../PatientRecordPage.module.css";

const signedKg = (kg: number) =>
  `${kg > 0 ? "+" : kg < 0 ? "−" : ""}${Math.abs(kg)} kg`;

export default function OverviewPanel({
  record,
  sex,
}: {
  record: PatientRecord;
  sex: string;
}) {
  const latest = record.weights.at(-1);
  const first = record.weights[0];
  const since = record.sinceLastVisit;
  const hba1c = record.hba1c.at(-1);
  const hba1cBefore = record.hba1c.at(-2);
  const waistLimit = /^f/i.test(sex) ? 80 : 90;
  return (
    <section
      id="overview"
      className={`${clinicStyles.panel} ${recordStyles.full}`}
      aria-labelledby="overview-heading"
    >
      <div className={clinicStyles.panelHead}>
        <h2 id="overview-heading" className={clinicStyles.h2}>
          Overview
        </h2>
      </div>
      {record.concern && (
        <p className={recordStyles.concern}>
          <span className={recordStyles.voice}>{record.concern}</span>
          <span className={recordStyles.voiceBy}>
            The patient, at their last check-in
          </span>
        </p>
      )}
      <div className={recordStyles.tiles}>
        <div className={recordStyles.tile}>
          <span>Weight</span>
          <strong className="num" data-empty={!latest || undefined}>
            {latest ? `${latest.kg} kg` : "Not recorded"}
          </strong>
          {latest && (
            <em>
              {shortDate(latest.at)}, {latest.source.toLowerCase()}
            </em>
          )}
        </div>
        {since && (
          <div className={recordStyles.tile}>
            <span>{`Since last visit, ${shortDate(since.at)}`}</span>
            <strong className="num">
              {since.weightChangeKg !== null
                ? signedKg(since.weightChangeKg)
                : "No new reading"}
            </strong>
            <em>
              {latest && first && record.weights.length > 1
                ? `${signedKg(Math.round((latest.kg - first.kg) * 10) / 10)} since ${shortDate(first.at)}`
                : "From the free check"}
            </em>
          </div>
        )}
        <div className={recordStyles.tile}>
          <span>BMI</span>
          <strong className="num" data-empty={!record.bmi || undefined}>
            {record.bmi ?? "Not recorded"}
          </strong>
          {record.heightCm && <em>Height {record.heightCm} cm</em>}
        </div>
        <div className={recordStyles.tile}>
          <span>Waist</span>
          <strong className="num" data-empty={!record.waist || undefined}>
            {record.waist ? `${record.waist.cm} cm` : "Not recorded"}
          </strong>
          <em>
            {record.waist
              ? `${shortDate(record.waist.at)}, limit ${waistLimit} cm`
              : "Ask to measure"}
          </em>
        </div>
        <div className={recordStyles.tile}>
          <span>HbA1c</span>
          <strong className="num" data-empty={!hba1c || undefined}>
            {hba1c ? `${hba1c.value}%` : "Not tested"}
          </strong>
          <em>
            {hba1c
              ? `${shortDate(hba1c.at)}${hba1cBefore ? `, was ${hba1cBefore.value}% on ${shortDate(hba1cBefore.at)}` : ""}`
              : "Order with the next labs"}
          </em>
        </div>
      </div>
      {record.weights.length > 1 && (
        <WeightChart
          readings={record.weights.map((weight) => ({
            at: weight.at,
            kg: weight.kg,
          }))}
          unit="kg"
          toUnit={(kg) => kg}
        />
      )}
    </section>
  );
}
