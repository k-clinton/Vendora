import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getPermissions } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = getPermissions(session.user.role!);
    if (!permissions.canExportData) {
      return NextResponse.json({ error: 'Forbidden - requires export permission' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30';
    const days = parseInt(period);
    const startTimestamp = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);

    // Get all transactions
    const transactions = db.prepare(`
      SELECT * FROM orders 
      WHERE created_at >= ?
      ORDER BY created_at DESC
    `).all(startTimestamp) as any[];

    // Generate CSV
    const headers = ['Date', 'Order ID', 'Customer Email', 'Amount (USD)', 'Currency', 'Payment Status', 'Order Status', 'Payment Intent ID', 'Refund ID', 'Refund Amount'];
    const rows = transactions.map(t => {
      const date = new Date(t.created_at * 1000);
      return [
        date.toISOString(),
        t.id,
        t.email,
        (t.total / 100).toFixed(2),
        t.currency,
        t.payment_status || 'pending',
        t.status,
        t.payment_intent_id || '',
        t.refund_id || '',
        t.refund_amount ? (t.refund_amount / 100).toFixed(2) : '',
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
