import NextAuth, { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { SQLiteAdapter } from '@/lib/auth-adapter';
import { env } from '@/lib/env';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: DefaultSession['user'] & { role?: 'ADMIN' | 'CUSTOMER'; isAdmin?: boolean };
  }
}

const adminEmails = new Set((env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean));

export const authConfig = {
  adapter: SQLiteAdapter(),
  providers: [
    Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }),
    GitHub({ clientId: env.GITHUB_ID, clientSecret: env.GITHUB_SECRET }),
  ],
  session: { strategy: 'jwt' as const },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        const isAdmin = adminEmails.has(user.email);
        token.role = isAdmin ? 'ADMIN' : 'CUSTOMER';
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = (token as any).role ?? 'CUSTOMER';
      session.user.isAdmin = session.user.role === 'ADMIN';
      return session;
    },
  },
  trustHost: true,
  secret: env.NEXTAUTH_SECRET,
} satisfies Parameters<typeof NextAuth>[0];
