'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { CheckoutForm } from '@/components/checkout-form';
import { useSearchParams } from 'next/navigation';

// Load Stripe with validation
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<Stripe | null> | null = null;

if (stripePublishableKey && stripePublishableKey.startsWith('pk_')) {
  stripePromise = loadStripe(stripePublishableKey);
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stripeLoaded, setStripeLoaded] = useState(false);

  // Check if Stripe is configured
  useEffect(() => {
    if (!stripePromise) {
      setError('Stripe is not properly configured. Please contact support.');
      setLoading(false);
      return;
    }

    // Verify Stripe loads successfully
    stripePromise
      .then((stripe) => {
        if (!stripe) {
          setError('Failed to load payment system. Please contact support.');
          setLoading(false);
        } else {
          setStripeLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Stripe load error:', err);
        setError('Failed to initialize payment system. Please contact support.');
        setLoading(false);
      });
  }, []);

  // Memoize options to prevent re-initializing Stripe Elements on every render
  const options = useMemo(() => clientSecret ? {
    clientSecret,
    appearance: { theme: 'stripe' as const },
  } : undefined, [clientSecret]);

  useEffect(() => {
    let ignore = false;

    // Don't try to create payment intent if Stripe isn't loaded
    if (!stripeLoaded) {
      return;
    }

    const items = searchParams.get('items');
    if (!items) {
      if (!ignore) {
        setError('No items specified');
        setLoading(false);
      }
      return;
    }

    const parsedItems = items.split(',').map(item => {
      const [variantId, quantity] = item.split(':');
      return { variantId, quantity: parseInt(quantity) };
    });

    fetch('/api/checkout/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: parsedItems,
        currency: 'usd',
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (ignore) return;
        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
        }
        setLoading(false);
      })
      .catch(err => {
        if (ignore) return;
        console.error('Checkout init error:', err);
        setError('Failed to initialize checkout');
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [searchParams, stripeLoaded]);

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
        <h1 style={{ marginBottom: '16px' }}>Checkout Error</h1>
        <div style={{ 
          padding: '16px', 
          background: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <p style={{ color: '#c00', margin: 0 }}>{error}</p>
        </div>
        {error.includes('Stripe') && (
          <div style={{ 
            padding: '16px', 
            background: '#fef3cd', 
            border: '1px solid #f5d372',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p style={{ margin: 0, fontSize: '14px' }}>
              <strong>Note:</strong> This appears to be a configuration issue. 
              Please ensure your <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> environment 
              variable is set to a valid Stripe publishable key (starting with <code>pk_test_</code> 
              or <code>pk_live_</code>).
            </p>
          </div>
        )}
        <a href="/cart" style={{ 
          display: 'inline-block',
          padding: '12px 24px',
          background: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '6px',
          marginRight: '12px'
        }}>
          ← Back to Cart
        </a>
        <a href="/products" style={{ color: '#0070f3' }}>Browse Products</a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto' }}>
      <h1 style={{ marginBottom: '24px' }}>Checkout</h1>
      
      {clientSecret && options && (
        <Elements stripe={stripePromise} options={options} key={clientSecret}>
          <CheckoutForm />
        </Elements>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
