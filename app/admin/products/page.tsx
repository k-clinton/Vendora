import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';

export default async function AdminProductsPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const products = db.prepare(`
    SELECT p.*, COUNT(DISTINCT pv.id) as variant_count
    FROM products p
    LEFT JOIN product_variants pv ON p.id = pv.product_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all() as any[];

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <Link href="/admin" style={{ color: '#0070f3', marginBottom: '8px', display: 'block' }}>
            ← Back to Admin
          </Link>
          <h1>Manage Products</h1>
        </div>
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>Title</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>Slug</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '500' }}>Variants</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '500' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>{product.title}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{product.slug}</td>
                <td style={{ padding: '12px', fontSize: '14px', textAlign: 'center' }}>{product.variant_count}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    background: product.active ? '#e6f7e6' : '#fee',
                    color: product.active ? '#0a0' : '#c00',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}>
                    {product.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  <Link href={`/products/${product.slug}`} style={{ color: '#0070f3', marginRight: '12px' }}>
                    View
                  </Link>
                  <Link href={`/admin/products/${product.id}/inventory`} style={{ color: '#0070f3' }}>
                    Inventory
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
