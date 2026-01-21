'use client';

import { useState, useMemo } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export function CheckoutForm({ onSuccess }: { onSuccess?: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const paymentElementOptions = useMemo(() => ({
    layout: 'tabs' as const
  }), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !isReady) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    // Trigger form validation and wallet collection
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setMessage(submitError.message || 'Validation failed');
      setIsProcessing(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (error) {
      setMessage(error.message || 'An error occurred');
      setIsProcessing(false);
    } else {
      // Payment succeeded
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
      {!stripe || !elements ? (
        <div style={{ 
          padding: '16px', 
          background: '#f5f5f5', 
          borderRadius: '4px',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          Loading payment form...
        </div>
      ) : (
        <PaymentElement 
          onReady={() => setIsReady(true)}
          options={paymentElementOptions}
        />
      )}
      
      {message && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c00'
        }}>
          {message}
        </div>
      )}

      <button
        disabled={!stripe || !elements || !isReady || isProcessing}
        style={{
          marginTop: '20px',
          width: '100%',
          padding: '12px',
          background: (!stripe || !elements || !isReady || isProcessing) ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: '500',
          cursor: (!stripe || !elements || !isReady || isProcessing) ? 'not-allowed' : 'pointer',
        }}
        title={!stripe || !elements ? 'Payment system loading...' : !isReady ? 'Payment form loading...' : ''}
      >
        {isProcessing ? 'Processing...' : !isReady ? 'Loading...' : 'Pay Now'}
      </button>
    </form>
  );
}
