'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductSearch, ProductFilters } from '@/components/product-search';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      const res = await fetch(`/api/products/search?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setLoading(false);
    };

    fetchResults();
  }, [searchParams]);

  const query = searchParams.get('q');

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto' }}>
      <h1 style={{ marginBottom: '8px' }}>
        {query ? `Search Results for "${query}"` : 'All Products'}
      </h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        {loading ? 'Searching...' : `${products.length} products found`}
      </p>

      <ProductSearch />
      
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
        <ProductFilters />
        
        <div>
          {loading ? (
            <p>Loading...</p>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ fontSize: '18px', color: '#666', marginBottom: '16px' }}>
                No products found
              </p>
              <Link href="/products" style={{ color: '#0070f3' }}>
                View all products
              </Link>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
              gap: '24px' 
            }}>
              {products.map((p) => {
                const v = p.variants[0];
                const available = v?.inventory ? v.inventory.in_stock - v.inventory.reserved : 0;
                
                return (
                  <Link 
                    key={p.id} 
                    href={`/products/${p.slug}`}
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
                      {p.thumbnail && (
                        <Image 
                          src={p.thumbnail} 
                          alt={p.title}
                          width={250}
                          height={250}
                          style={{ width: '100%', height: '250px', objectFit: 'cover' }}
                        />
                      )}
                      
                      <div style={{ padding: '16px' }}>
                        <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>{p.title}</h3>
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
                          {p.description}
                        </p>
                        
                        {v && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0070f3' }}>
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
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
