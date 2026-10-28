"use client";

/**
 * The consultation room for both roles. Before joining: a camera and microphone check, then Join,
 * which asks the backend for the 100ms room (GET /api/video/appointments/:id/join) and embeds it
 * full screen. Leave goes back to the person's home; a doctor can also end the consultation for
 * everyone (POST /api/video/appointments/:id/end), confirmed in a sheet.
 */

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhoneDisconnect, SignOut } from "@phosphor-icons/react";
import { endVideoConsultation, joinVideoConsultation, type VideoRoom } from "@/services/videoConsultationService";
import { errorMessage } from "@/lib/http/apiClient";
import { getSessionUser, homePathFor } from "@/lib/session/authSession";
import { Wordmark } from "@/components/ui/Brand";
import ErrorNotice from "@/components/ui/ErrorNotice";
import PreJoin from "./PreJoin";
import EndConsultationSheet from "./EndConsultationSheet";
import CallEnded from "./CallEnded";
import styles from "./ConsultationRoom.module.css";

type Stage = { name: "before" } | { name: "live"; room: VideoRoom } | { name: "ended" };

const subscribeToNothing = () => () => {};

export default function ConsultationRoom({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  // the session lives on this device: read it only once hydrated, so the server and first paint agree
  const hydrated = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const user = hydrated ? getSessionUser() : null;
  const [stage, setStage] = useState<Stage>({ name: "before" });
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const home = homePathFor(user?.role ?? "PATIENT");

  const join = async () => {
    setJoining(true);
    setJoinError(null);
    try {
      setStage({ name: "live", room: await joinVideoConsultation(appointmentId) });
    } catch (caught) {
      setJoinError(errorMessage(caught));
    } finally {
      setJoining(false);
    }
  };

  const endForEveryone = async () => {
    await endVideoConsultation(appointmentId);
    setConfirmingEnd(false);
    setStage({ name: "ended" });
  };

  const live = stage.name === "live";

  return (
    <main className={styles.room} data-live={live}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Wordmark height={23} />
          <span className={styles.divider} aria-hidden="true" />
          <span className={styles.headerTitle}>Consultation</span>
        </div>
        {live && (
          <div className={styles.headerActions}>
            {stage.room.role === "doctor" && (
              <button type="button" className={styles.endButton} onClick={() => setConfirmingEnd(true)}>
                <PhoneDisconnect size={18} aria-hidden="true" /> End consultation
              </button>
            )}
            <button type="button" className={styles.secondaryButton} onClick={() => router.push(home)}>
              <SignOut size={18} aria-hidden="true" /> Leave
            </button>
          </div>
        )}
      </header>

      {hydrated && !user && (
        <div className={styles.prejoin}>
          <ErrorNotice message="Sign in to join your consultation." />
          <Link href="/sign-in" className={styles.secondaryButton}>
            Sign in
          </Link>
        </div>
      )}

      {user && stage.name === "before" && (
        <PreJoin seenBy={user.role === "DOCTOR" ? "your patient" : "your doctor"} joining={joining} error={joinError} home={home} onJoin={join} />
      )}

      {live && (
        <div className={styles.stage}>
          <iframe
            className={styles.frame}
            title="Video consultation"
            src={stage.room.joinLink}
            allow="camera; microphone; display-capture; autoplay; clipboard-write"
          />
        </div>
      )}

      {stage.name === "ended" && <CallEnded home={home} />}

      <EndConsultationSheet open={confirmingEnd} onClose={() => setConfirmingEnd(false)} onEnd={endForEveryone} />
    </main>
  );
}
