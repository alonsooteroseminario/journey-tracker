import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/email/resend";
import { sendEmail } from "@/lib/email/send";
import { PromptPackEmail } from "@/lib/email/templates/prompt-pack";

/**
 * POST /api/email-subscribe
 *
 * Public on purpose: this is the only way a visitor who is not ready to create
 * an account can be reached again. Until this existed the whole funnel was
 * Instagram to sign-up, and everyone who hesitated was lost.
 *
 * Prisma is the source of truth. The Resend sync is best-effort so a missing
 * or wrong RESEND_AUDIENCE_ID loses a contact from the broadcast list, never
 * the subscriber itself.
 */

/** Deliberately permissive. Rejecting a real address costs more than storing a junk one. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const str = (v: unknown, max = 200) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = str(body.email, 320)?.toLowerCase();
  if (!email || !EMAIL.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const data = {
    source: str(body.source, 40) ?? "landing",
    utmSource: str(body.utmSource, 80),
    utmMedium: str(body.utmMedium, 80),
    utmCampaign: str(body.utmCampaign, 80),
    utmContent: str(body.utmContent, 80),
    referrer: str(body.referrer, 500),
  };

  let subscriber;
  try {
    subscriber = await prisma.emailSubscriber.upsert({
      where: { email },
      // Re-submitting keeps the first attribution: the post that actually
      // earned the address, not the last page they happened to be on.
      update: {},
      create: { email, ...data },
    });
  } catch (error) {
    console.error("email-subscribe: database write failed", error);
    return NextResponse.json({ error: "Could not save that, try again" }, { status: 500 });
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (audienceId && !subscriber.syncedToESP) {
    try {
      await resend.contacts.create({ email, audienceId, unsubscribed: false });
      await prisma.emailSubscriber.update({
        where: { email },
        data: { syncedToESP: true },
      });
    } catch (error) {
      // The address is already stored; a failed broadcast-list sync is
      // recoverable by replaying rows where syncedToESP is false.
      console.warn("email-subscribe: Resend sync failed, row kept", error);
    }
  }

  // Best-effort. The pack is also readable at /prompt-pack, so a failed send
  // never means the visitor gave an address and got nothing.
  const sent = await sendEmail({
    to: email,
    subject: "Seven prompts worth keeping",
    react: PromptPackEmail(),
  }).catch(() => ({ success: false }));

  return NextResponse.json({ ok: true, emailed: sent.success });
}
