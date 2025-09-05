import { NextResponse } from "next/server"
import { verifyToken } from "./lib/auth"

export function middleware(request) {
  const token = request.cookies.get("token")?.value
  const { pathname } = request.nextUrl

  // Protected routes
  const protectedRoutes = ["/dashboard", "/profile", "/admin"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token) {
    const decoded = verifyToken(token)
    if (!decoded && isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/admin/:path*"],
}
