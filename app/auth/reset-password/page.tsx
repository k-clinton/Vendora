'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    // Could optionally verify token on page load
    setTokenValid(true);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('Password reset successfully!');
        setTimeout(() => {
          router.push('/auth/signin?reset=success');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to reset password.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  if (tokenValid === false || !token) {
    return (
      <div style={{ maxWidth: '500px', margin: '60px auto', padding: '40px', textAlign: 'center', border: '1px solid #eee', borderRadius: '8px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
        <h1 style={{ marginBottom: '16px', color: '#ef4444' }}>Invalid Link</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          This password reset link is invalid or has expired.
        </p>
        <Link 
          href="/auth/forgot-password"
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
          Request New Link
        </Link>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ maxWidth: '500px', margin: '60px auto', padding: '40px', textAlign: 'center', border: '1px solid #eee', borderRadius: '8px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h1 style={{ marginBottom: '16px', color: '#10b981' }}>Password Reset!</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          {message}
        </p>
        <p style={{ fontSize: '14px', color: '#999' }}>Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '24px', border: '1px solid #eee', borderRadius: '8px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>Reset Password</h1>
      <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '24px' }}>
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            New Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ 
                width: '100%', 
                padding: '10px',
                paddingRight: '40px',
                borderRadius: '4px', 
                border: '1px solid #ccc',
                fontSize: '14px'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#666',
                padding: '0',
              }}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              style={{ 
                width: '100%', 
                padding: '10px',
                paddingRight: '40px',
                borderRadius: '4px', 
                border: '1px solid #ccc',
                fontSize: '14px'
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#666',
                padding: '0',
              }}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
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
          {status === 'loading' ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
        <Link href="/auth/signin" style={{ color: '#0070f3' }}>← Back to Sign In</Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '60px' }}>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
