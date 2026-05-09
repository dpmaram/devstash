import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth((request) => {
  // Allow public access to upgrade page
  if (request.nextUrl.pathname.startsWith("/upgrade")) {
    return NextResponse.next();
  }

  if (request.auth) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/sign-in", request.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", request.nextUrl.href);

  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: [
    "/upgrade/:path*",
    "/dashboard/:path*",
    "/collections/:path*",
    "/items/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/favorites/:path*",
  ],
};
