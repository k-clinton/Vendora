import './globals.css';
import type { ReactNode } from 'react';
import { SessionProvider } from '@/components/session-provider';
import { CartProvider } from '@/components/cart-provider';
import { AuthButton } from '@/components/auth-button';
import { CartIcon } from '@/components/cart-icon';
import Link from 'next/link';
import { auth } from '@/lib/auth';

export const metadata = {
  title: 'Vendora',
  description: 'Full-stack e-commerce with realtime inventory',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <CartProvider>
            <header style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <Link href="/" style={{ fontWeight: 'bold', fontSize: '18px', textDecoration: 'none', color: '#000' }}>Vendora</Link>
                <Link href="/products" style={{ textDecoration: 'none', color: '#666' }}>Products</Link>
                <Link href="/orders" style={{ textDecoration: 'none', color: '#666' }}>Orders</Link>
                {session?.user?.isAdmin && (
                  <Link href="/admin" style={{ textDecoration: 'none', color: '#0070f3', fontWeight: '500' }}>Admin</Link>
                )}
              </nav>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <CartIcon />
                <AuthButton />
              </div>
            </header>
            <main style={{ padding: 16 }}>{children}</main>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
