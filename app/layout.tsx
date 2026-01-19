import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'E-commerce Store',
  description: 'Full-stack e-commerce with realtime inventory',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{ padding: 16, borderBottom: '1px solid #eee' }}>
          <a href="/">Store</a>
        </header>
        <main style={{ padding: 16 }}>{children}</main>
      </body>
    </html>
  );
}
