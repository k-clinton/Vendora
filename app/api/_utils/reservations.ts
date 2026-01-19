import { dbHelpers, db } from '@/lib/db';
import { addSeconds } from 'date-fns';

// Reserve stock for a variant for a limited time window.
export async function createReservation(params: {
  variantId: string;
  quantity: number;
  paymentIntentId: string;
  ttlSeconds: number;
}) {
  const { variantId, quantity, paymentIntentId, ttlSeconds } = params;

  return dbHelpers.transaction(() => {
    const inv = dbHelpers.findInventory(variantId) as any;
    if (!inv || inv.in_stock - inv.reserved < quantity) {
      throw new Error('INSUFFICIENT_STOCK');
    }

    dbHelpers.updateInventory(variantId, { reserved: quantity });

    const reservation = dbHelpers.createReservation({
      variantId,
      quantity,
      paymentIntentId,
      expiresAt: addSeconds(new Date(), ttlSeconds),
      status: 'ACTIVE',
    });

    return reservation;
  });
}

export async function captureReservation(paymentIntentId: string) {
  return dbHelpers.transaction(() => {
    const query = db.prepare('SELECT * FROM reservations WHERE payment_intent_id = ? LIMIT 1');
    const r = query.get(paymentIntentId) as any;
    if (!r) return null;
    if (r.status !== 'ACTIVE') return r;

    dbHelpers.updateInventory(r.variant_id, { reserved: -r.quantity, inStock: -r.quantity });
    
    const updateQuery = db.prepare('UPDATE reservations SET status = ? WHERE payment_intent_id = ?');
    updateQuery.run('CAPTURED', paymentIntentId);

    return { ...r, status: 'CAPTURED' };
  });
}

export async function captureAllReservations(paymentIntentId: string): Promise<number> {
  return dbHelpers.transaction(() => {
    const reservations = dbHelpers.findReservations({ paymentIntentId, status: 'ACTIVE' }) as any[];
    if (!reservations || !Array.isArray(reservations)) return 0;
    for (const r of reservations) {
      dbHelpers.updateInventory(r.variant_id, { reserved: -r.quantity, inStock: -r.quantity });
      dbHelpers.updateReservation(r.id, { status: 'CAPTURED' });
    }
    return reservations.length;
  });
}

export async function releaseReservation(paymentIntentId: string) {
  return dbHelpers.transaction(() => {
    const query = db.prepare('SELECT * FROM reservations WHERE payment_intent_id = ? LIMIT 1');
    const r = query.get(paymentIntentId) as any;
    if (!r) return null;
    if (r.status !== 'ACTIVE') return r;

    dbHelpers.updateInventory(r.variant_id, { reserved: -r.quantity });
    
    const updateQuery = db.prepare('UPDATE reservations SET status = ? WHERE payment_intent_id = ?');
    updateQuery.run('RELEASED', paymentIntentId);

    return { ...r, status: 'RELEASED' };
  });
}
