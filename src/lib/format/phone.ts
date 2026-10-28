/** Indian mobile numbers: the one country code the backend signs in, how a number is written, and what counts as one. */

/** The backend signs in Indian mobiles only, so the country list has one entry for now. */
export const COUNTRY_CODE = "+91";

/** 98765 43210: the way an Indian number is read aloud and written down. */
export const spacedMobile = (digits: string) =>
  digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;

/** Pasted numbers arrive as +91 98765 43210, 098765 43210 or 919876543210. */
export function mobileDigitsFrom(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export const isValidMobile = (digits: string) => /^[6-9]\d{9}$/.test(digits);
