'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function ProductSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        style={{
          flex: 1,
          padding: '12px 16px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '16px',
        }}
      />
      <button
        type="submit"
        style={{
          padding: '12px 24px',
          background: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        Search
      </button>
    </form>
  );
}

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  });

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (inStockOnly) {
      params.set('inStock', 'true');
    } else {
      params.delete('inStock');
    }

    if (priceRange.min) {
      params.set('minPrice', priceRange.min);
    } else {
      params.delete('minPrice');
    }

    if (priceRange.max) {
      params.set('maxPrice', priceRange.max);
    } else {
      params.delete('maxPrice');
    }

    const query = searchParams.get('q');
    if (query) {
      router.push(`/products/search?${params.toString()}`);
    } else {
      router.push(`/products?${params.toString()}`);
    }
  };

  const clearFilters = () => {
    setInStockOnly(false);
    setPriceRange({ min: '', max: '' });
    const query = searchParams.get('q');
    if (query) {
      router.push(`/products/search?q=${query}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <div style={{
      padding: '20px',
      background: '#f5f5f5',
      borderRadius: '8px',
      marginBottom: '24px',
    }}>
      <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Filters</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          <span>In Stock Only</span>
        </label>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: '500', marginBottom: '8px' }}>Price Range</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
          <span>to</span>
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Enter price in cents (e.g., 1000 = $10.00)
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={applyFilters}
          style={{
            flex: 1,
            padding: '10px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          Apply Filters
        </button>
        <button
          onClick={clearFilters}
          style={{
            padding: '10px 16px',
            background: 'white',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
