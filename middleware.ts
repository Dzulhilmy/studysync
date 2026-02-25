import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const role = req.nextauth.token?.role as string

    // Role-based route guards
    if (pathname.startsWith('/admin')   && role !== 'admin')   {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (pathname.startsWith('/teacher') && role !== 'teacher') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (pathname.startsWith('/student') && role !== 'student') {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // No valid token → redirect to /login (NextAuth default signIn page)
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',   // unauthenticated users land here, NOT /dashboard
    },
  }
)

// Protect every authenticated route
export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/dashboard/:path*',
    '/subjects/:path*',
    '/projects/:path*',
    '/announcements/:path*',
    '/profile/:path*',
  ],
}