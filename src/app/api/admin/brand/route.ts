import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { del } from "@vercel/blob";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { BRAND_KEY_PREFIX, isBrandSlot, isBrandUrl } from "@/lib/brand";

const putSchema = z.object({ slot: z.string(), url: z.string().max(500) });
const deleteSchema = z.object({ slot: z.string() });

async function requireAdmin() {
  const session = await auth();
  return session?.user && isAdminEmail(session.user.email) ? session.user : null;
}

async function removeOldBlob(url?: string) {
  if (!url || !isBrandUrl(url)) return;
  try {
    await del(url);
  } catch {
    // orphaned file is harmless; don't fail the request
  }
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const parsed = putSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isBrandSlot(parsed.data.slot) || !isBrandUrl(parsed.data.url)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { slot, url } = parsed.data;
  const key = BRAND_KEY_PREFIX + slot;
  const previous = await prisma.appSetting.findUnique({ where: { key } });

  await prisma.appSetting.upsert({
    where: { key },
    update: { value: url },
    create: { key, value: url },
  });
  if (previous && previous.value !== url) await removeOldBlob(previous.value);

  // expire: 0 = a próxima leitura já busca o valor novo (o admin vê a mudança na hora).
  revalidateTag("brand", { expire: 0 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isBrandSlot(parsed.data.slot)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const key = BRAND_KEY_PREFIX + parsed.data.slot;
  const previous = await prisma.appSetting.findUnique({ where: { key } });
  if (previous) {
    await prisma.appSetting.delete({ where: { key } });
    await removeOldBlob(previous.value);
  }

  // expire: 0 = a próxima leitura já busca o valor novo (o admin vê a mudança na hora).
  revalidateTag("brand", { expire: 0 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
