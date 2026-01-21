import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { getPermissions } from '@/lib/permissions';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const permissions = getPermissions(session.user.role!);
  if (!permissions.canManageOrders) {
    redirect('/admin');
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(params.id) as any;

  if (!order) {
    return (
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <h1>Order Not Found</h1>
        <Link href="/admin/orders" style={{ color: '#0070f3' }}>← Back to Orders</Link>
      </div>
    );
  }

  // Get order items with product details
  const orderItems = db.prepare(`
    SELECT 
      oi.*,
      pv.sku,
      pv.attributes,
      p.title as product_name,
      p.slug as product_slug
    FROM order_items oi
    JOIN product_variants pv ON oi.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    WHERE oi.order_id = ?
  `).all(order.id) as any[];

  // Get shipping address
  const shippingAddress = db.prepare('SELECT * FROM shipping_addresses WHERE order_id = ?').get(order.id) as any;

  const createdDate = new Date(order.created_at * 1000);
  const updatedDate = new Date(order.updated_at * 1000);

  const statusColors: Record<string, {bg: string, text: string}> = {
    COMPLETED: { bg: '#d1fae5', text: '#065f46' },
    PENDING: { bg: '#fef3c7', text: '#92400e' },
    CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
  };
  const colors = statusColors[order.status] || { bg: '#f3f4f6', text: '#374151' };

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/admin/orders" style={{ color: '#0070f3', fontSize: '14px', textDecoration: 'none' }}>
          ← Back to Orders
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Order #{order.id.slice(0, 8)}</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Created: {createdDate.toLocaleString()} • Updated: {updatedDate.toLocaleString()}
          </p>
        </div>
        <span style={{
          padding: '8px 16px',
          background: colors.bg,
          color: colors.text,
          borderRadius: '16px',
          fontSize: '14px',
          fontWeight: '600',
          textTransform: 'uppercase',
        }}>
          {order.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column - Order Details */}
        <div>
          {/* Order Items */}
          <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Order Items</h2>
            <div style={{ border: '1px solid #eee', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Product</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>SKU</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Price</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>Qty</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item) => {
                    const attrs = item.attributes ? JSON.parse(item.attributes) : {};
                    const attrStr = Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ');
                    
                    return (
                      <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.product_name}</div>
                          {attrStr && <div style={{ fontSize: '12px', color: '#666' }}>{attrStr}</div>}
                        </td>
                        <td style={{ padding: '10px', fontSize: '13px', fontFamily: 'monospace' }}>{item.sku}</td>
                        <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right' }}>
                          ${(item.price / 100).toFixed(2)}
                        </td>
                        <td style={{ padding: '10px', fontSize: '13px', textAlign: 'center', fontWeight: '600' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right', fontWeight: '600' }}>
                          ${((item.price * item.quantity) / 100).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: '2px solid #ddd', background: '#f9fafb' }}>
                    <td colSpan={4} style={{ padding: '12px', fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>
                      Total:
                    </td>
                    <td style={{ padding: '12px', fontSize: '16px', fontWeight: '700', textAlign: 'right' }}>
                      ${(order.total / 100).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Shipping Address */}
          {shippingAddress && (
            <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Shipping Address</h2>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>{shippingAddress.name}</div>
                <div>{shippingAddress.line1}</div>
                {shippingAddress.line2 && <div>{shippingAddress.line2}</div>}
                <div>
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal}
                </div>
                <div>{shippingAddress.country}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions & Info */}
        <div>
          {/* Customer Info */}
          <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Customer</h3>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {order.email}
            </div>
            {order.user_id && (
              <Link 
                href={`/admin/users/${order.user_id}`}
                style={{ 
                  display: 'inline-block',
                  marginTop: '12px',
                  color: '#0070f3', 
                  fontSize: '13px',
                  textDecoration: 'none'
                }}
              >
                View customer profile →
              </Link>
            )}
          </div>

          {/* Payment Info */}
          <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Payment</h3>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>Status:</span>{' '}
              <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                {order.payment_status || 'pending'}
              </span>
            </div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>Amount:</span>{' '}
              <span style={{ fontWeight: '600' }}>${(order.total / 100).toFixed(2)}</span>
            </div>
            {order.payment_intent_id && (
              <div style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                PI: {order.payment_intent_id}
              </div>
            )}
            {order.refund_id && (
              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                background: '#fee2e2', 
                borderRadius: '6px',
                border: '1px solid #fca5a5'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#991b1b', marginBottom: '4px' }}>
                  Refunded
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Amount: ${(order.refund_amount / 100).toFixed(2)}
                </div>
                {order.refund_reason && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Reason: {order.refund_reason}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tracking Info */}
          {order.tracking_number && (
            <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Tracking</h3>
              <div style={{ 
                fontSize: '14px', 
                fontFamily: 'monospace',
                padding: '10px',
                background: '#f5f5f5',
                borderRadius: '4px',
                wordBreak: 'break-all'
              }}>
                {order.tracking_number}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Actions</h3>
            
            <form method="POST" action={`/api/admin/orders/${order.id}/update-status`} style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>
                Update Status
              </label>
              <select 
                name="status"
                defaultValue={order.status}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '8px',
                }}
              >
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Update Status
              </button>
            </form>

            {!order.tracking_number && (
              <form method="POST" action={`/api/admin/orders/${order.id}/add-tracking`} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>
                  Add Tracking Number
                </label>
                <input
                  type="text"
                  name="tracking_number"
                  placeholder="Enter tracking number"
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    marginBottom: '8px',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Add Tracking
                </button>
              </form>
            )}

            {permissions.canRefundOrders && !order.refund_id && order.payment_status === 'succeeded' && (
              <form method="POST" action={`/api/admin/orders/${order.id}/refund`} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>
                  Refund Order
                </label>
                <input
                  type="number"
                  name="amount"
                  placeholder="Amount (cents)"
                  defaultValue={order.total}
                  min="1"
                  max={order.total}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    marginBottom: '8px',
                  }}
                />
                <textarea
                  name="reason"
                  placeholder="Refund reason (optional)"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    marginBottom: '8px',
                    resize: 'vertical',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    if (!confirm('Are you sure you want to refund this order?')) {
                      e.preventDefault();
                    }
                  }}
                >
                  Issue Refund
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
