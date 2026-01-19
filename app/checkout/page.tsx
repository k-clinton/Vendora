'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CheckoutForm } from '@/components/checkout-form';
import { useSearchParams } from 'next/navigation';

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize options to prevent re-initializing Stripe Elements on every render
  const options = clientSecret ? {
    clientSecret,
    appearance: { theme: 'stripe' as const },
  } : undefined;

  useEffect(() => {
    const items = searchParams.get('items');
    if (!items) {
      setError('No items specified');
      setLoading(false);
      return;
    }

    // Parse items from query param (format: variantId:quantity,variantId:quantity)
    const parsedItems = items.split(',').map(item => {
      const [variantId, quantity] = item.split(':');
      return { variantId, quantity: parseInt(quantity) };
    });

    // Create payment intent
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
        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Checkout init error:', err);
        setError('Failed to initialize checkout');
        setLoading(false);
      });
  }, [searchParams]);

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto' }}>
        <h1>Checkout Error</h1>
        <p style={{ color: '#c00' }}>{error}</p>
        <a href="/products" style={{ color: '#0070f3' }}>← Back to Products</a>
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
