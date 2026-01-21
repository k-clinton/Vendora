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
    const status = formData.get('status') as string;

    if (!['PENDING', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const now = dateToTimestamp(new Date());
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(
      status,
      now,
      params.id
    );

    // Log activity
    await logActivity({
      userId: session.user.id!,
      action: 'UPDATE_ORDER_STATUS',
      entityType: 'order',
      entityId: params.id,
      details: `Changed status to ${status}`,
    });

    return NextResponse.redirect(new URL(`/admin/orders/${params.id}`, req.url));
  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
