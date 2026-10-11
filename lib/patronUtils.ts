/**
 * Shivam Optics - Patron Identity & Fallback Resolution Utilities
 * Industrial logic for patron name formatting, email validation, and luxury identity fallback.
 */

/**
 * Resolves a clean, luxury display name for a patron.
 * 
 * Rules:
 * 1. If explicit name is provided: trims, normalizes spacing, and converts to Title Case.
 * 2. If name is blank and email is provided:
 *    - Parses email prefix (e.g. "rahul.sharma@example.com" -> "Rahul Sharma")
 *    - Strips numbers and delimiters (. _ - +), converts to Title Case.
 *    - If prefix has alphanumeric leading name (e.g. "aditi98200@domain.com") -> "Aditi (Patron)"
 *    - Otherwise defaults to "Shivam Patron".
 * 3. If name is blank and phone is provided:
 *    - Extracts the last 4 digits (e.g. "+91 98100 44122" -> "Patron 4122").
 * 4. Failsafe fallback: "Shivam Patron".
 */
export function resolvePatronName(
  rawName?: string | null,
  identifiers?: { phone?: string | null; email?: string | null }
): string {
  // 1. Explicit name provided
  if (rawName && typeof rawName === "string") {
    const trimmed = rawName.trim().replace(/\s+/g, " ");
    if (trimmed.length >= 2) {
      return trimmed
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    }
  }

  // 2. Email fallback inference
  if (identifiers?.email && typeof identifiers.email === "string") {
    const email = identifiers.email.trim().toLowerCase();
    const username = email.split("@")[0] || "";

    // Replace delimiters with spaces and strip numeric digits
    const cleanLettersOnly = username
      .replace(/[._\-+]/g, " ")
      .replace(/\d+/g, "")
      .trim();

    if (cleanLettersOnly.length >= 3) {
      const words = cleanLettersOnly
        .split(/\s+/)
        .filter((w) => w.length >= 2)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

      if (words.length > 0) {
        return words.join(" ");
      }
    }

    // Try leading alphabetic word if letters are followed by numbers (e.g. "rahul123" -> "Rahul (Patron)")
    const leadingAlphaMatch = username.match(/^[a-zA-Z]+/);
    if (leadingAlphaMatch && leadingAlphaMatch[0].length >= 3) {
      const cap = leadingAlphaMatch[0].charAt(0).toUpperCase() + leadingAlphaMatch[0].slice(1).toLowerCase();
      return `${cap} (Patron)`;
    }

    return "Shivam Patron";
  }

  // 3. Phone fallback inference (Patron + last 4 digits)
  if (identifiers?.phone && typeof identifiers.phone === "string") {
    const digits = identifiers.phone.replace(/\D/g, "");
    if (digits.length >= 4) {
      return `Patron ${digits.slice(-4)}`;
    }
  }

  return "Shivam Patron";
}

/**
 * Validates whether an email string has a valid format.
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}

/**
 * Validates whether an Indian mobile number has 10 valid digits.
 */
export function isValidIndianPhone(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  // Standard Indian 10 digits (optionally with 91 prefix)
  if (digits.length === 10 && /^[5-9]\d{9}$/.test(digits)) return true;
  if (digits.length === 12 && digits.startsWith("91") && /^[5-9]\d{9}$/.test(digits.slice(2))) return true;
  return false;
}
