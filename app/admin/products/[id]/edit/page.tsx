import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProductForm from '@/components/product-form';
import Link from 'next/link';
import { getPermissions } from '@/lib/permissions';

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const permissions = getPermissions(session.user.role!);
  if (!permissions.canManageProducts) {
    redirect('/admin');
  }

  // Fetch product with variant and inventory
  // For MVP, we assume editing the "default" variant or the first one found.
  const product = db.prepare(`
    SELECT 
      p.id as product_id,
      p.title,
      p.description,
      p.thumbnail as image,
      p.category_id,
      pv.id as variant_id,
      pv.sku,
      pv.price,
      i.in_stock,
      i.low_stock_level
    FROM products p
    JOIN product_variants pv ON p.id = pv.product_id
    JOIN inventory i ON pv.id = i.variant_id
    WHERE p.id = ?
    LIMIT 1
  `).get(params.id) as any;

  if (!product) {
    return (
        <div style={{ padding: '40px' }}>
            <h1>Product Not Found</h1>
            <Link href="/admin/products">Back to Products</Link>
        </div>
    );
  }

  // Fetch categories for the dropdown
  const categories = db.prepare('SELECT id, name FROM categories ORDER BY name ASC').all() as { id: string, name: string }[];

  // Format data for the form
  const initialData = {
    id: product.product_id,
    title: product.title,
    description: product.description || '',
    price: (product.price / 100).toFixed(2), // Convert cents to dollars
    sku: product.sku,
    categoryId: product.category_id || '',
    image: product.image || '',
    initialStock: product.in_stock,
    notifyLowStock: !!product.low_stock_level, // approximate boolean
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/admin/products" style={{ color: '#0070f3', fontSize: '14px', textDecoration: 'none' }}>
          ← Back to Products
        </Link>
      </div>

      <h1 style={{ marginBottom: '32px', fontSize: '24px', fontWeight: 'bold' }}>Edit Product</h1>

      <ProductForm categories={categories} initialData={initialData} isEdit={true} />
    </div>
  );
}
