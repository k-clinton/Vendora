import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { getPermissions } from '@/lib/permissions';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string };
}) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const permissions = getPermissions(session.user.role!);
  if (!permissions.canManageOrders) {
    redirect('/admin');
  }

  const statusFilter = searchParams.status || 'all';
  const searchQuery = searchParams.search || '';

  // Build query
  let query = 'SELECT * FROM orders WHERE 1=1';
  const params: any[] = [];

  if (statusFilter !== 'all') {
    query += ' AND status = ?';
    params.push(statusFilter.toUpperCase());
  }

  if (searchQuery) {
    query += ' AND (id LIKE ? OR email LIKE ?)';
    params.push(`%${searchQuery}%`, `%${searchQuery}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT 100';

  const orders = db.prepare(query).all(...params) as any[];

  // Get order counts by status
  const statusCounts = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(total) as total
    FROM orders
    GROUP BY status
  `).all() as any[];

  const countsByStatus: Record<string, { count: number; total: number }> = {};
  statusCounts.forEach((s) => {
    countsByStatus[s.status] = { count: s.count, total: s.total };
  });

  const allCount = statusCounts.reduce((sum, s) => sum + s.count, 0);

  return (
    <div style={{ maxWidth: '1400px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Link href="/admin" style={{ color: '#0070f3', fontSize: '14px', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ marginTop: '8px', marginBottom: '4px' }}>Order Management</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            View and manage all customer orders
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '1px solid #eee',
        paddingBottom: '8px'
      }}>
        {[
          { key: 'all', label: 'All', count: allCount },
          { key: 'pending', label: 'Pending', count: countsByStatus.PENDING?.count || 0 },
          { key: 'completed', label: 'Completed', count: countsByStatus.COMPLETED?.count || 0 },
          { key: 'cancelled', label: 'Cancelled', count: countsByStatus.CANCELLED?.count || 0 },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/admin/orders?status=${tab.key}`}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                background: isActive ? '#0070f3' : 'transparent',
                color: isActive ? 'white' : '#666',
                border: isActive ? 'none' : '1px solid #eee',
              }}
            >
              {tab.label} ({tab.count})
            </Link>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <form method="GET" style={{ display: 'flex', gap: '12px' }}>
          <input
            type="hidden"
            name="status"
            value={statusFilter}
          />
          <input
            type="text"
            name="search"
            placeholder="Search by order ID or email..."
            defaultValue={searchQuery}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 24px',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
          {searchQuery && (
            <Link
              href={`/admin/orders?status=${statusFilter}`}
              style={{
                padding: '10px 24px',
                background: '#f5f5f5',
                color: '#666',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div style={{ 
          padding: '60px 20px', 
          textAlign: 'center', 
          border: '1px solid #eee', 
          borderRadius: '8px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <h3 style={{ marginBottom: '8px' }}>No orders found</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Order ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>Payment</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const createdDate = new Date(order.created_at * 1000);
                const statusColors: Record<string, {bg: string, text: string}> = {
                  COMPLETED: { bg: '#d1fae5', text: '#065f46' },
                  PENDING: { bg: '#fef3c7', text: '#92400e' },
                  CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
                };
                const colors = statusColors[order.status] || { bg: '#f3f4f6', text: '#374151' };
                
                const paymentColors: Record<string, {bg: string, text: string}> = {
                  succeeded: { bg: '#d1fae5', text: '#065f46' },
                  pending: { bg: '#fef3c7', text: '#92400e' },
                  failed: { bg: '#fee2e2', text: '#991b1b' },
                };
                const paymentStatus = order.payment_status || 'pending';
                const paymentColor = paymentColors[paymentStatus] || { bg: '#f3f4f6', text: '#374151' };

                return (
                  <tr key={order.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontSize: '13px', fontFamily: 'monospace' }}>
                      <Link 
                        href={`/admin/orders/${order.id}`}
                        style={{ color: '#0070f3', textDecoration: 'none' }}
                      >
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{order.email}</td>
                    <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', fontWeight: '600' }}>
                      ${(order.total / 100).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        background: colors.bg,
                        color: colors.text,
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        background: paymentColor.bg,
                        color: paymentColor.text,
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                      }}>
                        {paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                      {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        style={{
                          padding: '6px 12px',
                          background: '#0070f3',
                          color: 'white',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {orders.length > 0 && (
        <div style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
          Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
