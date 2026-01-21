import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { SQLiteAdapter } from "@/lib/auth-adapter";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { type Role, isAdminRole } from "@/lib/permissions";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id?: string;
      role?: Role;
      isAdmin?: boolean;
    };
  }
  interface User {
    role?: Role;
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
      allowDangerousEmailAccountLinking: true,
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

        // Check if user is disabled
        if (user.disabled === 1) {
          throw new Error(
            "Account disabled: " + (user.disabled_reason || "Contact support"),
          );
        }

        // Check if email is verified (allow admin bypass)
        const isAdmin = adminEmails.has(credentials.email as string);
        console.log(
          `[Auth] Login attempt: ${credentials.email}, isAdmin: ${isAdmin}, email_verified: ${user.email_verified}`,
        );

        if (!isAdmin && !user.email_verified) {
          throw new Error(
            "Please verify your email before signing in. Check your inbox for the verification link.",
          );
        }

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
          role: user.role as Role,
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
        token.id = user.id;
        const email = user.email || "";

        // Get role from database for authenticated users
        const dbUser = db
          .prepare("SELECT role, disabled FROM users WHERE email = ?")
          .get(email) as any;

        if (dbUser) {
          // Check if user is disabled
          if (dbUser.disabled === 1) {
            throw new Error("Account has been disabled");
          }

          // Use role from database, or check admin emails as fallback
          token.role = dbUser.role as Role;
        } else if (adminEmails.has(email)) {
          token.role = "ADMIN";
        } else {
          token.role = "CUSTOMER";
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = (token as any).id;
      session.user.role = (token as any).role ?? "CUSTOMER";
      session.user.isAdmin = isAdminRole(session.user.role);
      return session;
    },
  },
  trustHost: true,
  secret: env.NEXTAUTH_SECRET,
} satisfies Parameters<typeof NextAuth>[0];

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
