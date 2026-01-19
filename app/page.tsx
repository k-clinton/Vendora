import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>Welcome to Vendora</h1>
      <p style={{ fontSize: '20px', color: '#666', marginBottom: '32px' }}>
        Your modern e-commerce platform with real-time inventory tracking
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3>🔐 Secure Auth</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>Google & GitHub OAuth</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3>💳 Stripe Payments</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>Safe & easy checkout</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3>⚡ Real-time Updates</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>Live inventory via Ably</p>
        </div>
      </div>

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
