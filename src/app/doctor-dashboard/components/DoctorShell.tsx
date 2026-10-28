"use client";

/*
  The doctor's workspace around every /doctor-dashboard page (Arhaan's clinician ClinicShell): a
  quiet rail of five places on a laptop, a top bar and a dock on a phone, and the toast. The places
  lead (Today, Schedule, Patients); the two queues with counts (Notes, Messages) close the list.
  Only signed-in doctors get past it: anyone signed out goes to /sign-in, a patient to /dashboard.

  A call note under review (/doctor-dashboard/notes/<id>) is a pushed screen: below a laptop it
  brings its own top and bottom bars, so the shell's phone chrome steps aside ("bare").
*/

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarBlank, ChatsCircle, Notepad, SquaresFour, Users } from "@phosphor-icons/react";
import AppTheme from "@/components/ui/AppTheme";
import Avatar from "@/components/ui/Avatar";
import { Wordmark } from "@/components/ui/Brand";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import ToastProvider from "@/components/ui/ToastProvider";
import { useApiResource } from "@/hooks/useApiResource";
import { getSessionUser, isSignedIn } from "@/lib/session/authSession";
import { getMyDoctorProfile } from "@/services/doctorPortalService";
import { getWorkCounts } from "@/services/patientRecordService";
import type { DoctorWorkCounts } from "@/types/patientRecord";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import styles from "./DoctorShell.module.css";

type Section = "today" | "schedule" | "patients" | "notes" | "messages";

const SECTIONS: { id: Section; href: string; label: string; icon: typeof Users; count?: keyof DoctorWorkCounts }[] = [
  { id: "today", href: "/doctor-dashboard", label: "Today", icon: SquaresFour, count: "waitingOnYou" },
  { id: "schedule", href: "/doctor-dashboard/schedule", label: "Schedule", icon: CalendarBlank },
  { id: "patients", href: "/doctor-dashboard/patients", label: "Patients", icon: Users },
  { id: "notes", href: "/doctor-dashboard/notes", label: "Notes", icon: Notepad, count: "notesToSign" },
  { id: "messages", href: "/doctor-dashboard/messages", label: "Messages", icon: ChatsCircle, count: "messagesForYou" },
];

const noSubscription = () => () => {};

/** "OUT", "DOCTOR" or "PATIENT" in the browser; null on the server, before the session is read. */
function useSessionRole() {
  return useSyncExternalStore(
    noSubscription,
    () => (isSignedIn() ? (getSessionUser()?.role ?? "PATIENT") : "OUT"),
    () => null,
  );
}

export default function DoctorShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useSessionRole();
  const isDoctor = role === "DOCTOR";
  const profile = useApiResource(isDoctor ? "doctor-profile" : null, getMyDoctorProfile);
  // the badges refresh on every move between places, so a signed note or answered message drops off
  const counts = useApiResource(isDoctor ? `work-counts-${pathname}` : null, getWorkCounts);

  useEffect(() => {
    if (role === "OUT") router.replace("/sign-in");
    if (role === "PATIENT") router.replace("/dashboard");
  }, [role, router]);

  if (!isDoctor) {
    return (
      <AppTheme>
        <main className={clinicStyles.page}>
          <LoadingSkeleton />
        </main>
      </AppTheme>
    );
  }

  const section = (pathname.split("/")[2] ?? "") || "today";
  const bare = /^\/doctor-dashboard\/notes\/[^/]+/.test(pathname);
  const name = profile.data?.fullName ?? getSessionUser()?.fullName ?? "Doctor";
  const countOf = (key?: keyof DoctorWorkCounts) => (key && counts.data ? counts.data[key] : 0);

  return (
    <AppTheme>
      <ToastProvider className={bare ? styles.toastBare : styles.toastLift}>
        <div className={styles.app} data-bare={bare || undefined}>
          <aside className={styles.rail}>
            <Link href="/doctor-dashboard" className={styles.brand} aria-label="Medistry clinician portal">
              <Wordmark height={24} />
              <span className={styles.portal}>Clinician</span>
            </Link>
            <nav className={styles.nav} aria-label="Clinician">
              {SECTIONS.map((item) => {
                const Icon = item.icon;
                const count = countOf(item.count);
                return (
                  <Link key={item.id} href={item.href} className={styles.navItem} aria-current={item.id === section ? "page" : undefined}>
                    <Icon size={19} weight={item.id === section ? "fill" : "regular"} />
                    {item.label}
                    {count > 0 && <span className={styles.badge}>{count}</span>}
                  </Link>
                );
              })}
            </nav>
            <div className={styles.me}>
              <Avatar name={name} src={profile.data?.photoUrl} size={36} />
              <div>
                <strong>{name}</strong>
                {profile.data?.specialization && <span>{profile.data.specialization}</span>}
              </div>
            </div>
          </aside>

          <header className={styles.top}>
            <Link href="/doctor-dashboard" className={styles.brand} aria-label="Medistry clinician portal">
              <Wordmark height={22} />
              <span className={styles.portal}>Clinician</span>
            </Link>
            <Avatar name={name} src={profile.data?.photoUrl} size={36} />
          </header>

          <div className={styles.main}>{children}</div>

          <nav className={styles.dock} aria-label="Clinician">
            {SECTIONS.map((item) => {
              const Icon = item.icon;
              const on = item.id === section;
              const count = countOf(item.count);
              return (
                <Link key={item.id} href={item.href} className={styles.dockTab} aria-current={on ? "page" : undefined}>
                  <span className={styles.dockIcon}>
                    <Icon size={22} weight={on ? "fill" : "regular"} />
                    {count > 0 && <i className={styles.dockBadge}>{count}</i>}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </ToastProvider>
    </AppTheme>
  );
}
