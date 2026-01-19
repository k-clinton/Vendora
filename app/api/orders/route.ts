import { NextResponse } from 'next/server';
import { dbHelpers, db, generateId, dateToTimestamp } from '@/lib/db';
import { auth } from '@/lib/auth';

// Get orders for the current user
export async function GET() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const query = db.prepare(`
    SELECT o.*, 
      json_group_array(
        json_object(
          'id', oi.id,
          'variant_id', oi.variant_id,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'currency', oi.currency
        )
      ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.email = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `);

  const orders = query.all(session.user.email);

  return NextResponse.json({ orders });
}

// Create an order (called after successful payment)
export async function POST(req: Request) {
  const body = await req.json();
  const { paymentIntentId, email, items } = body;

  if (!paymentIntentId || !email || !items) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const result = dbHelpers.transaction(async () => {
      // Check if order already exists
      const existing = db.prepare('SELECT id FROM orders WHERE payment_intent_id = ?').get(paymentIntentId);
      if (existing) {
        return existing;
      }

      // Calculate total
      const variantIds = items.map((i: any) => i.variantId);
      const variants = await dbHelpers.findProductVariants(variantIds, {});
      const variantMap = new Map(variants.map((v: any) => [v.id, v]));

      let total = 0;
      for (const item of items) {
        const variant = variantMap.get(item.variantId);
        if (variant) {
          total += variant.price * item.quantity;
        }
      }

      const orderId = generateId();
      const now = dateToTimestamp(new Date());

      // Create order
      db.prepare(`
        INSERT INTO orders (id, email, status, total, currency, payment_intent_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(orderId, email, 'COMPLETED', total, 'usd', paymentIntentId, now, now);

      // Create order items
      for (const item of items) {
        const variant = variantMap.get(item.variantId);
        if (variant) {
          const itemId = generateId();
          db.prepare(`
            INSERT INTO order_items (id, order_id, variant_id, quantity, unit_price, currency)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(itemId, orderId, item.variantId, item.quantity, variant.price, variant.currency);
        }
      }

      return { id: orderId };
    });

    return NextResponse.json({ order: result });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
