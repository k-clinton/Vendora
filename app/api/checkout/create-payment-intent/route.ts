import { NextResponse } from "next/server";
import { dbHelpers } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { createReservation } from "@/app/api/_utils/reservations";

// Expected body: { items: [{ variantId, quantity }], email?: string, currency: string }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[Checkout] Request body:", body);

    const items: { variantId: string; quantity: number }[] = body.items ?? [];
    const currency: string = body.currency ?? "usd";
    if (!Array.isArray(items) || items.length === 0) {
      console.log("[Checkout] No items provided");
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    // Load variants from DB to ensure price and availability
    const variantIds = items.map((i) => i.variantId);
    console.log("[Checkout] Fetching variants:", variantIds);
    const variants = await dbHelpers.findProductVariants(variantIds, {
      inventory: true,
    });

    if (variants.length === 0) {
      console.log("[Checkout] No variants found for IDs:", variantIds);
      return NextResponse.json({ error: "Invalid items" }, { status: 400 });
    }

    const variantMap = new Map(variants.map((v: any) => [v.id, v]));

    let amount = 0;
    for (const item of items) {
      const v = variantMap.get(item.variantId);
      if (!v) {
        console.log("[Checkout] Variant not found:", item.variantId);
        return NextResponse.json({ error: "Invalid item" }, { status: 400 });
      }
      const available =
        (v.inventory?.in_stock ?? 0) - (v.inventory?.reserved ?? 0);
      if (available < item.quantity) {
        console.log(
          "[Checkout] Insufficient stock:",
          v.id,
          available,
          item.quantity,
        );
        return NextResponse.json(
          { error: "INSUFFICIENT_STOCK", variantId: v.id },
          { status: 409 },
        );
      }
      amount += v.price * item.quantity;
    }

    console.log("[Checkout] Creating PaymentIntent for amount:", amount);
    const pi = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });
    console.log("[Checkout] PaymentIntent created:", pi.id);

    // Create reservations per line item with TTL (e.g., 15 minutes)
    const ttlSeconds = 15 * 60;
    for (const item of items) {
      await createReservation({
        variantId: item.variantId,
        quantity: item.quantity,
        paymentIntentId: pi.id,
        ttlSeconds,
      });
    }

    return NextResponse.json({
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
    });
  } catch (error: any) {
    console.error("[Checkout] API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
