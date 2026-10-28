/**
 * Sign-in by mobile OTP.
 *   POST /api/auth/send-otp    { mobile }          -> { message }
 *   POST /api/auth/verify-otp  { mobile, otp }     -> { data: { accessToken, refreshToken, user, nextScreen } }
 *   POST /api/auth/logout
 */

import { apiRequest } from "@/lib/http/apiClient";
import type { NextScreen, SignInResult } from "@/types/auth";

type VerifyOtpResponse = {
  data?: { accessToken?: string; refreshToken?: string; user?: SignInResult["user"]; nextScreen?: string };
  accessToken?: string;
  refreshToken?: string;
  user?: SignInResult["user"];
  nextScreen?: string;
};

export async function sendOtp(mobile: string): Promise<string | null> {
  const body = await apiRequest<{ message?: string }>("/api/auth/send-otp", { method: "POST", body: { mobile }, authenticated: false });
  return body?.message ?? null;
}

export async function verifyOtp(mobile: string, otp: string): Promise<SignInResult> {
  const body = await apiRequest<VerifyOtpResponse>("/api/auth/verify-otp", { method: "POST", body: { mobile, otp }, authenticated: false });
  const accessToken = body.data?.accessToken ?? body.accessToken;
  if (!accessToken) throw new Error("Sign-in worked, but the server did not return a session. Please try again.");
  const nextScreen = String(body.data?.nextScreen ?? body.nextScreen ?? "").toUpperCase() === "ONBOARDING" ? "ONBOARDING" : "DASHBOARD";
  return {
    accessToken,
    refreshToken: body.data?.refreshToken ?? body.refreshToken ?? null,
    nextScreen: nextScreen as NextScreen,
    user: body.data?.user ?? body.user ?? null,
  };
}

export async function logout(): Promise<void> {
  await apiRequest("/api/auth/logout", { method: "POST" });
}
