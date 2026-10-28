/*
  Home's third card once the first consultation is over (Arhaan HomeView "Your programme"). Before
  a plan starts it leads to the plans, with the plain facts about how one works; once a plan is
  running it names the plan and leads to Care.
*/

import Link from "next/link";
import { CaretRight, Pill, Receipt, Stethoscope } from "@phosphor-icons/react";
import styles from "./Home.module.css";

export default function ProgrammeCard({ active, planName }: { active: boolean; planName: string }) {
  return (
    <section className={`${styles.card} ${styles.dose} ${styles.quiet}`} aria-labelledby="stage-heading">
      <div className={styles.head}>
        <p className={styles.label}>Your programme</p>
        <span className={styles.go} aria-hidden="true">
          {active ? "Care" : "Plans"}
          <CaretRight size={14} />
        </span>
      </div>
      <h2 id="stage-heading" className={styles.doseTitle}>
        <Link href={active ? "/dashboard/care" : "/dashboard/plans"} className={styles.stretch}>
          {active ? planName || "Your programme" : "Your doctor may suggest a programme"}
        </Link>
      </h2>
      {active ? (
        <p className={styles.quietLine}>A doctor review every month.</p>
      ) : (
        <>
          <ul className={styles.process}>
            <li>
              <Stethoscope size={16} aria-hidden="true" />A doctor review every month
            </li>
            <li>
              <Receipt size={16} aria-hidden="true" />
              You see the itemised price before you pay
            </li>
            <li>
              <Pill size={16} aria-hidden="true" />
              Nothing is prescribed until you start it
            </li>
          </ul>
          <p className={styles.quietLine}>Nothing is prescribed until you start it.</p>
        </>
      )}
    </section>
  );
}
