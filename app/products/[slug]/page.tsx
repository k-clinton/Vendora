import { dbHelpers } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { ProductDetailClient } from './client-page';
import { ProductReviews } from '@/components/product-reviews';

export default async function ProductDetail({ params }: { params: { slug: string } }) {
  const product = await dbHelpers.findProductBySlug(params.slug, {
    variants: { where: { active: true }, include: { inventory: true } }
  }) as any;
  
  if (!product) return <div>Not found</div>;
  
  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto' }}>
      <Link href="/products" style={{ color: '#0070f3', marginBottom: '20px', display: 'inline-block' }}>
        ← Back to Products
      </Link>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '20px' }}>
        <div>
          {product.thumbnail && (
            <Image 
              src={product.thumbnail} 
              alt={product.title}
              width={600}
              height={600}
              style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
            />
          )}
        </div>
        
        <div>
          <h1 style={{ marginBottom: '16px' }}>{product.title}</h1>
          <p style={{ color: '#666', marginBottom: '32px', lineHeight: '1.6' }}>{product.description}</p>
          
          <ProductDetailClient product={product} />
        </div>
      </div>

      {/* Reviews Section */}
      <ProductReviews productId={product.id} />
    </div>
  );
}
