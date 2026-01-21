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

    const now = dateToTimestamp(new Date());
    db.prepare(`
      UPDATE users 
      SET disabled = 0, disabled_reason = NULL, disabled_at = NULL, updated_at = ?
      WHERE id = ?
    `).run(
      now,
      params.id
    );

    // Log activity
    await logActivity({
      userId: session.user.id!,
      action: 'ENABLE_USER',
      entityType: 'user',
      entityId: params.id,
      details: 'User account enabled',
    });

    return NextResponse.redirect(new URL(`/admin/users/${params.id}`, req.url));
  } catch (error) {
    console.error('Enable user error:', error);
    return NextResponse.json({ error: 'Failed to enable user' }, { status: 500 });
  }
}
