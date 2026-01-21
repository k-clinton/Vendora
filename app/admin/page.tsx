import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { getPermissions } from '@/lib/permissions';
import { RevenueChart, StatusChart } from '@/components/admin-charts';

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const permissions = getPermissions(session.user.role!);

  // Calculate date ranges
  const now = Math.floor(Date.now() / 1000);
  const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const weekStart = now - (7 * 24 * 60 * 60);
  const monthStart = now - (30 * 24 * 60 * 60);

  // Revenue analytics
  const revenueToday = db.prepare(`
    SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as count 
    FROM orders 
    WHERE status = 'COMPLETED' AND created_at >= ?
  `).get(todayStart) as any;

  const revenueWeek = db.prepare(`
    SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as count 
    FROM orders 
    WHERE status = 'COMPLETED' AND created_at >= ?
  `).get(weekStart) as any;

  const revenueMonth = db.prepare(`
    SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as count 
    FROM orders 
    WHERE status = 'COMPLETED' AND created_at >= ?
  `).get(monthStart) as any;

  // Order statistics
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
  const pendingOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders WHERE status = 'PENDING'
  `).get() as any;

  // Low stock alerts
  const lowStockSettings = db.prepare('SELECT low_stock_threshold FROM store_settings LIMIT 1').get() as any;
  const threshold = lowStockSettings?.low_stock_threshold || 10;
  
  const lowStockItems = db.prepare(`
    SELECT 
      pv.id,
      pv.sku,
      p.title as product_name,
      pv.attributes,
      i.in_stock,
      i.reserved
    FROM inventory i
    JOIN product_variants pv ON i.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    WHERE (i.in_stock - i.reserved) <= ?
    ORDER BY (i.in_stock - i.reserved) ASC
    LIMIT 10
  `).all(threshold) as any[];

  // Top selling products
  const topProducts = db.prepare(`
    SELECT 
      p.title as name,
      p.slug,
      SUM(oi.quantity) as total_sold,
      SUM(oi.unit_price * oi.quantity) as total_revenue
    FROM order_items oi
    JOIN product_variants pv ON oi.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'COMPLETED'
    GROUP BY p.id, p.title, p.slug
    ORDER BY total_sold DESC
    LIMIT 5
  `).all() as any[];

  // Recent orders
  const recentOrders = db.prepare(`
    SELECT * FROM orders 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all() as any[];

  // User statistics
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  const newUsersWeek = db.prepare(`
    SELECT COUNT(*) as count FROM users WHERE created_at >= ?
  `).get(weekStart) as any;

  // Chart Data: Status Distribution
  const statusDataRaw = db.prepare(`
    SELECT status as name, COUNT(*) as value
    FROM orders
    GROUP BY status
  `).all() as any[];
  // Normalize status data for chart
  const statusData = statusDataRaw.length > 0 ? statusDataRaw : [{ name: 'No Orders', value: 0 }];

  // Chart Data: Daily Revenue (Last 7 days)
  const revenueDataRaw = db.prepare(`
    SELECT 
      strftime('%Y-%m-%d', datetime(created_at, 'unixepoch')) as name,
      SUM(total) / 100 as total
    FROM orders
    WHERE status = 'COMPLETED'
    GROUP BY name
    ORDER BY name DESC
    LIMIT 7
  `).all() as any[];
  // Reverse to show oldest to newest and ensure array
  const revenueData = revenueDataRaw.length > 0 ? revenueDataRaw.reverse() : [];


  return (
    <div style={{ maxWidth: '1400px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Admin Dashboard</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Welcome back, {session.user.name} ({session.user.role})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {permissions.canManageProducts && (
            <Link href="/admin/products/new" style={{
              padding: '10px 20px',
              background: '#0070f3',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>+</span> Add Product
            </Link>
          )}
          {permissions.canManageProducts && (
            <Link href="/admin/products" style={{
              padding: '10px 20px',
              background: 'white',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              All Products
            </Link>
          )}
          {permissions.canManageOrders && (
            <Link href="/admin/orders" style={{
              padding: '10px 20px',
              background: 'white',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              Orders
            </Link>
          )}
          {permissions.canManageUsers && (
            <Link href="/admin/users" style={{
              padding: '10px 20px',
              background: 'white',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              Users
            </Link>
          )}
        </div>
      </div>

      {/* Revenue Stats */}
      {permissions.canViewFinance && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Revenue</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '8px', background: '#f9fafb' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Today</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3', marginBottom: '4px' }}>
                ${(revenueToday.revenue / 100).toFixed(2)}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>{revenueToday.count} orders</div>
            </div>
            <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '8px', background: '#f9fafb' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Last 7 Days</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3', marginBottom: '4px' }}>
                ${(revenueWeek.revenue / 100).toFixed(2)}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>{revenueWeek.count} orders</div>
            </div>
            <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '8px', background: '#f9fafb' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Last 30 Days</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3', marginBottom: '4px' }}>
                ${(revenueMonth.revenue / 100).toFixed(2)}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>{revenueMonth.count} orders</div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Total Orders</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{totalOrders.count}</div>
        </div>
        <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Pending Orders</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{pendingOrders.count}</div>
        </div>
        <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Low Stock Items</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{lowStockItems.length}</div>
        </div>
        <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Total Users</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
            {userCount.count}
            <span style={{ fontSize: '14px', color: '#10b981', marginLeft: '8px' }}>
              +{newUsersWeek.count} this week
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: '600' }}>Revenue Trend (Daily)</h2>
          {revenueData.length > 0 ? (
            <RevenueChart data={revenueData} />
          ) : (
             <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
               No revenue data available
             </div>
          )}
        </div>
        <div style={{ border: '1px solid #eee', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: '600' }}>Order Status Distribution</h2>
          <StatusChart data={statusData} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '40px' }}>
        {/* Low Stock Alerts */}
        {permissions.canManageInventory && lowStockItems.length > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#ef4444' }}>⚠️ Low Stock Alerts</h2>
            <div style={{ border: '1px solid #fee', borderRadius: '8px', overflow: 'hidden', background: '#fef2f2' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fecaca' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '500' }}>Product</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '500' }}>SKU</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '500' }}>Available</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item) => {
                    const available = item.in_stock - item.reserved;
                    return (
                      <tr key={item.id} style={{ borderTop: '1px solid #fee' }}>
                        <td style={{ padding: '10px', fontSize: '13px' }}>{item.product_name}</td>
                        <td style={{ padding: '10px', fontSize: '13px', fontFamily: 'monospace' }}>{item.sku}</td>
                        <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right', fontWeight: '600', color: available === 0 ? '#dc2626' : '#f59e0b' }}>
                          {available}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Selling Products */}
        {topProducts.length > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>🏆 Top Selling Products</h2>
            <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '500' }}>Product</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '500' }}>Sold</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '500' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, idx) => (
                    <tr key={product.slug} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: '10px', fontSize: '13px' }}>
                        <span style={{ marginRight: '8px', color: '#666' }}>{idx + 1}.</span>
                        {product.name}
                      </td>
                      <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right', fontWeight: '600' }}>
                        {product.total_sold}
                      </td>
                      <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>
                        ${(product.total_revenue / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      {permissions.canManageOrders && (
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p style={{ color: '#666', padding: '20px', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center' }}>
              No orders yet.
            </p>
          ) : (
            <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '500' }}>Order ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '500' }}>Customer</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '500' }}>Total</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '500' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '500' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const createdDate = new Date(order.created_at * 1000);
                    const statusColors: Record<string, {bg: string, text: string}> = {
                      COMPLETED: { bg: '#d1fae5', text: '#065f46' },
                      PENDING: { bg: '#fef3c7', text: '#92400e' },
                      CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
                    };
                    const colors = statusColors[order.status] || { bg: '#f3f4f6', text: '#374151' };
                    
                    return (
                      <tr key={order.id} style={{ borderTop: '1px solid #eee' }}>
                        <td style={{ padding: '12px', fontSize: '13px', fontFamily: 'monospace' }}>
                          <Link href={`/admin/orders/${order.id}`} style={{ color: '#0070f3', textDecoration: 'none' }}>
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
                            fontSize: '12px',
                            fontWeight: '500',
                          }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                          {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Link href="/admin/orders" style={{
            display: 'inline-block',
            marginTop: '16px',
            padding: '10px 20px',
            background: '#0070f3',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
          }}>
            View All Orders →
          </Link>
        </div>
      )}
    </div>
  );
}
