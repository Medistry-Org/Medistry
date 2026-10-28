/** Where the backend sends a person after sign-in (`nextScreen` from /api/auth/verify-otp). */
export type NextScreen = "ONBOARDING" | "DASHBOARD";

export type SignInResult = {
  accessToken: string;
  refreshToken: string | null;
  nextScreen: NextScreen;
  user: { id?: number | string; userId?: number | string; fullName?: string; name?: string } | null;
};
