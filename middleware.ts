import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET || 'fallback-secret'
    });
    const isAdmin = (token as any)?.role === 'ADMIN';
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
