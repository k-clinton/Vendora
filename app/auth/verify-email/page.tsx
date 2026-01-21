'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      // Verify the token
      setStatus('loading');
      fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setStatus('success');
            setMessage('Email verified successfully! You can now sign in.');
            setTimeout(() => {
              router.push('/auth/signin?verified=true');
            }, 3000);
          } else {
            setStatus('error');
            setMessage(data.error || 'Verification failed. The link may be expired or invalid.');
          }
        })
        .catch(() => {
          setStatus('error');
          setMessage('An error occurred during verification.');
        });
    }
  }, [token, router]);

  if (status === 'loading') {
    return (
      <div style={{ maxWidth: '500px', margin: '60px auto', padding: '40px', textAlign: 'center', border: '1px solid #eee', borderRadius: '8px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <h1 style={{ marginBottom: '16px' }}>Verifying your email...</h1>
        <p style={{ color: '#666' }}>Please wait while we verify your email address.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ maxWidth: '500px', margin: '60px auto', padding: '40px', textAlign: 'center', border: '1px solid #eee', borderRadius: '8px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h1 style={{ marginBottom: '16px', color: '#10b981' }}>Email Verified!</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>{message}</p>
        <p style={{ fontSize: '14px', color: '#999' }}>Redirecting to sign in...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ maxWidth: '500px', margin: '60px auto', padding: '40px', textAlign: 'center', border: '1px solid #eee', borderRadius: '8px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
        <h1 style={{ marginBottom: '16px', color: '#ef4444' }}>Verification Failed</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>{message}</p>
        <Link 
          href="/auth/register"
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
          Try Again
        </Link>
      </div>
    );
  }

  // Pending state (no token, just email confirmation)
  return (
    <div style={{ maxWidth: '500px', margin: '60px auto', padding: '40px', textAlign: 'center', border: '1px solid #eee', borderRadius: '8px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
      <h1 style={{ marginBottom: '16px' }}>Check Your Email</h1>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        We've sent a verification link to:
      </p>
      {email && (
        <p style={{ fontWeight: '600', fontSize: '16px', marginBottom: '24px' }}>
          {email}
        </p>
      )}
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
          <li style={{ marginBottom: '8px' }}>Click the verification link in the email</li>
          <li>You'll be redirected back here to complete the process</li>
        </ol>
      </div>
      <p style={{ fontSize: '14px', color: '#999', marginBottom: '16px' }}>
        Didn't receive the email?
      </p>
      <button
        onClick={async () => {
          if (!email) return;
          setStatus('loading');
          try {
            const res = await fetch('/api/auth/resend-verification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.success) {
              setStatus('pending');
              alert('Verification email sent! Please check your inbox.');
            } else {
              setStatus('pending');
              alert(data.error || 'Failed to resend email.');
            }
          } catch {
            setStatus('pending');
            alert('An error occurred. Please try again.');
          }
        }}
        style={{
          padding: '10px 20px',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '14px',
          cursor: 'pointer',
          fontWeight: '500',
        }}
      >
        Resend Verification Email
      </button>
      <div style={{ marginTop: '24px' }}>
        <Link href="/auth/signin" style={{ color: '#0070f3', fontSize: '14px' }}>
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '60px' }}>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
