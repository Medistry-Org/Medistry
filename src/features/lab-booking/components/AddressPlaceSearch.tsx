/** The first part of adding an address: search the area, then choose the right place from the matches. */

import { CaretRight, WarningCircle } from "@phosphor-icons/react";
import type { LabPlaceMatch } from "@/types/labTest";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "../LabBookingFlow.module.css";

export default function AddressPlaceSearch({
  query,
  onQuery,
  matches,
  checkingEloc,
  onPick,
  error,
  onCancel,
}: {
  query: string;
  onQuery: (query: string) => void;
  matches: LabPlaceMatch[] | null;
  checkingEloc: string | null;
  onPick: (match: LabPlaceMatch) => void;
  error: string | null;
  onCancel?: () => void;
}) {
  return (
    <>
      <label className={formStyles.field}>
        <span className={formStyles.label}>Search your area</span>
        <input
          className={formStyles.input}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Society, sector or street"
          autoComplete="off"
          autoFocus
        />
      </label>
      {matches && matches.length === 0 && (
        <p className={styles.foot}>
          Nothing found. Try the society or sector name.
        </p>
      )}
      {matches && matches.length > 0 && (
        <ul className={styles.packets}>
          {matches.map((match) => (
            <li key={match.eloc}>
              <button
                type="button"
                className={styles.packet}
                onClick={() => onPick(match)}
                aria-busy={checkingEloc === match.eloc}
              >
                <span className={styles.packetText}>
                  <strong className={styles.strong}>{match.name}</strong>
                  <span className={styles.packetWhat}>{match.address}</span>
                </span>
                {checkingEloc === match.eloc ? (
                  <i
                    className={`${formStyles.spin} ${styles.spin}`}
                    aria-label="Checking"
                  />
                ) : (
                  <CaretRight
                    size={17}
                    className={styles.go}
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className={formStyles.err} role="alert">
          <WarningCircle size={16} weight="bold" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {onCancel && (
        <button
          type="button"
          className={`btn btn--ghost ${styles.pill}`}
          onClick={onCancel}
        >
          Use a saved address
        </button>
      )}
    </>
  );
}
