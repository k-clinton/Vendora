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
    if (!permissions.canBanUsers) {
      return NextResponse.json({ error: 'Forbidden - requires ban permission' }, { status: 403 });
    }

    const formData = await req.formData();
    const reason = formData.get('reason') as string || 'Disabled by admin';

    // Prevent disabling own account
    const targetUser = db.prepare('SELECT email FROM users WHERE id = ?').get(params.id) as any;
    if (targetUser?.email === session.user.email) {
      return NextResponse.json({ error: 'Cannot disable your own account' }, { status: 400 });
    }

    const now = dateToTimestamp(new Date());
    db.prepare(`
      UPDATE users 
      SET disabled = 1, disabled_reason = ?, disabled_at = ?, updated_at = ?
      WHERE id = ?
    `).run(
      reason,
      now,
      now,
      params.id
    );

    // Log activity
    await logActivity({
      userId: session.user.id!,
      action: 'DISABLE_USER',
      entityType: 'user',
      entityId: params.id,
      details: reason,
    });

    return NextResponse.redirect(new URL(`/admin/users/${params.id}`, req.url));
  } catch (error) {
    console.error('Disable user error:', error);
    return NextResponse.json({ error: 'Failed to disable user' }, { status: 500 });
  }
}
