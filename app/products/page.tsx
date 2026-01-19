import Link from 'next/link';
import { dbHelpers } from '@/lib/db';
import { ProductSearch } from '@/components/product-search';
import { ProductCard } from '@/components/product-card';

export default async function ProductsPage() {
  const products = await dbHelpers.findProducts({
    active: true,
    include: { variants: { where: { active: true }, include: { inventory: true } } },
  }) as any[];
  
  // Sort by created_at desc
  products.sort((a, b) => b.created_at - a.created_at);
  
  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto' }}>
      <h1 style={{ marginBottom: '32px' }}>Products</h1>
      
      <ProductSearch />
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '24px' 
      }}>
        {products.map((p) => {
          return (
            <ProductCard key={p.id} product={p} />
          );
        })}
      </div>
    </div>
  );
}
