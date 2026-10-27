// src/config/env.ts

// export const API_BASE_URL =
//   // process.env.NEXT_PUBLIC_API_BASE_URL || "https://mediapi.unios.in";
//   process.env.NEXT_PUBLIC_API_BASE_URL || "http://192.168.1.16:3000";

// export const AUTH_ENDPOINTS = {
//   SEND_OTP: `${API_BASE_URL}/api/auth/send-otp`,
//   VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
// } as const;

const DEFAULT_API_URL = "http://192.168.1.14:3000"; //https://mediapi.unios.in  http://192.168.1.24:3000

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_URL
).replace(/\/+$/, "");

export const SOCKET_URL = (
  process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE_URL
).replace(/\/+$/, "");

export const AUTH_ENDPOINTS = {
  SEND_OTP: `${API_BASE_URL}/api/auth/send-otp`,
  VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
} as const;
