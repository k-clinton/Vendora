import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProductForm from '@/components/product-form';
import Link from 'next/link';
import { getPermissions } from '@/lib/permissions';

export default async function NewProductPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const permissions = getPermissions(session.user.role!);
  if (!permissions.canManageProducts) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '16px' }}>Access Denied</h1>
        <p>You do not have permission to create products.</p>
        <Link href="/admin" style={{ color: '#0070f3' }}>Return to Dashboard</Link>
      </div>
    );
  }

  // Fetch actual categories from DB to ensure valid IDs
  const categories = db.prepare('SELECT id, name FROM categories ORDER BY name ASC').all() as { id: string, name: string }[];

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/admin/products" style={{ color: '#0070f3', fontSize: '14px', textDecoration: 'none' }}>
          ← Back to Products
        </Link>
      </div>

      <h1 style={{ marginBottom: '32px', fontSize: '24px', fontWeight: 'bold' }}>Add New Product</h1>

      <ProductForm categories={categories} />
    </div>
  );
}
