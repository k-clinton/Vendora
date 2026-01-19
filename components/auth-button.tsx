'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div style={{ fontSize: '14px', color: '#666' }}>Loading...</div>;
  }

  if (session?.user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '14px' }}>
          {session.user.name || session.user.email}
          {session.user.isAdmin && <span style={{ marginLeft: '8px', color: '#0070f3' }}>(Admin)</span>}
        </span>
        <button
          onClick={() => signOut()}
          style={{
            padding: '8px 16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <Link 
        href="/auth/signin"
        style={{
          padding: '8px 16px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: 'white',
          textDecoration: 'none',
          color: '#333',
        }}
      >
        Sign In
      </Link>
      <Link
        href="/auth/register"
        style={{
          padding: '8px 16px',
          borderRadius: '4px',
          background: '#0070f3',
          color: 'white',
          textDecoration: 'none',
        }}
      >
        Sign Up
      </Link>
    </div>
  );
}
