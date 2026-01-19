'use client';

import { useCart } from '@/components/cart-provider';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cart, removeItem, updateQuantity } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    if (cart.items.length === 0) return;
    
    // Format items for checkout URL
    const itemsParam = cart.items
      .map(item => `${item.variantId}:${item.quantity}`)
      .join(',');
    
    router.push(`/checkout?items=${itemsParam}`);
  };

  if (cart.items.length === 0) {
    return (
      <div style={{ maxWidth: '1200px', margin: '80px auto', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🛒</div>
        <h1 style={{ marginBottom: '16px' }}>Your cart is empty</h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>
          Add some products to get started!
        </p>
        <Link 
          href="/products"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#0070f3',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto' }}>
      <h1 style={{ marginBottom: '32px' }}>Shopping Cart</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
        {/* Cart Items */}
        <div>
          {cart.items.map((item) => (
            <div 
              key={item.variantId}
              style={{
                display: 'flex',
                gap: '20px',
                padding: '20px',
                border: '1px solid #eee',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              {item.image && (
                <Image 
                  src={item.image}
                  alt={item.productTitle}
                  width={100}
                  height={100}
                  style={{ borderRadius: '4px', objectFit: 'cover' }}
                />
              )}
              
              <div style={{ flex: 1 }}>
                <Link 
                  href={`/products/${item.slug}`}
                  style={{ 
                    fontWeight: '500', 
                    fontSize: '18px', 
                    color: '#000',
                    textDecoration: 'none',
                    display: 'block',
                    marginBottom: '4px'
                  }}
                >
                  {item.productTitle}
                </Link>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                  {item.variantTitle}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      style={{
                        padding: '8px 12px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '16px',
                      }}
                    >
                      −
                    </button>
                    <span style={{ padding: '0 16px', fontWeight: '500' }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      style={{
                        padding: '8px 12px',
                        border: 'none',
                        background: 'transparent',
                        cursor: item.quantity >= item.maxStock ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        opacity: item.quantity >= item.maxStock ? 0.5 : 1,
                      }}
                    >
                      +
                    </button>
                  </div>
                  
                  <button
                    onClick={() => removeItem(item.variantId)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      background: 'transparent',
                      color: '#c00',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0070f3' }}>
                  ${((item.price * item.quantity) / 100).toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  ${(item.price / 100).toFixed(2)} each
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <div style={{
            padding: '24px',
            border: '1px solid #eee',
            borderRadius: '8px',
            position: 'sticky',
            top: '20px',
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Order Summary</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>Subtotal</span>
                <span style={{ fontWeight: '500' }}>${(cart.total / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>Shipping</span>
                <span style={{ fontWeight: '500' }}>FREE</span>
              </div>
            </div>
            
            <div style={{
              borderTop: '1px solid #eee',
              paddingTop: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '18px', fontWeight: '500' }}>Total</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3' }}>
                  ${(cart.total / 100).toFixed(2)}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleCheckout}
              style={{
                width: '100%',
                padding: '14px',
                background: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Proceed to Checkout
            </button>
            
            <Link 
              href="/products"
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: '16px',
                color: '#0070f3',
                textDecoration: 'none',
              }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
