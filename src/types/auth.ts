/** Sign-in by mobile OTP. */

/** Where the backend sends a person after sign-in (`nextScreen` from /api/auth/verify-otp). */
export type NextScreen = "ONBOARDING" | "DASHBOARD";

/** What POST /api/auth/verify-otp gives the app. */
export type SignInResult = {
  accessToken: string;
  refreshToken: string | null;
  nextScreen: NextScreen;
  user: {
    id?: number | string;
    userId?: number | string;
    fullName?: string;
    name?: string;
  } | null;
};
