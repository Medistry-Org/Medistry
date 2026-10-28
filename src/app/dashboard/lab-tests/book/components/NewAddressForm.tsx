"use client";

/**
 * Adding a collection address: search the area (Redcliffe's place search, through the backend),
 * choose the right place, and the collectors' reach is checked straight away. Then the house and
 * street, a landmark (Redcliffe requires one) and the PIN code, saved with the place's map location.
 */

import { useEffect, useState } from "react";
import { ArrowRight, CaretRight, WarningCircle } from "@phosphor-icons/react";
import { addAddress } from "@/services/addressService";
import { checkLabServiceability, getLabLocationCoordinates, searchLabLocations } from "@/services/labTestService";
import { errorMessage } from "@/lib/http/apiClient";
import type { LabCoordinates, LabPlaceMatch } from "@/types/labTest";
import ErrorNotice from "@/components/ui/ErrorNotice";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "./LabBookingSteps.module.css";

const NOT_SERVED = "Our partner lab does not collect in this area yet.";

export default function NewAddressForm({ isFirst, onSaved, onCancel }: { isFirst: boolean; onSaved: (addressId: number | null) => Promise<void>; onCancel?: () => void }) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ query: string; matches: LabPlaceMatch[] } | null>(null);
  const [checkingEloc, setCheckingEloc] = useState<string | null>(null);
  const [place, setPlace] = useState<(LabPlaceMatch & LabCoordinates) | null>(null);
  const [line, setLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const search = query.trim();

  // search as the patient types, a moment after they pause
  useEffect(() => {
    if (place || search.length < 3) return;
    let live = true;
    const timer = setTimeout(() => {
      searchLabLocations(search)
        .then((matches) => live && setFound({ query: search, matches }))
        .catch((caught) => live && setError(errorMessage(caught)));
    }, 350);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [search, place]);

  const pick = async (match: LabPlaceMatch) => {
    if (checkingEloc) return;
    setCheckingEloc(match.eloc);
    setError(null);
    try {
      const point = await getLabLocationCoordinates(match.eloc);
      const reach = await checkLabServiceability(point);
      if (!reach.serviceable) setError(NOT_SERVED);
      else {
        setPlace({ ...match, ...point });
        setPincode(match.pincode);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setCheckingEloc(null);
    }
  };

  const complete = line.trim().length > 0 && landmark.trim().length > 0 && /^\d{6}$/.test(pincode);

  const save = async () => {
    if (!place || !complete || saving) return;
    setSaving(true);
    setError(null);
    try {
      const id = await addAddress({
        addressLine: `${line.trim()}, ${place.address}`,
        landmark: landmark.trim(),
        city: place.city,
        state: place.state,
        pincode,
        latitude: place.latitude,
        longitude: place.longitude,
        isPrimary: isFirst,
      });
      await onSaved(id);
    } catch (caught) {
      setError(errorMessage(caught));
      setSaving(false);
    }
  };

  if (!place) {
    const matches = found?.query === search ? found.matches : null;
    return (
      <>
        <label className={formStyles.field}>
          <span className={formStyles.label}>Search your area</span>
          <input className={formStyles.input} value={query} onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
            }}
            placeholder="Society, sector or street" autoComplete="off" autoFocus />
        </label>
        {matches && matches.length === 0 && <p className={styles.foot}>Nothing found. Try the society or sector name.</p>}
        {matches && matches.length > 0 && (
          <ul className={styles.packets}>
            {matches.map((match) => (
              <li key={match.eloc}>
                <button type="button" className={styles.packet} onClick={() => pick(match)} aria-busy={checkingEloc === match.eloc}>
                  <span className={styles.packetText}>
                    <strong className={styles.strong}>{match.name}</strong>
                    <span className={styles.packetWhat}>{match.address}</span>
                  </span>
                  {checkingEloc === match.eloc ? <i className={`${formStyles.spin} ${styles.spin}`} aria-label="Checking" /> : <CaretRight size={17} className={styles.go} aria-hidden="true" />}
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
          <button type="button" className={`btn btn--ghost ${styles.pill}`} onClick={onCancel}>
            Use a saved address
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <p className={styles.place}>
        <span>{place.address}</span>
        <button type="button" className={formStyles.link} onClick={() => setPlace(null)}>
          Change
        </button>
      </p>
      <div className={styles.fields}>
        <label className={formStyles.field}>
          <span className={formStyles.label}>House or flat, building and street</span>
          <input className={formStyles.input} value={line} onChange={(e) => setLine(e.target.value)} autoComplete="address-line1" autoFocus />
        </label>
        <label className={formStyles.field}>
          <span className={formStyles.label}>Landmark</span>
          <input className={formStyles.input} value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="For example, near the metro station" />
        </label>
        <label className={formStyles.field}>
          <span className={formStyles.label}>PIN code</span>
          <input className={`${formStyles.input} num`} value={pincode} inputMode="numeric" maxLength={6} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))} autoComplete="postal-code" />
        </label>
      </div>
      {error && <ErrorNotice message={error} />}
      <button type="button" className={`btn ${formStyles.go}`} disabled={!complete} onClick={save} data-busy={saving} aria-busy={saving}>
        <span>{saving ? "Saving" : complete ? "Save and continue" : "Add the address to continue"}</span>
        <span className="well" aria-hidden="true">
          {saving ? <i className={formStyles.spin} /> : <ArrowRight size={18} />}
        </span>
      </button>
    </>
  );
}
