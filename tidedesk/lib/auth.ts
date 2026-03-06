import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createHash, scrypt as _scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt);

async function verifyPassword(plainText: string, stored: string) {
  // supported formats:
  // - scrypt$$<saltHex>$<derivedKeyHex> (preferred)
  // - scrypt$<saltHex>$<derivedKeyHex>  (legacy)
  const parts = stored.split("$");
  if (parts.length !== 3 && parts.length !== 4) return false;

  const [scheme, maybeEmpty, saltMaybe, expectedMaybe] = parts;
  if (scheme !== "scrypt") return false;

  const salt = parts.length === 4 ? saltMaybe : maybeEmpty;
  const expectedHex = parts.length === 4 ? expectedMaybe : saltMaybe;
  if (!salt || !expectedHex) return false;

  const derived = (await scrypt(plainText, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessId: user.businessId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as unknown as Partial<{ role: UserRole; businessId: string; email?: string }>;
        if (u.role) token.role = u.role;
        if (u.businessId) token.businessId = u.businessId;
        if (u.email) token.email = u.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as UserRole;
        session.user.businessId = token.businessId as string;
        const user = (await prisma.user.findUnique({
          where: { id: token.sub ?? "" },
        })) as { avatarUrl?: string | null } | null;
        let avatarUrl = user?.avatarUrl ?? null;
        // On Vercel, /avatars/* paths point to ephemeral storage that doesn't persist
        if (avatarUrl?.startsWith("/avatars/") && process.env.VERCEL) {
          avatarUrl = null;
        }
        if (avatarUrl) {
          session.user.image = avatarUrl;
        } else if (token.email) {
          const email = String(token.email).trim().toLowerCase();
          const hash = createHash("md5").update(email).digest("hex");
          session.user.image = `https://www.gravatar.com/avatar/${hash}?d=identicon&s=80`;
        }
      }
      return session;
    },
  },
};

