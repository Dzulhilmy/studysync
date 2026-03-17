import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    
    // Safely extract, lowercase, and trim the role
    const token = req.nextauth.token
    const role = String(token?.role || '').toLowerCase().trim()

    // Print to terminal so we can see what the middleware sees
    console.log(`🛡️ [Middleware] Path: ${pathname} | Token Role: '${token?.role}' | Parsed Role: '${role}'`)

    // Allow print pages without role restrictions (accessible to any authenticated user)
    if (pathname.includes('/print')) {
      return NextResponse.next()
    }

    // Role-based route guards
    if (pathname.startsWith('/admin') && role !== 'admin') {
      console.log('🚫 [Middleware] Kicking out of /admin. Role is not admin.')
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (pathname.startsWith('/teacher') && role !== 'teacher') {
      console.log('🚫 [Middleware] Kicking out of /teacher. Role is not teacher.')
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (pathname.startsWith('/student') && role !== 'student') {
      console.log('🚫 [Middleware] Kicking out of /student. Role is not student.')
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