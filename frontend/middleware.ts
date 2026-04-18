import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth?: { user?: { role?: string; tenant_id?: string } } }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const user = session?.user as { role?: string; tenant_id?: string } | undefined;

  // Redirect logged-in users away from /login
  if (pathname === "/login") {
    if (user) {
      const dest =
        user.role === "admin"
          ? "/admin"
          : `/dashboard/${user.tenant_id}`;
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // All other routes require auth
  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes — require admin role
  if (pathname.startsWith("/admin")) {
    if (user.role !== "admin") {
      return NextResponse.redirect(new URL(`/dashboard/${user.tenant_id}`, req.url));
    }
    return NextResponse.next();
  }

  // Client dashboard routes — scope by tenantId in path
  const dashboardMatch = pathname.match(/^\/dashboard\/([^/]+)/);
  if (dashboardMatch) {
    const pathTenantId = dashboardMatch[1];
    if (user.role === "admin") {
      return NextResponse.next(); // admin can access any tenant
    }
    if (user.tenant_id !== pathTenantId) {
      return NextResponse.redirect(new URL(`/dashboard/${user.tenant_id}`, req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
