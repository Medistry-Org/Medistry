/*
  "Waiting on you" on Today (Arhaan's queue panel): one row per patient, their most pressing item
  leading, the rest as chips that each open their own task. The backend sends the queue most
  pressing first (severe symptoms, urgent messages, reports, messages, notes, drafts), so grouping
  keeps that order. `items` is null while the backend has no queue endpoint, undefined while loading.
*/

import Link from "next/link";
import { ChatsCircle, Flask, Notepad, Prescription, WarningCircle } from "@phosphor-icons/react";
import { timeAgo } from "@/lib/format/dateTime";
import type { WaitingItem } from "@/types/patientRecord";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import styles from "../TodayPage.module.css";
import { chipWords, itemHref } from "./waitingWords";

function KindIcon({ item }: { item: WaitingItem }) {
  if (item.kind === "lab") return <Flask size={18} />;
  if (item.kind === "rx") return <Prescription size={18} />;
  if (item.kind === "note") return <Notepad size={18} />;
  if (item.kind === "message") return item.urgent ? <WarningCircle size={18} weight="fill" /> : <ChatsCircle size={18} />;
  return <WarningCircle size={18} weight={item.severity === "Severe" ? "fill" : "regular"} />;
}

function byPatient(items: WaitingItem[]) {
  const groups = new Map<string, WaitingItem[]>();
  for (const item of items) groups.set(item.patientId, [...(groups.get(item.patientId) ?? []), item]);
  return [...groups.values()];
}

export default function WaitingQueue({ items, now }: { items: WaitingItem[] | null | undefined; now: number }) {
  return (
    <section className={`${clinicStyles.panel} ${styles.queuePanel}`} aria-labelledby="waiting-heading">
      <div className={clinicStyles.panelHead}>
        <h2 id="waiting-heading" className={clinicStyles.h2}>
          Waiting on you
        </h2>
        {items && <span className={`${clinicStyles.count} num`}>{items.length}</span>}
      </div>
      {items === undefined ? null : items === null ? (
        <p className={clinicStyles.empty}>Not available yet. Flagged symptoms, messages for you, new reports, call notes and drafts to sign will appear here.</p>
      ) : items.length ? (
        <ul className={styles.queue}>
          {byPatient(items).map((group) => {
            const top = group[0];
            return (
              <li key={top.patientId} className={styles.qItem} data-kind={top.kind} data-severity={top.severity ?? undefined} data-urgent={top.urgent || undefined}>
                <span className={styles.qIcon} aria-hidden="true">
                  <KindIcon item={top} />
                </span>
                <span className={styles.qText}>
                  <span className={styles.qLine}>
                    <Link href={itemHref(top)} className={styles.qName} title={`${top.title}: ${top.detail}`}>
                      {top.patientName}
                    </Link>
                    {group.some((item) => item.severity === "Severe") && <span className={clinicStyles.qSevere}>Severe</span>}
                    <span className={`${styles.qWhen} num`}>{timeAgo(top.at, now)}</span>
                  </span>
                  <span className={styles.qChips}>
                    {group.map((item) => (
                      <Link key={item.id} href={itemHref(item)} className={styles.qChip} data-kind={item.kind} data-severity={item.severity ?? undefined} data-urgent={item.urgent || undefined}>
                        {chipWords(item)}
                      </Link>
                    ))}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={clinicStyles.empty}>Nothing waiting. Flagged symptoms, messages for you, new reports, call notes and drafts to sign appear here.</p>
      )}
    </section>
  );
}
