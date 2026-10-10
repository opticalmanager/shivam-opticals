/**
 * Precision Optics - Phone Number Normalization & Validation Utility
 * Enforces canonical E.164 standard (+91XXXXXXXXXX) across the entire application.
 */

export interface NormalizedPhone {
  isValid: boolean;
  e164: string;           // E.164 format: e.g. "+919810012345"
  national: string;       // 10 digits: e.g. "9810012345"
  formatted: string;      // Human-readable: e.g. "+91 98100 12345"
  countryCode: string;    // "91"
  error?: string;
}

/**
 * Normalizes any Indian/international mobile number representation into a strict E.164 string.
 * Handles formats: "9810012345", "09810012345", "919810012345", "+91 98100-12345", "+91 98100 12345".
 */
export function normalizePhoneNumber(rawPhone: string | null | undefined, defaultCountryCode = "91"): NormalizedPhone {
  if (!rawPhone || typeof rawPhone !== "string") {
    return {
      isValid: false,
      e164: "",
      national: "",
      formatted: "",
      countryCode: defaultCountryCode,
      error: "Phone number is required",
    };
  }

  // Strip all non-digit characters except leading plus
  const hasLeadingPlus = rawPhone.trim().startsWith("+");
  const digitsOnly = rawPhone.replace(/\D/g, "");

  if (!digitsOnly) {
    return {
      isValid: false,
      e164: "",
      national: "",
      formatted: "",
      countryCode: defaultCountryCode,
      error: "Please enter a valid mobile number",
    };
  }

  let nationalNumber = "";
  let countryCode = defaultCountryCode;

  if (hasLeadingPlus) {
    if (digitsOnly.startsWith("91") && digitsOnly.length === 12) {
      countryCode = "91";
      nationalNumber = digitsOnly.slice(2);
    } else if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      // General international number
      countryCode = digitsOnly.slice(0, digitsOnly.length - 10);
      nationalNumber = digitsOnly.slice(-10);
    } else {
      nationalNumber = digitsOnly;
    }
  } else {
    // No leading plus
    if (digitsOnly.length === 10) {
      // Standard 10-digit national number
      nationalNumber = digitsOnly;
      countryCode = defaultCountryCode;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
      // Leading zero e.g. 09810012345
      nationalNumber = digitsOnly.slice(1);
      countryCode = defaultCountryCode;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
      // 919810012345
      nationalNumber = digitsOnly.slice(2);
      countryCode = "91";
    } else {
      nationalNumber = digitsOnly.slice(-10);
    }
  }

  // Strict Indian mobile validation: 10 digits starting with 5, 6, 7, 8, or 9
  const isIndianNumber = countryCode === "91";
  const isValidIndianMobile = isIndianNumber && /^[5-9]\d{9}$/.test(nationalNumber);
  const isValidLength = nationalNumber.length >= 7 && nationalNumber.length <= 12;

  const isValid = isIndianNumber ? isValidIndianMobile : isValidLength;

  const e164 = `+${countryCode}${nationalNumber}`;
  const formatted = isIndianNumber
    ? `+91 ${nationalNumber.slice(0, 5)} ${nationalNumber.slice(5)}`
    : `+${countryCode} ${nationalNumber}`;

  return {
    isValid,
    e164,
    national: nationalNumber,
    formatted,
    countryCode,
    error: isValid ? undefined : "Please enter a valid 10-digit Indian mobile number",
  };
}
