import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';

export default async function AdminInventoryPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const inventory = db.prepare(`
    SELECT 
      i.*,
      pv.title as variant_title,
      pv.sku,
      p.title as product_title,
      p.slug as product_slug
    FROM inventory i
    JOIN product_variants pv ON i.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    WHERE pv.active = 1
    ORDER BY (i.in_stock - i.reserved) ASC
  `).all() as any[];

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <Link href="/admin" style={{ color: '#0070f3', marginBottom: '8px', display: 'block' }}>
            ← Back to Admin
          </Link>
          <h1>Manage Inventory</h1>
        </div>
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>Product</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>Variant</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>SKU</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '500' }}>In Stock</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '500' }}>Reserved</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '500' }}>Available</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '500' }}>Low Stock Alert</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => {
              const available = item.in_stock - item.reserved;
              const isLow = item.low_stock_level && available <= item.low_stock_level;
              
              return (
                <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <Link href={`/products/${item.product_slug}`} style={{ color: '#0070f3' }}>
                      {item.product_title}
                    </Link>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{item.variant_title}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#666', fontFamily: 'monospace' }}>
                    {item.sku}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', textAlign: 'center' }}>{item.in_stock}</td>
                  <td style={{ padding: '12px', fontSize: '14px', textAlign: 'center' }}>{item.reserved}</td>
                  <td style={{ padding: '12px', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>
                    <span style={{ color: available > 0 ? '#0a0' : '#c00' }}>
                      {available}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {isLow && (
                      <span style={{
                        padding: '4px 8px',
                        background: '#fff3cd',
                        color: '#856404',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        ⚠️ Low Stock
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
