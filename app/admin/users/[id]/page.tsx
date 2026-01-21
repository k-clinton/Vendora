import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { getPermissions } from '@/lib/permissions';
import { AdminUserActions } from '@/components/admin-user-actions';

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const permissions = getPermissions(session.user.role!);
  if (!permissions.canManageUsers) {
    redirect('/admin');
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(params.id) as any;

  if (!user) {
    return (
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <h1>User Not Found</h1>
        <Link href="/admin/users" style={{ color: '#0070f3' }}>← Back to Users</Link>
      </div>
    );
  }

  // Get user's orders
  const orders = db.prepare(`
    SELECT * FROM orders 
    WHERE user_id = ? OR email = ?
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(user.id, user.email) as any[];

  // Get user's reviews
  const reviews = db.prepare(`
    SELECT r.*, p.title as product_name, p.slug as product_slug
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
    LIMIT 10
  `).all(user.id) as any[];

  // Calculate stats
  const totalOrders = orders.length;
  const totalSpent = orders
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  const createdDate = new Date(user.created_at * 1000);
  const disabledDate = user.disabled_at ? new Date(user.disabled_at * 1000) : null;

  const roleColors: Record<string, {bg: string, text: string}> = {
    ADMIN: { bg: '#dbeafe', text: '#1e40af' },
    STAFF: { bg: '#e0e7ff', text: '#4338ca' },
    VIEWER: { bg: '#fef3c7', text: '#92400e' },
    CUSTOMER: { bg: '#f3f4f6', text: '#374151' },
  };
  const colors = roleColors[user.role] || { bg: '#f3f4f6', text: '#374151' };

  // Prevent modifying own account
  const isSelf = session.user.email === user.email;

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/admin/users" style={{ color: '#0070f3', fontSize: '14px', textDecoration: 'none' }}>
          ← Back to Users
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user.image ? (
            <img 
              src={user.image} 
              alt={user.name || 'User'} 
              style={{ width: '64px', height: '64px', borderRadius: '50%' }}
            />
          ) : (
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '600',
              color: '#6b7280'
            }}>
              {(user.name || user.email || '?')[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ marginBottom: '4px' }}>{user.name || 'No name'}</h1>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>{user.email}</p>
            <span style={{
              padding: '4px 12px',
              background: colors.bg,
              color: colors.text,
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
            }}>
              {user.role}
            </span>
          </div>
        </div>
        {user.disabled && (
          <span style={{
            padding: '8px 16px',
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: '600',
          }}>
            DISABLED
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column */}
        <div>
          {/* User Stats */}
          <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Statistics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Total Orders</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{totalOrders}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Total Spent</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                  ${(totalSpent / 100).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Avg Order</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>
                  ${(avgOrderValue / 100).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Order History</h2>
            {orders.length === 0 ? (
              <p style={{ color: '#666', fontSize: '14px' }}>No orders yet.</p>
            ) : (
              <div style={{ border: '1px solid #eee', borderRadius: '6px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Order ID</th>
                      <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Total</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const orderDate = new Date(order.created_at * 1000);
                      const statusColors: Record<string, {bg: string, text: string}> = {
                        COMPLETED: { bg: '#d1fae5', text: '#065f46' },
                        PENDING: { bg: '#fef3c7', text: '#92400e' },
                        CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
                      };
                      const statusColor = statusColors[order.status] || { bg: '#f3f4f6', text: '#374151' };

                      return (
                        <tr key={order.id} style={{ borderTop: '1px solid #eee' }}>
                          <td style={{ padding: '10px', fontSize: '13px', fontFamily: 'monospace' }}>
                            <Link 
                              href={`/admin/orders/${order.id}`}
                              style={{ color: '#0070f3', textDecoration: 'none' }}
                            >
                              #{order.id.slice(0, 8)}
                            </Link>
                          </td>
                          <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right', fontWeight: '600' }}>
                            ${(order.total / 100).toFixed(2)}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <span style={{
                              padding: '3px 8px',
                              background: statusColor.bg,
                              color: statusColor.text,
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '600',
                            }}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                            {orderDate.toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Recent Reviews</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map((review) => {
                  const reviewDate = new Date(review.created_at * 1000);
                  return (
                    <div key={review.id} style={{ 
                      padding: '12px', 
                      border: '1px solid #eee', 
                      borderRadius: '6px',
                      background: '#f9fafb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Link 
                          href={`/products/${review.product_slug}`}
                          style={{ 
                            fontSize: '14px', 
                            fontWeight: '500',
                            color: '#0070f3',
                            textDecoration: 'none'
                          }}
                        >
                          {review.product_name}
                        </Link>
                        <div style={{ color: '#f59e0b', fontSize: '14px' }}>
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </div>
                      </div>
                      <p style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                        {review.comment}
                      </p>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {reviewDate.toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions */}
        <div>
          {/* User Info */}
          <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>User Information</h3>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>User ID:</span>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '4px', wordBreak: 'break-all' }}>
                {user.id}
              </div>
            </div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>Joined:</span>
              <div style={{ marginTop: '4px' }}>{createdDate.toLocaleDateString()}</div>
            </div>
            {user.email_verified && (
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                <span style={{ color: '#10b981', fontWeight: '500' }}>✓ Email Verified</span>
              </div>
            )}
            {user.disabled && (
              <div style={{ 
                marginTop: '12px',
                padding: '12px',
                background: '#fee2e2',
                borderRadius: '6px',
                border: '1px solid #fca5a5'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#991b1b', marginBottom: '4px' }}>
                  Account Disabled
                </div>
                {user.disabled_reason && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {user.disabled_reason}
                  </div>
                )}
                {disabledDate && (
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    {disabledDate.toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {!isSelf && (
            <AdminUserActions 
              userId={user.id}
              userRole={user.role}
              userDisabled={!!user.disabled}
              canBanUsers={permissions.canBanUsers}
            />
          )}

          {isSelf && (
            <div style={{ 
              padding: '16px', 
              background: '#fef3c7', 
              border: '1px solid #fde68a',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#92400e'
            }}>
              ⚠️ You cannot modify your own account. Ask another admin for changes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
