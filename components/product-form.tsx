'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

interface ProductData {
  title: string;
  description: string;
  price: string | number;
  sku: string;
  categoryId: string;
  image: string;
  initialStock: string | number;
  notifyLowStock: boolean;
  id?: string; // Optional for new products
}

interface ProductFormProps {
  categories: Category[];
  initialData?: ProductData;
  isEdit?: boolean;
}

export default function ProductForm({ categories, initialData, isEdit }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price?.toString() || '',
    sku: initialData?.sku || '',
    categoryId: initialData?.categoryId || '',
    image: initialData?.image || '',
    initialStock: initialData?.initialStock?.toString() || '10',
    notifyLowStock: initialData?.notifyLowStock ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEdit ? `/api/admin/products/${initialData?.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} product`);
      }

      // Success
      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {error && (
        <div style={{ 
          padding: '12px', 
          background: '#fee2e2', 
          color: '#991b1b', 
          borderRadius: '6px', 
          border: '1px solid #fca5a5'
        }}>
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div style={{ border: '1px solid #eee', padding: '24px', borderRadius: '8px', background: '#fff' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: '600' }}>Basic Information</h2>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Product Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="e.g. Wireless Headphones"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="Product details..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Price (USD)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              placeholder="0.00"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Category</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
              <option value="uncategorized">Uncategorized</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory & Variants */}
      <div style={{ border: '1px solid #eee', padding: '24px', borderRadius: '8px', background: '#fff' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: '600' }}>Inventory & Details</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>SKU (Stock Keeping Unit)</label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              placeholder="e.g. HEAD-001"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Initial Stock</label>
            <input
              type="number"
              name="initialStock"
              value={formData.initialStock}
              onChange={handleChange}
              required
              min="0"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Image URL</label>
          <input
            type="url"
            name="image"
            value={formData.image}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="https://example.com/image.jpg"
          />
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Paste a direct link to an image.
          </p>
        </div>

        <div>
           <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
             <input
               type="checkbox"
               name="notifyLowStock"
               checked={formData.notifyLowStock}
               onChange={handleChange}
             />
             Notify when stock is low (below 10)
           </label>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
        <Link 
          href="/admin/products"
          style={{ 
            padding: '12px 24px', 
            borderRadius: '6px', 
            border: '1px solid #ddd',
            color: '#333',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          style={{ 
            padding: '12px 24px', 
            borderRadius: '6px', 
            background: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
        </button>
      </div>
    </form>
  );
}
