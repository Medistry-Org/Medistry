/**
 * Sign-in remembers where the person was going: a guard sends them to /sign-in?next=<path>, and
 * after the code they land there, but only on an in-app page they may use: their own dashboard,
 * a video call (both roles join), /pricing (public), or onboarding (patients only). Anything else,
 * including another site, goes to their home.
 */

const PATIENT_HOME = "/patient-dashboard";

export function signInHrefFor(returnPath: string): string {
  return `/sign-in?next=${encodeURIComponent(returnPath)}`;
}

export function pathAfterSignIn(next: string | null, home: string): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\")
  )
    return home;
  const path = next.split(/[?#]/)[0];
  const isOwnArea =
    path === home ||
    path.startsWith(`${home}/`) ||
    path.startsWith("/consultation/") ||
    path === "/pricing" ||
    path === "/pricing/" ||
    (home === PATIENT_HOME && path.startsWith("/onboarding"));
  return isOwnArea ? next : home;
}
