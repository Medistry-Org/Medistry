// src/config/env.ts

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://mediapi.unios.in";

export const AUTH_ENDPOINTS = {
  SEND_OTP: `${API_BASE_URL}/api/auth/send-otp`,
  VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
} as const;
