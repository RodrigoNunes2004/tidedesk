import { randomBytes, scrypt as _scrypt } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt);

const PREFIX = "td_";
const SECRET_LENGTH = 32;

export function generateApiKey(): { raw: string; prefix: string } {
  const secret = randomBytes(SECRET_LENGTH).toString("hex");
  const raw = `${PREFIX}${secret}`;
  const prefix = raw.slice(0, 12);
  return { raw, prefix };
}

export async function hashApiKey(raw: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(raw, salt, 64)) as Buffer;
  return `scrypt$$${salt}$${derived.toString("hex")}`;
}

export async function verifyApiKey(raw: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 3 && parts.length !== 4) return false;
  const scheme = parts[0];
  if (scheme !== "scrypt") return false;
  const salt = parts.length === 4 ? parts[2] : parts[1];
  const expectedHex = parts.length === 4 ? parts[3] : parts[2];
  if (!salt || !expectedHex) return false;
  const derived = (await scrypt(raw, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  if (expected.length !== derived.length) return false;
  return derived.equals(expected);
}
