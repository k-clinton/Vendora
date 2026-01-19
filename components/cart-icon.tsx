'use client';

import Link from 'next/link';
import { useCart } from './cart-provider';

export function CartIcon() {
  const { itemCount } = useCart();

  return (
    <Link 
      href="/cart"
      style={{
        position: 'relative',
        textDecoration: 'none',
        color: '#000',
        fontSize: '24px',
      }}
    >
      🛒
      {itemCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: '#0070f3',
          color: 'white',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </Link>
  );
}
