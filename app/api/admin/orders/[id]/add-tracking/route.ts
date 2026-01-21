import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, dateToTimestamp } from '@/lib/db';
import { getPermissions, logActivity } from '@/lib/permissions';

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
    if (!permissions.canManageOrders) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const trackingNumber = formData.get('tracking_number') as string;

    if (!trackingNumber || trackingNumber.trim().length === 0) {
      return NextResponse.json({ error: 'Tracking number required' }, { status: 400 });
    }

    const now = dateToTimestamp(new Date());
    db.prepare('UPDATE orders SET tracking_number = ?, updated_at = ? WHERE id = ?').run(
      trackingNumber.trim(),
      now,
      params.id
    );

    // Log activity
    await logActivity({
      userId: session.user.id!,
      action: 'ADD_TRACKING',
      entityType: 'order',
      entityId: params.id,
      details: `Added tracking: ${trackingNumber}`,
    });

    return NextResponse.redirect(new URL(`/admin/orders/${params.id}`, req.url));
  } catch (error) {
    console.error('Add tracking error:', error);
    return NextResponse.json({ error: 'Failed to add tracking' }, { status: 500 });
  }
}
