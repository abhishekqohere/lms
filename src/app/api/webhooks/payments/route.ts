import crypto from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PaymentWebhookPayload = {
  eventId: string;
  type: "payment.succeeded" | "payment.failed" | "refund.created";
  orderId: string;
  userId: string;
  amountCents: number;
  currency?: string;
};

const processedEvents = new Set<string>();

function verifySignature(rawBody: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as PaymentWebhookPayload;
  const rawBody = JSON.stringify(body);

  const signature = request.headers.get("x-qedix-signature") ?? "";
  const secret = process.env.PAYMENT_WEBHOOK_SECRET ?? "";

  const trusted = secret
    ? verifySignature(rawBody, signature, secret)
    : true;

  if (!trusted) {
    return NextResponse.json(
      { success: false, error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  processedEvents.add(body.eventId);

  return NextResponse.json({
    success: true,
    data: {
      accepted: true,
      eventId: body.eventId,
      orderId: body.orderId,
      type: body.type,
      alreadyProcessed: processedEvents.has(body.eventId),
    },
  });
}
