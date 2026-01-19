import { NextResponse } from "next/server";
import { Buffer } from "buffer";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import {
  captureAllReservations,
  releaseReservation,
} from "@/app/api/_utils/reservations";
import { dbHelpers } from "@/lib/db";
import { publishInventory } from "@/lib/realtime";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const buf = Buffer.from(await req.arrayBuffer());
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig as string,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as any;
      await captureAllReservations(pi.id);
      // publish updated inventory for affected variants
      const reservations = await dbHelpers.findReservations({
        paymentIntentId: pi.id,
      });
      for (const r of reservations as any[]) {
        const inv = await dbHelpers.findInventory(r.variant_id) as any;
        if (inv)
          await publishInventory(r.variant_id, inv.in_stock - inv.reserved);
      }
    }
    if (
      event.type === "payment_intent.canceled" ||
      event.type === "payment_intent.payment_failed"
    ) {
      const pi = event.data.object as any;
      await releaseReservation(pi.id);
      const reservations = await dbHelpers.findReservations({
        paymentIntentId: pi.id,
      });
      for (const r of reservations as any[]) {
        const inv = await dbHelpers.findInventory(r.variant_id) as any;
        if (inv)
          await publishInventory(r.variant_id, inv.in_stock - inv.reserved);
      }
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { received: true, error: (e as Error).message },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
