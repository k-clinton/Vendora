import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, dateToTimestamp } from '@/lib/db';
import { getPermissions, logActivity } from '@/lib/permissions';
import { stripe } from '@/lib/stripe';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = getPermissions(session.user.role!);
    if (!permissions.canRefundOrders) {
      return NextResponse.json({ error: 'Forbidden - requires refund permission' }, { status: 403 });
    }

    const formData = await req.formData();
    const amount = parseInt(formData.get('amount') as string);
    const reason = formData.get('reason') as string || 'Requested by admin';

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(params.id) as any;
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.refund_id) {
      return NextResponse.json({ error: 'Order already refunded' }, { status: 400 });
    }

    if (!order.payment_intent_id) {
      return NextResponse.json({ error: 'No payment intent found' }, { status: 400 });
    }

    if (amount <= 0 || amount > order.total) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 });
    }

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: order.payment_intent_id,
      amount: amount,
      reason: 'requested_by_customer',
    });

    // Update order
    const now = dateToTimestamp(new Date());
    db.prepare(`
      UPDATE orders 
      SET refund_id = ?, refund_amount = ?, refund_reason = ?, refunded_at = ?, 
          status = 'CANCELLED', updated_at = ?
      WHERE id = ?
    `).run(
      refund.id,
      amount,
      reason,
      now,
      now,
      params.id
    );

    // Log activity
    await logActivity({
      userId: session.user.id!,
      action: 'REFUND_ORDER',
      entityType: 'order',
      entityId: params.id,
      details: `Refunded $${(amount / 100).toFixed(2)}: ${reason}`,
    });

    return NextResponse.redirect(new URL(`/admin/orders/${params.id}`, req.url));
  } catch (error: any) {
    console.error('Refund error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process refund' 
    }, { status: 500 });
  }
}
