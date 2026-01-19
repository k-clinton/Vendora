'use client';

import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description: string;
    slug: string;
    thumbnail: string | null;
    variants: any[]; // Using any[] for now to match the flexible structure, but ideally should be typed
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const v = product.variants[0];
  const available = v?.inventory ? v.inventory.in_stock - v.inventory.reserved : 0;

  return (
    <Link 
      href={`/products/${product.slug}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div style={{ 
        border: '1px solid #eee', 
        borderRadius: '8px', 
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
      >
        {product.thumbnail && (
          <Image 
            src={product.thumbnail} 
            alt={product.title}
            width={280}
            height={280}
            style={{ width: '100%', height: '280px', objectFit: 'cover' }}
          />
        )}
        
        <div style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>{product.title}</h3>
          <p style={{ 
            color: '#666', 
            fontSize: '14px', 
            marginBottom: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {product.description}
          </p>
          
          {v && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0070f3' }}>
                ${(v.price / 100).toFixed(2)}
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: available > 0 ? '#0a0' : '#c00' 
              }}>
                {available > 0 ? `${available} available` : 'Out of stock'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
