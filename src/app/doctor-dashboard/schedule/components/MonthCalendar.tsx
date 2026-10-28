/*
  The month at a glance (Arhaan's Schedule calendar): Monday first, each day with how many
  consultations are booked, today ringed, Sundays shown closed. Choosing a day shows its list.
*/

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { monthAndYear, weekdayDayMonth } from "@/lib/format/dateTime";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import styles from "../SchedulePage.module.css";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MonthCalendar({
  firstOfMonth,
  isThisMonth,
  picked,
  countOn,
  onPick,
  onMove,
}: {
  firstOfMonth: Date;
  isThisMonth: boolean;
  /** the picked day, as Date.toDateString() */
  picked: string;
  countOn: (dayKey: string) => number;
  onPick: (dayKey: string) => void;
  /** months to move by; 0 returns to this month */
  onMove: (months: number) => void;
}) {
  const days = new Date(
    firstOfMonth.getFullYear(),
    firstOfMonth.getMonth() + 1,
    0,
  ).getDate();
  const lead = (firstOfMonth.getDay() + 6) % 7;
  const today = new Date();
  const todayKey = today.toDateString();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const monthName = monthAndYear(
    firstOfMonth.getFullYear(),
    firstOfMonth.getMonth(),
  );

  return (
    <section className={clinicStyles.panel} aria-label="Month">
      <div className={styles.monthHead}>
        <h2 className={clinicStyles.h2}>{monthName}</h2>
        <div className={styles.monthNav}>
          <button
            type="button"
            className={clinicStyles.iconBtn}
            onClick={() => onMove(-1)}
            aria-label="Previous month"
          >
            <CaretLeft size={16} />
          </button>
          {!isThisMonth && (
            <button
              type="button"
              className={clinicStyles.textBtn}
              onClick={() => onMove(0)}
            >
              Today
            </button>
          )}
          <button
            type="button"
            className={clinicStyles.iconBtn}
            onClick={() => onMove(1)}
            aria-label="Next month"
          >
            <CaretRight size={16} />
          </button>
        </div>
      </div>
      <div className={styles.cal} aria-label={monthName}>
        {WEEK.map((weekday) => (
          <span key={weekday} className={styles.calHead} aria-hidden="true">
            {weekday}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = new Date(
            firstOfMonth.getFullYear(),
            firstOfMonth.getMonth(),
            i + 1,
          );
          const key = date.toDateString();
          const count = countOn(key);
          const closed = date.getDay() === 0;
          return (
            <button
              key={key}
              type="button"
              className={styles.calDay}
              aria-pressed={key === picked}
              data-today={key === todayKey}
              data-off={closed}
              data-past={date.getTime() < startOfToday}
              onClick={() => onPick(key)}
              aria-label={`${weekdayDayMonth.format(date)}, ${closed && !count ? "closed" : `${count} consultations`}`}
            >
              <span className={`${styles.calNum} num`}>{i + 1}</span>
              {count > 0 && (
                <span className={`${styles.calCount} num`}>
                  {count}
                  <span className={styles.calWord}> booked</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className={styles.legend}>Sundays closed.</p>
    </section>
  );
}
