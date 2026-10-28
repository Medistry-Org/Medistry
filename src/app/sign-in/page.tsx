/**
 * /sign-in: mobile OTP sign-in. `?new=1` shows the "Create your account" wording (the OTP creates
 * the account, so it is the same flow); `?out=1` follows a sign-out.
 */

import type { Metadata } from "next";
import SignInFlow from "./components/SignInFlow";

export const metadata: Metadata = {
  title: "Sign in | Medistry",
  robots: { index: false, follow: false },
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <SignInFlow creating={params.new !== undefined} signedOut={params.out !== undefined} />;
}
