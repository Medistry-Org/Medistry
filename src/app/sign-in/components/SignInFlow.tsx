"use client";

/**
 * Sign in (and create an account, which is the same flow: the OTP creates it) by mobile OTP.
 * Phone, then code; the code submits itself at the fourth digit. On success the session is saved
 * and the person goes to the doctor dashboard, onboarding or the patient dashboard.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "@phosphor-icons/react";
import { Wordmark } from "@/components/ui/Brand";
import ContourField from "@/components/ui/ContourField";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import { errorMessage } from "@/lib/http/apiClient";
import { getSessionUser, homePathFor, saveSession } from "@/lib/session/authSession";
import { sendOtp, verifyOtp } from "@/services/authService";
import CodeStep from "./CodeStep";
import PhoneStep, { isValidMobile } from "./PhoneStep";
import styles from "../SignInPage.module.css";

const RESEND_AFTER_MS = 30_000;

type Stage = "phone" | "code";

export default function SignInFlow({ creating, signedOut }: { creating: boolean; signedOut: boolean }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("phone");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [digits, setDigits] = useState("");
  const [busy, setBusy] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [verified, setVerified] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  const phoneRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const smsListener = useRef<AbortController | null>(null);

  // someone already signed in goes straight to their account
  useEffect(() => {
    const user = getSessionUser();
    if (user) router.replace(homePathFor(user.role));
  }, [router]);

  const resendInSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));

  // the resend countdown, one tick a second while it runs
  useEffect(() => {
    if (stage !== "code" || resendInSeconds <= 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [stage, resendInSeconds]);

  const submitCode = useCallback(
    async (value: string) => {
      if (busy || verified) return;
      smsListener.current?.abort();
      setBusy(true);
      setCodeError(null);
      try {
        const result = await verifyOtp(digits, value);
        const user = saveSession({ accessToken: result.accessToken, refreshToken: result.refreshToken, mobile: digits, user: result.user });
        setVerified(true);
        const destination = user.role === "DOCTOR" ? homePathFor("DOCTOR") : result.nextScreen === "ONBOARDING" ? "/onboarding" : homePathFor("PATIENT");
        // let the tick land before the page changes
        setTimeout(() => router.push(destination), 520);
      } catch (error) {
        setBusy(false);
        setCode("");
        setShake((n) => n + 1);
        setCodeError(errorMessage(error));
        codeRef.current?.focus();
      }
    },
    [busy, verified, digits, router],
  );

  // Android Chrome can read the code straight from the SMS (WebOTP); elsewhere the keyboard offers
  // it through autocomplete="one-time-code"
  const listenForSms = () => {
    if (!("OTPCredential" in window)) return;
    smsListener.current?.abort();
    const controller = new AbortController();
    smsListener.current = controller;
    (navigator.credentials.get as (options: unknown) => Promise<{ code?: string } | null>)({ otp: { transport: ["sms"] }, signal: controller.signal })
      .then((otp) => {
        if (otp?.code) {
          setCode(otp.code);
          submitCode(otp.code);
        }
      })
      .catch(() => undefined);
  };

  const send = async (again = false) => {
    if (busy) return;
    if (!isValidMobile(digits)) {
      setPhoneError("Enter the 10-digit number, without the 0 or +91.");
      phoneRef.current?.focus();
      return;
    }
    setBusy(true);
    setPhoneError(null);
    try {
      await sendOtp(digits);
    } catch (error) {
      setBusy(false);
      if (again) setCodeError(errorMessage(error));
      else setPhoneError(errorMessage(error));
      return;
    }
    setBusy(false);
    const sentAt = Date.now();
    setNow(sentAt);
    setResendAt(sentAt + RESEND_AFTER_MS);
    setCode("");
    setCodeError(null);
    if (!again) {
      setDirection(1);
      setStage("code");
    }
    listenForSms();
  };

  const backToPhone = () => {
    smsListener.current?.abort();
    setDirection(-1);
    setStage("phone");
    setCode("");
    setCodeError(null);
  };

  // focus follows the stage, after the new panel has arrived
  useEffect(() => {
    const timer = setTimeout(() => (stage === "phone" ? phoneRef : codeRef).current?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => () => smsListener.current?.abort(), []);

  return (
    <main className={styles.page}>
      <section className={styles.box} aria-labelledby="sign-in-title">
        <ContourField className={styles.field} density={10} lineAlpha={0.13} signalAlpha={0.42} seed={11} />
        <header className={styles.top}>
          {stage === "code" ? (
            <button type="button" className={`${formStyles.round} ${styles.roundDark}`} onClick={backToPhone} aria-label="Change number">
              <ArrowLeft size={18} />
            </button>
          ) : (
            <span className={styles.slot} aria-hidden="true" />
          )}
          <Link href="/" className={styles.brand} aria-label="Medistry home">
            <Wordmark height={34} />
          </Link>
          <Link href="/" className={`${formStyles.round} ${styles.roundDark}`} aria-label="Back to the website">
            <X size={18} />
          </Link>
        </header>

        {stage === "phone" ? (
          <PhoneStep
            key="phone"
            creating={creating}
            signedOut={signedOut}
            direction={direction}
            digits={digits}
            error={phoneError}
            busy={busy}
            inputRef={phoneRef}
            onDigits={(value) => {
              setDigits(value);
              setPhoneError(null);
            }}
            onSubmit={() => send()}
          />
        ) : (
          <CodeStep
            key="code"
            direction={direction}
            digits={digits}
            code={code}
            error={codeError}
            shake={shake}
            busy={busy}
            verified={verified}
            resendInSeconds={resendInSeconds}
            inputRef={codeRef}
            onCode={(value) => {
              setCode(value);
              setCodeError(null);
            }}
            onSubmit={submitCode}
            onEditNumber={backToPhone}
            onResend={() => send(true)}
          />
        )}
      </section>

      {/* under the box, in the page's flow, so it can never cover the wordmark or the form */}
      <div className={styles.below}>
        {stage === "phone" && (
          <footer className={styles.foot}>
            <p className={`${formStyles.hint} ${styles.footLinks}`}>
              <span>
                Trouble signing in? <a href="mailto:care@medistry.in">care@medistry.in</a>
              </span>
            </p>
          </footer>
        )}
      </div>
    </main>
  );
}
