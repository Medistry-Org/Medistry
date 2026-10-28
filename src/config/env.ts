/**
 * Public environment configuration: the ONLY file that reads process.env, except the server-only
 * Redcliffe client in src/server/ (it reads its own secrets). Every variable is in `.env.example`.
 *   NEXT_PUBLIC_API_BASE_URL     Medistry backend, e.g. http://localhost:3000
 *   NEXT_PUBLIC_SOCKET_URL       Socket.IO server for chat (defaults to the API URL)
 *   NEXT_PUBLIC_RAZORPAY_KEY_ID  Razorpay public key id (rzp_test_... locally), used when an order leaves it empty
 * The frontend runs on port 3001 (`npm run dev`) so the backend can keep port 3000.
 */

const DEFAULT_API_BASE_URL = "https://mediapi.unios.in";

const withoutTrailingSlash = (url: string) => url.replace(/\/+$/, "");

export const API_BASE_URL = withoutTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL,
);

export const SOCKET_URL = withoutTrailingSlash(
  process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE_URL,
);

export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

/** Used by the landing page's sign-in modal (src/components/landing/Nav.tsx). New code uses src/services/authService.ts. */
export const AUTH_ENDPOINTS = {
  SEND_OTP: `${API_BASE_URL}/api/auth/send-otp`,
  VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
} as const;
