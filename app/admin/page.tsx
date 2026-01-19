import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  // Get counts
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as any;
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;

  // Get recent orders
  const recentOrders = db.prepare(`
    SELECT * FROM orders 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all() as any[];

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto' }}>
      <h1 style={{ marginBottom: '32px' }}>Admin Dashboard</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Products</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>{productCount.count}</div>
        </div>
        <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Orders</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>{orderCount.count}</div>
        </div>
        <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Users</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3' }}>{userCount.count}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '16px' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link 
            href="/admin/products"
            style={{
              padding: '12px 24px',
              background: '#0070f3',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Manage Products
          </Link>
          <Link 
            href="/admin/inventory"
            style={{
              padding: '12px 24px',
              background: '#0070f3',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Manage Inventory
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <h2 style={{ marginBottom: '16px' }}>Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p style={{ color: '#666' }}>No orders yet.</p>
        ) : (
          <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>Order ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>Total</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const createdDate = new Date(order.created_at * 1000);
                  return (
                    <tr key={order.id} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>#{order.id.slice(0, 8)}</td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{order.email}</td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                        ${(order.total / 100).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: order.status === 'COMPLETED' ? '#e6f7e6' : '#fff3cd',
                          color: order.status === 'COMPLETED' ? '#0a0' : '#856404',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                        {createdDate.toLocaleDateString()}
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
