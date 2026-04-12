import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Must match the value set by the login API route
const SESSION_TOKEN = 'mm_valid_session_v1'
const COOKIE_NAME = 'mm_session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get(COOKIE_NAME)
  const isAuthenticated = sessionCookie?.value === SESSION_TOKEN

  // Protect /admin
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect already-authenticated users away from /login
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
