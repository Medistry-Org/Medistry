/**
 * Sign-in by mobile OTP. The landing page's sign-in modal still uses AUTH_ENDPOINTS in config/env.ts.
 *   POST /api/auth/send-otp     sends the code { mobile } -> { message }
 *   POST /api/auth/verify-otp   checks it { mobile, otp } -> { data: { accessToken, refreshToken, user, nextScreen } }
 *   POST /api/auth/logout       ends the session
 */

import { apiRequest } from "@/lib/http/apiClient";
import type { NextScreen, SignInResult } from "@/types/auth";

type VerifyOtpResponse = {
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: SignInResult["user"];
    nextScreen?: string;
  };
  accessToken?: string;
  refreshToken?: string;
  user?: SignInResult["user"];
  nextScreen?: string;
};

export async function sendOtp(mobile: string): Promise<string | null> {
  const body = await apiRequest<{ message?: string }>("/api/auth/send-otp", {
    method: "POST",
    body: { mobile },
    authenticated: false,
  });
  return body?.message ?? null;
}

export async function verifyOtp(
  mobile: string,
  otp: string,
): Promise<SignInResult> {
  const body = await apiRequest<VerifyOtpResponse>("/api/auth/verify-otp", {
    method: "POST",
    body: { mobile, otp },
    authenticated: false,
  });
  const accessToken = body.data?.accessToken ?? body.accessToken;
  if (!accessToken)
    throw new Error(
      "Sign-in worked, but the server did not return a session. Please try again.",
    );
  const nextScreen: NextScreen =
    String(body.data?.nextScreen ?? body.nextScreen ?? "").toUpperCase() ===
    "ONBOARDING"
      ? "ONBOARDING"
      : "DASHBOARD";
  return {
    accessToken,
    refreshToken: body.data?.refreshToken ?? body.refreshToken ?? null,
    nextScreen,
    user: body.data?.user ?? body.user ?? null,
  };
}

export async function logout(): Promise<void> {
  await apiRequest("/api/auth/logout", { method: "POST" });
}
