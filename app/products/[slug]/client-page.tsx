'use client';

import Link from 'next/link';
import { RealtimeInventory } from '@/components/realtime-inventory';
import { useCart } from '@/components/cart-provider';
import { useState } from 'react';

export function ProductDetailClient({ 
  product 
}: { 
  product: any;
}) {
  const { addItem } = useCart();
  const [addedToCart, setAddedToCart] = useState<string | null>(null);

  const handleAddToCart = (v: any) => {
    const available = v.inventory ? v.inventory.in_stock - v.inventory.reserved : 0;
    
    addItem({
      variantId: v.id,
      productId: product.id,
      productTitle: product.title,
      variantTitle: v.title,
      price: v.price,
      currency: v.currency,
      quantity: 1,
      image: v.image || product.thumbnail,
      slug: product.slug,
      maxStock: available,
    });

    setAddedToCart(v.id);
    setTimeout(() => setAddedToCart(null), 2000);
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ marginBottom: '16px' }}>Available Options</h3>
      {product.variants.map((v: any) => {
        const available = v.inventory ? v.inventory.in_stock - v.inventory.reserved : 0;
        return (
          <div 
            key={v.id}
            style={{ 
              padding: '16px', 
              border: '1px solid #eee', 
              borderRadius: '8px', 
              marginBottom: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>{v.title}</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0070f3' }}>
                ${(v.price / 100).toFixed(2)} {v.currency.toUpperCase()}
              </div>
              <RealtimeInventory variantId={v.id} initialAvailable={available} />
            </div>
            
            {available > 0 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleAddToCart(v)}
                  style={{
                    padding: '10px 20px',
                    background: addedToCart === v.id ? '#0a0' : 'white',
                    color: addedToCart === v.id ? 'white' : '#0070f3',
                    border: '1px solid #0070f3',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  {addedToCart === v.id ? '✓ Added' : 'Add to Cart'}
                </button>
                <Link
                  href={`/checkout?items=${v.id}:1`}
                  style={{
                    padding: '10px 20px',
                    background: '#0070f3',
                    color: 'white',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}
                >
                  Buy Now
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
