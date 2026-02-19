import { nanoid, customAlphabet } from "nanoid";

/** Generate a session token (21-character default nanoid) */
export function generateSessionToken(): string {
  return nanoid();
}

/** Generate QR token (21-character default nanoid) */
export function generateQrToken(): string {
  return nanoid();
}

/** Generate completion code (8 chars, uppercase alphanumeric, easy to read) */
const completionCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateCode = customAlphabet(completionCodeAlphabet, 8);

export function generateCompletionCode(): string {
  return generateCode();
}
