/** The first step: the 10-digit Indian mobile number, with a tick the moment it is complete. */

import type { CSSProperties, RefObject } from "react";
import Link from "next/link";
import { ArrowRight, CaretRight, Check, WarningCircle } from "@phosphor-icons/react";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "../SignInPage.module.css";

/** The backend signs in Indian mobiles only, so the country list has one entry for now. */
export const COUNTRY_CODE = "+91";

/** 98765 43210: the way an Indian number is read aloud and written down. */
export const spacedMobile = (digits: string) => (digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits);

/** Pasted numbers arrive as +91 98765 43210, 098765 43210 or 919876543210. */
function mobileDigitsFrom(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export const isValidMobile = (digits: string) => /^[6-9]\d{9}$/.test(digits);

type Props = {
  creating: boolean;
  signedOut: boolean;
  direction: 1 | -1;
  digits: string;
  error: string | null;
  busy: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onDigits: (digits: string) => void;
  onSubmit: () => void;
};

export default function PhoneStep({ creating, signedOut, direction, digits, error, busy, inputRef, onDigits, onSubmit }: Props) {
  const valid = isValidMobile(digits);
  return (
    <form
      className={styles.step}
      style={{ "--dir": direction } as CSSProperties}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <div className={styles.head}>
        <h1 id="sign-in-title" className={styles.title}>
          {creating ? "Create your account" : "Sign in"}
        </h1>
        <p className={styles.sub}>
          {creating ? "We text you a 4-digit code, so there is no password to remember." : `${signedOut ? "You're signed out. " : ""}We text a 4-digit code to your mobile.`}
        </p>
      </div>

      <div className={styles.field2}>
        <label className={styles.label} htmlFor="sign-in-mobile">
          Mobile number
        </label>
        <div className={styles.phone} data-invalid={!!error}>
          <span className={styles.cc}>
            <select aria-label="Country code" defaultValue={COUNTRY_CODE} className={styles.ccSelect}>
              <option value={COUNTRY_CODE}>{COUNTRY_CODE} India</option>
            </select>
            <span className={styles.ccShown} aria-hidden="true">
              {COUNTRY_CODE}
            </span>
          </span>
          <input
            ref={inputRef}
            id="sign-in-mobile"
            className={styles.phoneInput}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            value={spacedMobile(digits)}
            aria-invalid={!!error}
            aria-describedby={error ? "sign-in-mobile-error" : undefined}
            onChange={(e) => onDigits(mobileDigitsFrom(e.target.value))}
          />
          <span className={styles.phoneOk} data-on={valid} aria-hidden="true">
            <Check size={14} weight="bold" />
          </span>
        </div>
        {error && (
          <p className={styles.err} id="sign-in-mobile-error" role="alert">
            <WarningCircle size={16} />
            {error}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        {/* never disabled: a tap on a short or mistyped number has to say what is wrong */}
        <button type="submit" className={`btn btn--signal ${formStyles.go} ${styles.go}`} data-ready={valid} data-busy={busy} aria-busy={busy}>
          <span>{busy ? "Sending code" : "Continue"}</span>
          <span className="well" aria-hidden="true">
            {busy ? <i className={formStyles.spin} /> : <ArrowRight size={18} />}
          </span>
        </button>
        <p className={styles.legal}>
          By continuing you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy notice</a>.
        </p>
      </div>

      <p className={styles.switch}>
        {creating ? "Already with Medistry?" : "New to Medistry?"}{" "}
        <Link href={creating ? "/sign-in" : "/sign-in?new=1"} className={`${formStyles.link} ${styles.link}`}>
          {creating ? "Sign in" : "Create an account"}
          <CaretRight size={14} weight="bold" />
        </Link>
      </p>
    </form>
  );
}
