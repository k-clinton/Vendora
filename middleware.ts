import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define admin routes that require specific permissions
const ADMIN_ROUTES = {
  "/admin/users": ["ADMIN"],
  "/admin/finance": ["ADMIN", "VIEWER"],
  "/admin/settings": ["ADMIN"],
} as const;

export async function middleware(req: NextRequest) {
  // Protect admin routes
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret",
    });

    const userRole = (token as any)?.role;

    // Check if user has any admin role
    const validAdminRoles = ["ADMIN", "STAFF", "VIEWER"];
    if (!userRole || !validAdminRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Check specific route permissions
    for (const [route, allowedRoles] of Object.entries(ADMIN_ROUTES)) {
      if (req.nextUrl.pathname.startsWith(route)) {
        if (!allowedRoles.includes(userRole)) {
          // Redirect to main admin dashboard if user doesn't have permission
          return NextResponse.redirect(new URL("/admin", req.url));
        }
      }
    }
  }

  // Protect admin API routes
  if (req.nextUrl.pathname.startsWith("/api/admin")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret",
    });

    const userRole = (token as any)?.role;
    const validAdminRoles = ["ADMIN", "STAFF", "VIEWER"];

    // Strict Admin Redirect: If admin is on non-admin page (e.g. root, shop), redirect to admin dashboard.
    // Exclude auth pages, api, and next internal paths.
    if (userRole && validAdminRoles.includes(userRole as string)) {
      const isSystemPath =
        req.nextUrl.pathname.startsWith("/api") ||
        req.nextUrl.pathname.startsWith("/_next") ||
        req.nextUrl.pathname.startsWith("/static") ||
        req.nextUrl.pathname.startsWith("/auth") ||
        req.nextUrl.pathname.includes("."); // files like favicon.ico

      if (!req.nextUrl.pathname.startsWith("/admin") && !isSystemPath) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }

    if (!userRole || !validAdminRoles.includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
