"use client";

/*
  Home's weight card (Arhaan HomeView): the latest reading, what changed since the first one, a
  quiet line of past readings, and Log weight, which opens the weight sheet without leaving Home.
  Readings come from the proposed /api/trackers/weight (null while the backend lacks it); until
  there is a reading, the weight from the patient's profile is shown and says where it came from.
*/

import { useCallback, useState } from "react";
import { Plus } from "@phosphor-icons/react";
import Sheet from "@/components/ui/Sheet";
import { shortDate } from "@/lib/format/dateTime";
import { kgTo, useUnits, type WeightUnit } from "@/lib/units/measurementUnits";
import type { WeightReading } from "@/types/tracker";
import WeightSheet from "./WeightSheet";
import WeightSparkline from "./WeightSparkline";
import styles from "./Home.module.css";

/** Weight change since the first reading, in the patient's unit, with a true minus sign. */
function changeSinceFirst(readings: WeightReading[], unit: WeightUnit) {
  if (readings.length < 2) return null;
  const delta = Math.round((kgTo(readings[readings.length - 1].weightKg, unit) - kgTo(readings[0].weightKg, unit)) * 10) / 10;
  return `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${Math.abs(delta).toFixed(1)} ${unit}`;
}

type Props = {
  readings: WeightReading[] | null;
  profileWeightKg: number | null;
  /** the one filled button on Home: Log weight takes it unless the next-step line already has it */
  primary: boolean;
  onSave: (weightKg: number) => Promise<void>;
};

export default function WeightCard({ readings, profileWeightKg, primary, onSave }: Props) {
  const unit = useUnits().weight;
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const list = readings ?? [];
  const latest = list[list.length - 1];
  const shownKg = latest?.weightKg ?? profileWeightKg;
  const moved = changeSinceFirst(list, unit);

  return (
    <section className={`${styles.card} ${styles.weight}`} aria-labelledby="weight-heading">
      <div className={styles.head}>
        <h2 id="weight-heading" className={styles.label}>
          Your weight
        </h2>
      </div>
      <p className={styles.big}>
        {shownKg ? (
          <>
            <span className="num">{kgTo(shownKg, unit).toFixed(1)}</span>
            <span className={styles.unit}>{unit}</span>
          </>
        ) : (
          <span className={styles.none}>No reading yet</span>
        )}
      </p>
      <p className={styles.moved}>
        {moved ? (
          <>
            <span className="num">{moved}</span> since {shortDate(list[0].loggedAt)}
          </>
        ) : latest ? (
          <>First reading, {shortDate(latest.loggedAt)}</>
        ) : shownKg ? (
          "From your profile"
        ) : null}
      </p>
      {list.length > 1 ? (
        <WeightSparkline readings={list.slice(-24)} unit={unit} />
      ) : (
        <p className={styles.tip}>
          {readings === null ? "Logging your weight is not available yet." : "Weigh twice a week, before breakfast, and your line starts here."}
        </p>
      )}
      <div className={styles.actions}>
        <button type="button" className={`${styles.act} ${primary ? styles.actMain : ""}`} onClick={() => setOpen(true)}>
          <Plus size={17} weight="bold" aria-hidden="true" />
          Log weight
        </button>
      </div>

      <Sheet open={open} onClose={close} title="Log your weight">
        {open && (
          <WeightSheet
            startKg={shownKg ?? 78}
            last={latest}
            onSave={async (weightKg) => {
              await onSave(weightKg);
              close();
            }}
          />
        )}
      </Sheet>
    </section>
  );
}
