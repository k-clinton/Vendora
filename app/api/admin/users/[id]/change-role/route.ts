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
      return NextResponse.json({ error: 'Forbidden - requires admin permissions' }, { status: 403 });
    }

    const formData = await req.formData();
    const role = formData.get('role') as string;

    if (!['CUSTOMER', 'VIEWER', 'STAFF', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Prevent changing own role
    const targetUser = db.prepare('SELECT email FROM users WHERE id = ?').get(params.id) as any;
    if (targetUser?.email === session.user.email) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    const now = dateToTimestamp(new Date());
    db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(
      role,
      now,
      params.id
    );

    // Log activity
    await logActivity({
      userId: session.user.id!,
      action: 'CHANGE_USER_ROLE',
      entityType: 'user',
      entityId: params.id,
      details: `Changed role to ${role}`,
    });

    return NextResponse.redirect(new URL(`/admin/users/${params.id}`, req.url));
  } catch (error) {
    console.error('Change role error:', error);
    return NextResponse.json({ error: 'Failed to change role' }, { status: 500 });
  }
}
