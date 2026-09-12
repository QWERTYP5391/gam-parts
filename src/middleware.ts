import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const DEALER_ONLY_PATHS = ["/inventory"];
const REQUESTER_ONLY_PATHS = ["/requests/new"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect all dashboard routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/inventory")
  ) {
    if (!req.auth) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = req.auth.user.role;

    // Dealer-only routes
    for (const path of DEALER_ONLY_PATHS) {
      if (pathname.startsWith(path) && role !== "dealer") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Requester-only routes
    for (const path of REQUESTER_ONLY_PATHS) {
      if (pathname.startsWith(path) && role === "dealer") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (req.auth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/search/:path*",
    "/requests/:path*",
    "/inventory/:path*",
    "/login",
    "/register",
  ],
};
