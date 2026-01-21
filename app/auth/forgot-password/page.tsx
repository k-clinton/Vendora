'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Password reset link sent! Please check your email.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to send reset link.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ maxWidth: '500px', margin: '60px auto', padding: '40px', textAlign: 'center', border: '1px solid #eee', borderRadius: '8px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
        <h1 style={{ marginBottom: '16px' }}>Check Your Email</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          {message}
        </p>
        <div style={{ 
          background: '#f9fafb', 
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
            <strong>Next steps:</strong>
          </p>
          <ol style={{ fontSize: '14px', color: '#666', paddingLeft: '20px', margin: 0 }}>
            <li style={{ marginBottom: '8px' }}>Check your email inbox (and spam folder)</li>
            <li style={{ marginBottom: '8px' }}>Click the password reset link</li>
            <li>Follow the instructions to set a new password</li>
          </ol>
        </div>
        <Link 
          href="/auth/signin"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '500',
          }}
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '24px', border: '1px solid #eee', borderRadius: '8px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>Forgot Password?</h1>
      <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '24px' }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              fontSize: '14px'
            }}
          />
        </div>

        {status === 'error' && (
          <div style={{ 
            color: '#ef4444', 
            marginBottom: '16px', 
            fontSize: '14px',
            padding: '12px',
            background: '#fee2e2',
            borderRadius: '6px',
            border: '1px solid #fca5a5'
          }}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            width: '100%',
            padding: '12px',
            background: status === 'loading' ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            fontWeight: '500',
          }}
        >
          {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
        <Link href="/auth/signin" style={{ color: '#0070f3' }}>← Back to Sign In</Link>
      </div>
    </div>
  );
}
