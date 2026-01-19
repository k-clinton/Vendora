import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/');
  }

  const query = db.prepare(`
    SELECT o.*
    FROM orders o
    WHERE o.email = ?
    ORDER BY o.created_at DESC
  `);

  const orders = query.all(session.user.email) as any[];

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto' }}>
      <h1 style={{ marginBottom: '32px' }}>My Orders</h1>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#666', marginBottom: '20px' }}>You haven't placed any orders yet.</p>
          <Link 
            href="/products"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#0070f3',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order) => {
            const createdDate = new Date(order.created_at * 1000);
            return (
              <div 
                key={order.id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Order #{order.id.slice(0, 8)}</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      {createdDate.toLocaleDateString()} at {createdDate.toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0070f3' }}>
                      ${(order.total / 100).toFixed(2)}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      marginTop: '4px',
                      padding: '4px 8px',
                      background: order.status === 'COMPLETED' ? '#e6f7e6' : '#fff3cd',
                      color: order.status === 'COMPLETED' ? '#0a0' : '#856404',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {order.status}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
