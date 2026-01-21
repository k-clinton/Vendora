import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, dateToTimestamp } from '@/lib/db';
import { getPermissions, logActivity } from '@/lib/permissions';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = getPermissions(session.user.role!);
    if (!permissions.canManageSettings) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const storeName = formData.get('store_name') as string;
    const storeLogo = formData.get('store_logo') as string;
    const currency = formData.get('currency') as string;
    const taxRate = parseFloat(formData.get('tax_rate') as string);
    const lowStockThreshold = parseInt(formData.get('low_stock_threshold') as string);

    if (!storeName || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (taxRate < 0 || taxRate > 100) {
      return NextResponse.json({ error: 'Invalid tax rate' }, { status: 400 });
    }

    if (lowStockThreshold < 0) {
      return NextResponse.json({ error: 'Invalid low stock threshold' }, { status: 400 });
    }

    const now = dateToTimestamp(new Date());
    
    // Check if settings exist
    const existing = db.prepare('SELECT id FROM store_settings LIMIT 1').get() as any;
    
    if (existing) {
      // Update existing settings
      db.prepare(`
        UPDATE store_settings 
        SET store_name = ?, store_logo = ?, currency = ?, tax_rate = ?, 
            low_stock_threshold = ?, updated_at = ?
        WHERE id = ?
      `).run(
        storeName,
        storeLogo || null,
        currency,
        taxRate,
        lowStockThreshold,
        now,
        existing.id
      );
    }

    // Log activity
    await logActivity({
      userId: session.user.id!,
      action: 'UPDATE_SETTINGS',
      entityType: 'settings',
      entityId: existing?.id || 'default',
      details: 'Updated store settings',
    });

    return NextResponse.redirect(new URL('/admin/settings?success=true', req.url));
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
