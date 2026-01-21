import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { getPermissions } from '@/lib/permissions';

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const permissions = getPermissions(session.user.role!);
  if (!permissions.canViewFinance) {
    redirect('/admin');
  }

  const period = searchParams.period || '30';
  const days = parseInt(period);
  const startTimestamp = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);

  // Get all transactions
  const transactions = db.prepare(`
    SELECT * FROM orders 
    WHERE created_at >= ?
    ORDER BY created_at DESC
  `).all(startTimestamp) as any[];

  // Calculate statistics
  const totalRevenue = transactions
    .filter(t => t.status === 'COMPLETED' && t.payment_status === 'succeeded')
    .reduce((sum, t) => sum + t.total, 0);

  const successfulTransactions = transactions.filter(t => t.payment_status === 'succeeded').length;
  const failedTransactions = transactions.filter(t => t.payment_status === 'failed').length;
  const pendingTransactions = transactions.filter(t => t.payment_status === 'pending').length;

  const refundedAmount = transactions
    .filter(t => t.refund_id)
    .reduce((sum, t) => sum + (t.refund_amount || 0), 0);
  const refundCount = transactions.filter(t => t.refund_id).length;

  // Group by payment status
  const byStatus = transactions.reduce((acc, t) => {
    const status = t.payment_status || 'pending';
    if (!acc[status]) {
      acc[status] = { count: 0, total: 0 };
    }
    acc[status].count++;
    acc[status].total += t.total;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Group by date for chart data
  const byDate: Record<string, { revenue: number; orders: number }> = {};
  transactions.forEach(t => {
    if (t.status === 'COMPLETED' && t.payment_status === 'succeeded') {
      const date = new Date(t.created_at * 1000).toLocaleDateString();
      if (!byDate[date]) {
        byDate[date] = { revenue: 0, orders: 0 };
      }
      byDate[date].revenue += t.total;
      byDate[date].orders++;
    }
  });

  const dateEntries = Object.entries(byDate).sort((a, b) => 
    new Date(a[0]).getTime() - new Date(b[0]).getTime()
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Link href="/admin" style={{ color: '#0070f3', fontSize: '14px', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ marginTop: '8px', marginBottom: '4px' }}>Finance & Payments</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            View transaction history and payment analytics
          </p>
        </div>
        {permissions.canExportData && (
          <Link
            href={`/api/admin/finance/export?period=${period}`}
            style={{
              padding: '10px 20px',
              background: '#10b981',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            📥 Export CSV
          </Link>
        )}
      </div>

      {/* Period Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: '7', label: 'Last 7 Days' },
          { key: '30', label: 'Last 30 Days' },
          { key: '90', label: 'Last 90 Days' },
          { key: '365', label: 'Last Year' },
        ].map((tab) => {
          const isActive = period === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/admin/finance?period=${tab.key}`}
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
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px', background: '#f0fdf4' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Total Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
            ${(totalRevenue / 100).toFixed(2)}
          </div>
        </div>
        <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Successful</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
            {successfulTransactions}
          </div>
        </div>
        <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Failed</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>
            {failedTransactions}
          </div>
        </div>
        <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Pending</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>
            {pendingTransactions}
          </div>
        </div>
      </div>

      {/* Refunds Summary */}
      {refundCount > 0 && (
        <div style={{ 
          padding: '20px', 
          border: '1px solid #fee', 
          borderRadius: '8px', 
          background: '#fef2f2',
          marginBottom: '32px'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#991b1b' }}>Refunds</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Total Refunded</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b' }}>
                ${(refundedAmount / 100).toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Refund Count</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b' }}>
                {refundCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Chart (Simple) */}
      {dateEntries.length > 0 && (
        <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '24px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Revenue Over Time</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px' }}>
            {dateEntries.map(([date, data]) => {
              const maxRevenue = Math.max(...dateEntries.map(e => e[1].revenue));
              const height = (data.revenue / maxRevenue) * 180;
              
              return (
                <div 
                  key={date}
                  style={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div 
                    style={{ 
                      width: '100%', 
                      background: '#0070f3',
                      borderRadius: '4px 4px 0 0',
                      minHeight: '2px',
                      height: `${height}px`,
                      position: 'relative'
                    }}
                    title={`${date}: $${(data.revenue / 100).toFixed(2)} (${data.orders} orders)`}
                  />
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#666', 
                    transform: 'rotate(-45deg)',
                    whiteSpace: 'nowrap',
                    marginTop: '20px'
                  }}>
                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            No transactions found for this period
          </p>
        ) : (
          <div style={{ border: '1px solid #eee', borderRadius: '6px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Order ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Customer</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>Payment Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>Order Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 50).map((transaction) => {
                  const date = new Date(transaction.created_at * 1000);
                  const paymentColors: Record<string, {bg: string, text: string}> = {
                    succeeded: { bg: '#d1fae5', text: '#065f46' },
                    pending: { bg: '#fef3c7', text: '#92400e' },
                    failed: { bg: '#fee2e2', text: '#991b1b' },
                  };
                  const paymentStatus = transaction.payment_status || 'pending';
                  const paymentColor = paymentColors[paymentStatus] || { bg: '#f3f4f6', text: '#374151' };

                  const statusColors: Record<string, {bg: string, text: string}> = {
                    COMPLETED: { bg: '#d1fae5', text: '#065f46' },
                    PENDING: { bg: '#fef3c7', text: '#92400e' },
                    CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
                  };
                  const statusColor = statusColors[transaction.status] || { bg: '#f3f4f6', text: '#374151' };

                  return (
                    <tr key={transaction.id} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', fontFamily: 'monospace' }}>
                        <Link 
                          href={`/admin/orders/${transaction.id}`}
                          style={{ color: '#0070f3', textDecoration: 'none' }}
                        >
                          #{transaction.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{transaction.email}</td>
                      <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', fontWeight: '600' }}>
                        ${(transaction.total / 100).toFixed(2)}
                        {transaction.refund_id && (
                          <span style={{ color: '#ef4444', fontSize: '11px', marginLeft: '4px' }}>
                            (Refunded)
                          </span>
                        )}
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
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          background: statusColor.bg,
                          color: statusColor.text,
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
