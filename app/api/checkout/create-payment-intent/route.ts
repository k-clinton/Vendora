import { NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { createReservation } from '@/app/api/_utils/reservations';

// Expected body: { items: [{ variantId, quantity }], email?: string, currency: string }
export async function POST(req: Request) {
  const body = await req.json();
  const items: { variantId: string; quantity: number }[] = body.items ?? [];
  const currency: string = body.currency ?? 'usd';
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'No items' }, { status: 400 });
  }

  // Load variants from DB to ensure price and availability
  const variantIds = items.map((i) => i.variantId);
  const variants = await dbHelpers.findProductVariants(variantIds, { inventory: true });
  const variantMap = new Map(variants.map((v: any) => [v.id, v]));

  let amount = 0;
  for (const item of items) {
    const v = variantMap.get(item.variantId);
    if (!v) return NextResponse.json({ error: 'Invalid item' }, { status: 400 });
    const available = (v.inventory?.in_stock ?? 0) - (v.inventory?.reserved ?? 0);
    if (available < item.quantity) return NextResponse.json({ error: 'INSUFFICIENT_STOCK', variantId: v.id }, { status: 409 });
    amount += v.price * item.quantity;
  }

  const pi = await stripe.paymentIntents.create({ amount, currency, automatic_payment_methods: { enabled: true } });

  // Create reservations per line item with TTL (e.g., 15 minutes)
  const ttlSeconds = 15 * 60;
  for (const item of items) {
    await createReservation({ variantId: item.variantId, quantity: item.quantity, paymentIntentId: pi.id, ttlSeconds });
  }

  return NextResponse.json({ clientSecret: pi.client_secret, paymentIntentId: pi.id });
}
