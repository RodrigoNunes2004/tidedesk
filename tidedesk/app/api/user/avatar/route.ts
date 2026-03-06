import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 4 * 1024 * 1024; // 4MB (mobile-friendly; Vercel body limit ~4.5MB)

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("avatar") as File | null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing avatar file" }, { status: 400 });
  }

  const normalizedType = file.type.toLowerCase().replace(/\/x-/, "/");
  if (
    !ALLOWED_TYPES.includes(normalizedType) &&
    !file.type.startsWith("image/")
  ) {
    return NextResponse.json(
      { error: "Invalid file type. Use JPEG, PNG, or WebP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 4MB." },
      { status: 400 }
    );
  }

  const ext =
    normalizedType === "image/webp"
      ? "webp"
      : normalizedType === "image/png"
        ? "png"
        : "jpg";
  const pathname = `avatars/${session.user.id}.${ext}`;

  let avatarUrl: string;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(pathname, file, {
        access: "public",
        contentType: file.type,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      avatarUrl = blob.url;
    } catch (err) {
      console.error("Blob upload error:", err);
      return NextResponse.json(
        { error: "Failed to save avatar" },
        { status: 500 }
      );
    }
  } else {
    if (process.env.VERCEL) {
      return NextResponse.json(
        {
          error:
            "Avatar storage is not configured. Add BLOB_READ_WRITE_TOKEN in your Vercel project Storage settings.",
        },
        { status: 503 }
      );
    }
    const avatarsDir = path.join(process.cwd(), "public", "avatars");
    try {
      await mkdir(avatarsDir, { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(avatarsDir, `${session.user.id}.${ext}`), buffer);
      avatarUrl = `/avatars/${session.user.id}.${ext}`;
    } catch (err) {
      console.error("Avatar save error:", err);
      return NextResponse.json(
        { error: "Failed to save avatar" },
        { status: 500 }
      );
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- avatarUrl exists in schema; Prisma client types may be stale
    data: { avatarUrl } as any,
  });

  return NextResponse.json({ data: { avatarUrl } });
}
