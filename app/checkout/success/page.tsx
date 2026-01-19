import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
      <h1 style={{ marginBottom: '16px' }}>Payment Successful!</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        Thank you for your purchase. You'll receive a confirmation email shortly.
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
        Continue Shopping
      </Link>
    </div>
  );
}
