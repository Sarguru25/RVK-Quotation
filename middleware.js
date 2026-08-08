import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Admin only routes
    if (
      (pathname.startsWith("/api/users") || pathname.startsWith("/admin")) &&
      token?.role !== "Admin"
    ) {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
    }

    // Manager & Admin can access team routes; Employee can't view others'
    // Additional API logic in route handlers, but a basic guard:
    if (
      pathname.startsWith("/api/quotations") &&
      req.method !== "GET" &&
      token?.role === "Employee"
    ) {
      // Employees can access only their own via API filter, not block here
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/quotations/:path*",
    "/api/quotations/:path*",
    "/api/users/:path*",
  ],
};