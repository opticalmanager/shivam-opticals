import crypto from "node:crypto";

const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || "shivam_optics_patron_pwd_pepper_2026";

/**
 * Derives a secure scrypt password hash with a random 16-byte salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password + PASSWORD_PEPPER, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Timing-safe verification of password against stored scrypt hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password + PASSWORD_PEPPER, salt, 64);
    if (keyBuffer.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
