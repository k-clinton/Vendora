import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { SQLiteAdapter } from "@/lib/auth-adapter";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      role?: "ADMIN" | "CUSTOMER";
      isAdmin?: boolean;
    };
  }
}

const adminEmails = new Set(
  (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean),
);

export const authConfig = {
  adapter: SQLiteAdapter(),
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = db
          .prepare("SELECT * FROM users WHERE email = ?")
          .get(credentials.email) as any;
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const email = user.email || "";
        const isAdmin = adminEmails.has(email);
        token.role = isAdmin ? "ADMIN" : "CUSTOMER";
        // If user was fetched from DB (Credentials), trust that role, otherwise check admin list
        if ((user as any).role === "ADMIN") token.role = "ADMIN";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = (token as any).role ?? "CUSTOMER";
      session.user.isAdmin = session.user.role === "ADMIN";
      return session;
    },
  },
  trustHost: true,
  secret: env.NEXTAUTH_SECRET,
} satisfies Parameters<typeof NextAuth>[0];

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
